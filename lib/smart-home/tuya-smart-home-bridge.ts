// Tuya Smart Home Bridge - Connects Tuya devices to universal smart home platforms

import TuyaCloudAPI, { TuyaDevice } from './protocols/tuya-cloud-api';
import { EventEmitter } from 'events';

interface SmartHomePlatformDevice {
  tuyaDeviceId: string;
  platformDeviceId: string;
  platform: 'alexa' | 'google' | 'homekit' | 'smartthings' | 'matter';
  deviceName: string;
  roomName: string;
  capabilities: string[];
  lastSync: Date;
}

class TuyaSmartHomeBridge extends EventEmitter {
  private tuyaApi: TuyaCloudAPI;
  private platformDevices: Map<string, SmartHomePlatformDevice[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  
  constructor(
    tuyaClientId: string,
    tuyaClientSecret: string,
    tuyaRegion: 'us' | 'eu' | 'cn' | 'in' = 'us'
  ) {
    super();
    this.tuyaApi = new TuyaCloudAPI(tuyaClientId, tuyaClientSecret, tuyaRegion);
    this.setupEventHandlers();
  }

  // Initialize the bridge
  async initialize(): Promise<void> {
    try {
      await this.tuyaApi.initialize();
      await this.discoverAndSyncDevices();
      this.startPeriodicSync();
      console.log('Tuya Smart Home Bridge initialized');
    } catch (error) {
      console.error('Failed to initialize Tuya bridge:', error);
      throw error;
    }
  }

  // Set up event handlers
  private setupEventHandlers(): void {
    // Handle Tuya status updates
    this.tuyaApi.on('statusUpdate', (data) => {
      this.handleTuyaStatusUpdate(data);
    });

    this.tuyaApi.on('onlineStatus', (data) => {
      this.handleTuyaOnlineStatus(data);
    });
  }

  // Discover Tuya devices and sync with smart home platforms
  async discoverAndSyncDevices(): Promise<void> {
    try {
      const blindDevices = await this.tuyaApi.getBlindDevices();
      console.log(`Found ${blindDevices.length} Tuya blind devices`);

      for (const device of blindDevices) {
        await this.syncDeviceToAllPlatforms(device);
      }
    } catch (error) {
      console.error('Error discovering devices:', error);
    }
  }

  // Sync a Tuya device to all smart home platforms
  private async syncDeviceToAllPlatforms(tuyaDevice: TuyaDevice): Promise<void> {
    const platforms = ['alexa', 'google', 'homekit', 'smartthings', 'matter'] as const;
    
    for (const platform of platforms) {
      try {
        const platformDevice = await this.createPlatformDevice(tuyaDevice, platform);
        
        if (!this.platformDevices.has(tuyaDevice.id)) {
          this.platformDevices.set(tuyaDevice.id, []);
        }
        
        this.platformDevices.get(tuyaDevice.id)!.push(platformDevice);
        this.emit('deviceSynced', { tuyaDevice, platformDevice });
      } catch (error) {
        console.error(`Failed to sync device to ${platform}:`, error);
      }
    }
  }

  // Create platform-specific device representation
  private async createPlatformDevice(
    tuyaDevice: TuyaDevice, 
    platform: SmartHomePlatformDevice['platform']
  ): Promise<SmartHomePlatformDevice> {
    const platformDeviceId = this.generatePlatformDeviceId(tuyaDevice, platform);
    const capabilities = this.getTuyaDeviceCapabilities(tuyaDevice);
    
    const platformDevice: SmartHomePlatformDevice = {
      tuyaDeviceId: tuyaDevice.id,
      platformDeviceId,
      platform,
      deviceName: tuyaDevice.name || `Blind ${tuyaDevice.id.slice(-4)}`,
      roomName: this.extractRoomFromName(tuyaDevice.name),
      capabilities,
      lastSync: new Date()
    };

    // Register with the specific platform
    await this.registerDeviceWithPlatform(tuyaDevice, platformDevice);
    
    return platformDevice;
  }

  // Generate platform-specific device ID
  private generatePlatformDeviceId(tuyaDevice: TuyaDevice, platform: string): string {
    return `${platform}_tuya_${tuyaDevice.id}`;
  }

  // Extract room name from device name
  private extractRoomFromName(deviceName: string): string {
    const roomKeywords = [
      'living', 'bedroom', 'kitchen', 'bathroom', 'office', 
      'dining', 'family', 'master', 'guest', 'study'
    ];
    
    const lowerName = deviceName.toLowerCase();
    for (const keyword of roomKeywords) {
      if (lowerName.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    
    return 'Unknown';
  }

  // Get Tuya device capabilities
  private getTuyaDeviceCapabilities(tuyaDevice: TuyaDevice): string[] {
    const capabilities = ['position_control'];
    
    // Check device status for available functions
    if (tuyaDevice.status) {
      const statusCodes = tuyaDevice.status.map(s => s.code);
      
      if (statusCodes.includes('control')) capabilities.push('open_close');
      if (statusCodes.includes('percent_control')) capabilities.push('percentage_control');
      if (statusCodes.includes('position')) capabilities.push('position_reporting');
      if (statusCodes.includes('work_state')) capabilities.push('work_state');
    }
    
    return capabilities;
  }

  // Register device with specific platform
  private async registerDeviceWithPlatform(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    switch (platformDevice.platform) {
      case 'alexa':
        await this.registerWithAlexa(tuyaDevice, platformDevice);
        break;
      case 'google':
        await this.registerWithGoogle(tuyaDevice, platformDevice);
        break;
      case 'homekit':
        await this.registerWithHomeKit(tuyaDevice, platformDevice);
        break;
      case 'smartthings':
        await this.registerWithSmartThings(tuyaDevice, platformDevice);
        break;
      case 'matter':
        await this.registerWithMatter(tuyaDevice, platformDevice);
        break;
    }
  }

  // Alexa registration
  private async registerWithAlexa(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    const alexaEndpoint = {
      endpointId: platformDevice.platformDeviceId,
      manufacturerName: 'Tuya',
      friendlyName: platformDevice.deviceName,
      description: `Smart Blind (${tuyaDevice.product_id})`,
      displayCategories: ['INTERIOR_BLIND'],
      capabilities: [
        {
          type: 'AlexaInterface',
          interface: 'Alexa.RangeController',
          instance: 'Blind.Position',
          version: '3',
          properties: {
            supported: [{ name: 'rangeValue' }],
            proactivelyReported: true,
            retrievable: true
          },
          capabilityResources: {
            friendlyNames: [
              { '@type': 'text', value: { text: 'Position', locale: 'en-US' } },
              { '@type': 'text', value: { text: 'Opening', locale: 'en-US' } }
            ]
          },
          configuration: {
            supportedRange: { minimumValue: 0, maximumValue: 100, precision: 1 },
            unitOfMeasure: 'Alexa.Unit.Percent'
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PowerController',
          version: '3',
          properties: {
            supported: [{ name: 'powerState' }],
            proactivelyReported: true,
            retrievable: true
          }
        }
      ],
      additionalAttributes: {
        manufacturer: 'Tuya',
        model: tuyaDevice.product_id,
        serialNumber: tuyaDevice.uuid,
        firmwareVersion: '1.0',
        softwareVersion: '1.0',
        customIdentifier: tuyaDevice.id
      }
    };

    // In production: Send to Alexa Smart Home API
    console.log('Alexa device registered:', alexaEndpoint.endpointId);
  }

  // Google Assistant registration
  private async registerWithGoogle(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    const googleDevice = {
      id: platformDevice.platformDeviceId,
      type: 'action.devices.types.BLINDS',
      traits: [
        'action.devices.traits.OpenClose',
        'action.devices.traits.StartStop'
      ],
      name: {
        defaultNames: ['Smart Blind', 'Window Blind'],
        name: platformDevice.deviceName,
        nicknames: [platformDevice.deviceName, `${platformDevice.roomName} Blind`]
      },
      willReportState: true,
      roomHint: platformDevice.roomName,
      deviceInfo: {
        manufacturer: 'Tuya',
        model: tuyaDevice.product_id,
        hwVersion: '1.0',
        swVersion: '1.0'
      },
      customData: {
        tuyaDeviceId: tuyaDevice.id,
        tuyaLocalKey: tuyaDevice.local_key
      }
    };

    // In production: Send to Google Home Graph API
    console.log('Google device registered:', googleDevice.id);
  }

  // HomeKit registration
  private async registerWithHomeKit(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    const homeKitAccessory = {
      UUID: platformDevice.platformDeviceId,
      displayName: platformDevice.deviceName,
      category: 'WindowCovering',
      manufacturer: 'Tuya',
      model: tuyaDevice.product_id,
      serialNumber: tuyaDevice.uuid,
      firmwareRevision: '1.0.0',
      services: [
        {
          UUID: 'WindowCovering',
          characteristics: [
            { UUID: 'CurrentPosition', value: 0, permissions: ['pr', 'ev'] },
            { UUID: 'TargetPosition', value: 0, permissions: ['pr', 'pw', 'ev'] },
            { UUID: 'PositionState', value: 2, permissions: ['pr', 'ev'] }, // Stopped
            { UUID: 'HoldPosition', permissions: ['pw'] }
          ]
        },
        {
          UUID: 'AccessoryInformation',
          characteristics: [
            { UUID: 'Manufacturer', value: 'Tuya' },
            { UUID: 'Model', value: tuyaDevice.product_id },
            { UUID: 'SerialNumber', value: tuyaDevice.uuid },
            { UUID: 'FirmwareRevision', value: '1.0.0' }
          ]
        }
      ],
      customData: {
        tuyaDeviceId: tuyaDevice.id
      }
    };

    // In production: Register with HAP-NodeJS
    console.log('HomeKit accessory registered:', homeKitAccessory.UUID);
  }

  // SmartThings registration
  private async registerWithSmartThings(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    const smartThingsDevice = {
      deviceId: platformDevice.platformDeviceId,
      name: platformDevice.deviceName,
      label: `Tuya Smart Blind - ${platformDevice.deviceName}`,
      manufacturerName: 'Tuya',
      presentationId: 'tuya-window-shade',
      deviceNetworkId: tuyaDevice.id,
      components: [
        {
          id: 'main',
          capabilities: [
            { id: 'windowShade', version: 1 },
            { id: 'switchLevel', version: 1 },
            { id: 'refresh', version: 1 }
          ]
        }
      ],
      metadata: {
        deviceType: 'WindowShade',
        ocfDeviceType: 'oic.d.blind',
        mnmn: 'Tuya',
        vid: 'tuya-window-shade'
      }
    };

    // In production: Register with SmartThings API
    console.log('SmartThings device registered:', smartThingsDevice.deviceId);
  }

  // Matter registration
  private async registerWithMatter(
    tuyaDevice: TuyaDevice, 
    platformDevice: SmartHomePlatformDevice
  ): Promise<void> {
    const matterDevice = {
      nodeId: platformDevice.platformDeviceId,
      deviceType: 0x0202, // Window Covering Device Type
      vendorId: 0x1002, // Tuya vendor ID
      productId: parseInt(tuyaDevice.product_id.slice(-4), 16) || 0x8001,
      clusters: [
        {
          clusterId: 0x0102, // Window Covering Cluster
          attributes: [
            { id: 0x0000, name: 'Type' },
            { id: 0x0007, name: 'ConfigStatus' },
            { id: 0x000A, name: 'OperationalStatus' },
            { id: 0x000D, name: 'EndProductType' },
            { id: 0x000E, name: 'CurrentPositionLiftPercent100ths' },
            { id: 0x000F, name: 'TargetPositionLiftPercent100ths' }
          ],
          commands: [
            { id: 0x00, name: 'UpOrOpen' },
            { id: 0x01, name: 'DownOrClose' },
            { id: 0x02, name: 'StopMotion' },
            { id: 0x05, name: 'GoToLiftPercentage' }
          ]
        }
      ],
      customData: {
        tuyaDeviceId: tuyaDevice.id,
        bridgeType: 'tuya-cloud'
      }
    };

    // In production: Commission with Matter fabric
    console.log('Matter device registered:', matterDevice.nodeId);
  }

  // Execute command from smart home platform
  async executeCommand(
    platform: string, 
    platformDeviceId: string, 
    command: string, 
    parameters: any = {}
  ): Promise<boolean> {
    try {
      // Find the Tuya device ID from platform device ID
      const tuyaDeviceId = this.findTuyaDeviceId(platformDeviceId);
      if (!tuyaDeviceId) {
        console.error('Tuya device not found for platform device:', platformDeviceId);
        return false;
      }

      // Execute command on Tuya device
      const success = await this.executeTuyaCommand(tuyaDeviceId, command, parameters);
      
      if (success) {
        // Propagate status update to other platforms
        setTimeout(() => this.syncDeviceStatus(tuyaDeviceId), 1000);
      }
      
      return success;
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }

  // Execute command on Tuya device
  private async executeTuyaCommand(
    tuyaDeviceId: string, 
    command: string, 
    parameters: any
  ): Promise<boolean> {
    switch (command.toLowerCase()) {
      case 'open':
      case 'up':
      case 'upopen':
        return await this.tuyaApi.openBlind(tuyaDeviceId);
        
      case 'close':
      case 'down':
      case 'downclose':
        return await this.tuyaApi.closeBlind(tuyaDeviceId);
        
      case 'stop':
      case 'stopmotion':
        return await this.tuyaApi.stopBlind(tuyaDeviceId);
        
      case 'setposition':
      case 'gotoliftpercentage':
      case 'percent_control':
        const position = parameters.position || parameters.rangeValue || parameters.openPercent || 0;
        return await this.tuyaApi.setBlindPosition(tuyaDeviceId, position);
        
      default:
        console.warn('Unknown command:', command);
        return false;
    }
  }

  // Find Tuya device ID from platform device ID
  private findTuyaDeviceId(platformDeviceId: string): string | null {
    for (const [tuyaDeviceId, platformDevices] of this.platformDevices) {
      if (platformDevices.some(pd => pd.platformDeviceId === platformDeviceId)) {
        return tuyaDeviceId;
      }
    }
    return null;
  }

  // Sync device status across all platforms
  private async syncDeviceStatus(tuyaDeviceId: string): Promise<void> {
    try {
      const status = await this.tuyaApi.getDeviceStatus(tuyaDeviceId);
      const position = await this.tuyaApi.getBlindPosition(tuyaDeviceId);
      const isOnline = await this.tuyaApi.isDeviceOnline(tuyaDeviceId);
      
      const platformDevices = this.platformDevices.get(tuyaDeviceId) || [];
      
      for (const platformDevice of platformDevices) {
        await this.updatePlatformDeviceStatus(platformDevice, {
          position,
          isOnline,
          status
        });
      }
    } catch (error) {
      console.error('Error syncing device status:', error);
    }
  }

  // Update platform device status
  private async updatePlatformDeviceStatus(
    platformDevice: SmartHomePlatformDevice, 
    state: any
  ): Promise<void> {
    switch (platformDevice.platform) {
      case 'alexa':
        await this.sendAlexaChangeReport(platformDevice, state);
        break;
      case 'google':
        await this.sendGoogleReportState(platformDevice, state);
        break;
      case 'homekit':
        await this.updateHomeKitCharacteristics(platformDevice, state);
        break;
      case 'smartthings':
        await this.sendSmartThingsEvent(platformDevice, state);
        break;
      case 'matter':
        await this.updateMatterAttributes(platformDevice, state);
        break;
    }
  }

  // Platform-specific status update methods
  private async sendAlexaChangeReport(platformDevice: SmartHomePlatformDevice, state: any): Promise<void> {
    // Implementation for Alexa ChangeReport
    console.log(`Alexa ChangeReport for ${platformDevice.platformDeviceId}:`, state);
  }

  private async sendGoogleReportState(platformDevice: SmartHomePlatformDevice, state: any): Promise<void> {
    // Implementation for Google ReportState
    console.log(`Google ReportState for ${platformDevice.platformDeviceId}:`, state);
  }

  private async updateHomeKitCharacteristics(platformDevice: SmartHomePlatformDevice, state: any): Promise<void> {
    // Implementation for HomeKit characteristic updates
    console.log(`HomeKit update for ${platformDevice.platformDeviceId}:`, state);
  }

  private async sendSmartThingsEvent(platformDevice: SmartHomePlatformDevice, state: any): Promise<void> {
    // Implementation for SmartThings events
    console.log(`SmartThings event for ${platformDevice.platformDeviceId}:`, state);
  }

  private async updateMatterAttributes(platformDevice: SmartHomePlatformDevice, state: any): Promise<void> {
    // Implementation for Matter attribute updates
    console.log(`Matter update for ${platformDevice.platformDeviceId}:`, state);
  }

  // Handle Tuya status updates
  private handleTuyaStatusUpdate(data: any): void {
    const { deviceId, status } = data;
    this.syncDeviceStatus(deviceId);
    this.emit('deviceStatusUpdate', { deviceId, status });
  }

  // Handle Tuya online status changes
  private handleTuyaOnlineStatus(data: any): void {
    const { deviceId, online } = data;
    this.emit('deviceOnlineStatus', { deviceId, online });
  }

  // Start periodic sync (every 5 minutes)
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      try {
        const tuyaDeviceIds = Array.from(this.platformDevices.keys());
        for (const deviceId of tuyaDeviceIds) {
          await this.syncDeviceStatus(deviceId);
        }
      } catch (error) {
        console.error('Error in periodic sync:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Get all registered devices
  getRegisteredDevices(): SmartHomePlatformDevice[] {
    const allDevices: SmartHomePlatformDevice[] = [];
    for (const devices of this.platformDevices.values()) {
      allDevices.push(...devices);
    }
    return allDevices;
  }

  // Get devices by platform
  getDevicesByPlatform(platform: string): SmartHomePlatformDevice[] {
    return this.getRegisteredDevices().filter(d => d.platform === platform);
  }

  // Setup webhook endpoint for real-time updates
  async setupWebhook(webhookUrl: string): Promise<void> {
    await this.tuyaApi.setupWebhook(webhookUrl);
  }

  // Handle webhook events
  handleWebhook(event: any): void {
    this.tuyaApi.handleWebhookEvent(event);
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.removeAllListeners();
    console.log('Tuya Smart Home Bridge disconnected');
  }
}

export default TuyaSmartHomeBridge;
export { SmartHomePlatformDevice };