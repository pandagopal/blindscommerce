// Tuya Cloud API Integration - Direct communication with Tuya IoT platform

import crypto from 'crypto';
import axios from 'axios';
import { EventEmitter } from 'events';

interface TuyaDevice {
  id: string;              // Tuya device ID
  name: string;            // Device name
  local_key: string;       // Device encryption key
  category: string;        // Device category (cl = curtain/blind)
  product_id: string;      // Product model ID
  uuid: string;            // Unique device identifier
  status: TuyaDeviceStatus[];
  online: boolean;
}

interface TuyaDeviceStatus {
  code: string;            // Status code (e.g., 'percent_control', 'control')
  value: any;              // Status value
}

interface TuyaCommand {
  commands: {
    code: string;          // Command code
    value: any;            // Command value
  }[];
}

class TuyaCloudAPI extends EventEmitter {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  constructor(
    clientId: string, 
    clientSecret: string, 
    region: 'us' | 'eu' | 'cn' | 'in' = 'us'
  ) {
    super();
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = `https://openapi.tuya${region === 'cn' ? 'cn' : ''}.com`;
  }

  // Initialize connection and authenticate
  async initialize(): Promise<void> {
    try {
      await this.getAccessToken();
    } catch (error) {
      console.error('Failed to initialize Tuya Cloud API:', error);
      throw error;
    }
  }

  // Get access token using client credentials
  private async getAccessToken(): Promise<void> {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Create signature for authentication
    const stringToSign = `${this.clientId}${timestamp}${nonce}`;
    const sign = crypto
      .createHmac('sha256', this.clientSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1.0/token?grant_type=1`,
        {},
        {
          headers: {
            'client_id': this.clientId,
            'sign': sign,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce
          }
        }
      );

      if (response.data.success) {
        this.accessToken = response.data.result.access_token;
        this.refreshToken = response.data.result.refresh_token;
        this.tokenExpiry = Date.now() + (response.data.result.expire_time * 1000);
      } else {
        throw new Error(`Token request failed: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('Error getting Tuya access token:', error);
      throw error;
    }
  }

  // Ensure valid access token
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) { // Refresh 1 minute before expiry
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        await this.getAccessToken();
      }
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<void> {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const stringToSign = `${this.clientId}${timestamp}${nonce}${this.refreshToken}`;
    const sign = crypto
      .createHmac('sha256', this.clientSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1.0/token/${this.refreshToken}`,
        {
          headers: {
            'client_id': this.clientId,
            'sign': sign,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce
          }
        }
      );

      if (response.data.success) {
        this.accessToken = response.data.result.access_token;
        this.refreshToken = response.data.result.refresh_token;
        this.tokenExpiry = Date.now() + (response.data.result.expire_time * 1000);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.getAccessToken(); // Fall back to new token
    }
  }

  // Make authenticated API request
  private async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any): Promise<any> {
    await this.ensureValidToken();
    
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Create signature
    const bodyStr = data ? JSON.stringify(data) : '';
    const stringToSign = `${method}\n${crypto.createHash('sha256').update(bodyStr).digest('hex')}\n\n${endpoint}`;
    const signStr = `${this.clientId}${this.accessToken}${timestamp}${nonce}${stringToSign}`;
    const sign = crypto
      .createHmac('sha256', this.clientSecret)
      .update(signStr)
      .digest('hex')
      .toUpperCase();

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'client_id': this.clientId,
        'access_token': this.accessToken,
        'sign': sign,
        'sign_method': 'HMAC-SHA256',
        't': timestamp,
        'nonce': nonce,
        'Content-Type': 'application/json'
      },
      data: data || undefined
    };

    try {
      const response = await axios(config);
      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`API request failed: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('Tuya API request error:', error);
      throw error;
    }
  }

  // Get all devices for the authenticated user
  async getDevices(): Promise<TuyaDevice[]> {
    try {
      const result = await this.makeRequest('GET', '/v1.0/devices');
      return result.list || [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  // Get devices by category (cl = curtain/blind)
  async getBlindDevices(): Promise<TuyaDevice[]> {
    try {
      const devices = await this.getDevices();
      return devices.filter(device => 
        device.category === 'cl' || // Curtain/blind category
        device.category === 'clkg' || // Curtain switch
        device.name.toLowerCase().includes('blind') ||
        device.name.toLowerCase().includes('curtain')
      );
    } catch (error) {
      console.error('Error fetching blind devices:', error);
      return [];
    }
  }

  // Get device status
  async getDeviceStatus(deviceId: string): Promise<TuyaDeviceStatus[]> {
    try {
      const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/status`);
      return result || [];
    } catch (error) {
      console.error('Error fetching device status:', error);
      return [];
    }
  }

  // Send command to device
  async sendCommand(deviceId: string, commands: TuyaCommand['commands']): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/v1.0/devices/${deviceId}/commands`, { commands });
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }

  // Blind-specific commands
  async openBlind(deviceId: string): Promise<boolean> {
    return this.sendCommand(deviceId, [
      { code: 'control', value: '1' } // Open command
    ]);
  }

  async closeBlind(deviceId: string): Promise<boolean> {
    return this.sendCommand(deviceId, [
      { code: 'control', value: '2' } // Close command
    ]);
  }

  async stopBlind(deviceId: string): Promise<boolean> {
    return this.sendCommand(deviceId, [
      { code: 'control', value: '3' } // Stop command
    ]);
  }

  async setBlindPosition(deviceId: string, position: number): Promise<boolean> {
    // Position: 0-100 (0 = fully closed, 100 = fully open)
    return this.sendCommand(deviceId, [
      { code: 'percent_control', value: position }
    ]);
  }

  // Get current blind position
  async getBlindPosition(deviceId: string): Promise<number | null> {
    try {
      const status = await this.getDeviceStatus(deviceId);
      const positionStatus = status.find(s => s.code === 'percent_control' || s.code === 'position');
      return positionStatus ? Number(positionStatus.value) : null;
    } catch (error) {
      console.error('Error getting blind position:', error);
      return null;
    }
  }

  // Check if device is online
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      const devices = await this.getDevices();
      const device = devices.find(d => d.id === deviceId);
      return device ? device.online : false;
    } catch (error) {
      console.error('Error checking device online status:', error);
      return false;
    }
  }

  // Get device information
  async getDeviceInfo(deviceId: string): Promise<TuyaDevice | null> {
    try {
      const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}`);
      return result;
    } catch (error) {
      console.error('Error fetching device info:', error);
      return null;
    }
  }

  // Set up webhook for real-time status updates (optional)
  async setupWebhook(webhookUrl: string): Promise<void> {
    try {
      await this.makeRequest('POST', '/v1.0/devices/webhook', {
        url: webhookUrl,
        events: ['status', 'online', 'offline']
      });
    } catch (error) {
      console.error('Error setting up webhook:', error);
    }
  }

  // Handle webhook events (call this when webhook is triggered)
  handleWebhookEvent(event: any): void {
    try {
      const { devId, status, online } = event;
      
      if (status) {
        this.emit('statusUpdate', {
          deviceId: devId,
          status: status
        });
      }
      
      if (online !== undefined) {
        this.emit('onlineStatus', {
          deviceId: devId,
          online: online
        });
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
    }
  }

  // Get device capabilities/functions
  async getDeviceFunctions(deviceId: string): Promise<any[]> {
    try {
      const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/functions`);
      return result.functions || [];
    } catch (error) {
      console.error('Error fetching device functions:', error);
      return [];
    }
  }

  // Get device specifications
  async getDeviceSpecifications(deviceId: string): Promise<any> {
    try {
      const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/specifications`);
      return result;
    } catch (error) {
      console.error('Error fetching device specifications:', error);
      return null;
    }
  }

  // Create device group for simultaneous control
  async createDeviceGroup(name: string, deviceIds: string[]): Promise<string | null> {
    try {
      const result = await this.makeRequest('POST', '/v1.0/device-groups', {
        name,
        device_ids: deviceIds
      });
      return result.group_id;
    } catch (error) {
      console.error('Error creating device group:', error);
      return null;
    }
  }

  // Control device group
  async controlDeviceGroup(groupId: string, commands: TuyaCommand['commands']): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/v1.0/device-groups/${groupId}/commands`, { commands });
      return true;
    } catch (error) {
      console.error('Error controlling device group:', error);
      return false;
    }
  }

  // Scene automation
  async createScene(name: string, actions: any[]): Promise<string | null> {
    try {
      const result = await this.makeRequest('POST', '/v1.0/scenes', {
        name,
        actions
      });
      return result.scene_id;
    } catch (error) {
      console.error('Error creating scene:', error);
      return null;
    }
  }

  async triggerScene(sceneId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/v1.0/scenes/${sceneId}/trigger`, {});
      return true;
    } catch (error) {
      console.error('Error triggering scene:', error);
      return false;
    }
  }

  // Get historical data
  async getDeviceStatistics(deviceId: string, startTime: number, endTime: number): Promise<any[]> {
    try {
      const result = await this.makeRequest(
        'GET', 
        `/v1.0/devices/${deviceId}/statistics?start_time=${startTime}&end_time=${endTime}`
      );
      return result.list || [];
    } catch (error) {
      console.error('Error fetching device statistics:', error);
      return [];
    }
  }
}

export default TuyaCloudAPI;
export { TuyaDevice, TuyaDeviceStatus, TuyaCommand };