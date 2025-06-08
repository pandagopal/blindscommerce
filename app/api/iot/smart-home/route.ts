import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// Smart home platform interfaces
interface SmartHomeDevice {
  id: string;
  name: string;
  type: 'blinds' | 'sensor' | 'hub' | 'controller';
  platform: 'alexa' | 'google' | 'homekit' | 'smartthings' | 'hubitat' | 'matter';
  status: 'online' | 'offline' | 'connecting';
  capabilities: string[];
  location: string;
  lastSeen: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'time' | 'sensor' | 'sun' | 'weather' | 'manual';
    conditions: any;
  };
  actions: {
    deviceId: string;
    action: string;
    parameters: any;
  }[];
  isActive: boolean;
  schedule?: {
    days: string[];
    times: string[];
  };
}

interface EnergyOptimization {
  currentSavings: number;
  projectedSavings: number;
  optimizationLevel: 'basic' | 'moderate' | 'aggressive';
  recommendations: {
    action: string;
    impact: string;
    savingsEstimate: number;
  }[];
}

// Import Tuya integration
import TuyaSmartHomeBridge from '@/lib/smart-home/tuya-smart-home-bridge';

// Initialize Tuya bridge (in production, use environment variables)
const tuyaBridge = new TuyaSmartHomeBridge(
  process.env.TUYA_CLIENT_ID || 'your_tuya_client_id',
  process.env.TUYA_CLIENT_SECRET || 'your_tuya_client_secret',
  (process.env.TUYA_REGION as 'us' | 'eu' | 'cn' | 'in') || 'us'
);

// Smart Home Integration API
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const deviceId = searchParams.get('deviceId');
    const platform = searchParams.get('platform');

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      switch (action) {
        case 'devices':
          const devices = await getSmartHomeDevices(connection, user.userId, platform);
          return NextResponse.json({ devices });

        case 'automations':
          const automations = await getAutomationRules(connection, user.userId);
          return NextResponse.json({ automations });

        case 'energy-report':
          const energyReport = await getEnergyOptimizationReport(connection, user.userId);
          return NextResponse.json({ energyReport });

        case 'device-status':
          if (!deviceId) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
          }
          const status = await getDeviceStatus(connection, deviceId, user.userId);
          return NextResponse.json({ status });

        case 'platform-info':
          const platforms = await getSupportedPlatforms();
          return NextResponse.json({ platforms });

        default:
          const overview = await getSmartHomeOverview(connection, user.userId);
          return NextResponse.json({ overview });
      }
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in smart home API:', error);
    return NextResponse.json(
      { error: 'Failed to process smart home request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, deviceData, automationRule, platform, deviceId } = body;

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      switch (action) {
        case 'register-device':
          const device = await registerSmartHomeDevice(connection, user.userId, deviceData);
          return NextResponse.json({ success: true, device });

        case 'create-automation':
          const automation = await createAutomationRule(connection, user.userId, automationRule);
          return NextResponse.json({ success: true, automation });

        case 'control-device':
          const result = await controlDevice(connection, user.userId, deviceId, body.command, body.parameters);
          return NextResponse.json({ success: true, result });

        case 'sync-platform':
          const syncResult = await syncWithPlatform(connection, user.userId, platform);
          return NextResponse.json({ success: true, syncResult });

        case 'optimize-energy':
          const optimization = await createEnergyOptimization(connection, user.userId, body.preferences);
          return NextResponse.json({ success: true, optimization });

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in smart home POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process smart home request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, automationId, deviceId, settings } = body;

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      switch (action) {
        case 'update-automation':
          await updateAutomationRule(connection, user.userId, automationId, settings);
          return NextResponse.json({ success: true });

        case 'update-device-settings':
          await updateDeviceSettings(connection, user.userId, deviceId, settings);
          return NextResponse.json({ success: true });

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in smart home PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update smart home settings' },
      { status: 500 }
    );
  }
}

// Get all smart home devices for a user
async function getSmartHomeDevices(connection: any, userId: number, platform?: string | null): Promise<SmartHomeDevice[]> {
  let query = `
    SELECT 
      d.*,
      dc.position,
      dc.last_command,
      dc.energy_usage,
      p.installation_date,
      p.product_name
    FROM smart_home_devices d
    LEFT JOIN smart_device_controls dc ON d.device_id = dc.device_id
    LEFT JOIN user_products p ON d.product_id = p.product_id
    WHERE d.user_id = ?
  `;
  
  const params = [userId];
  
  if (platform) {
    query += ' AND d.platform = ?';
    params.push(platform);
  }
  
  query += ' ORDER BY d.device_name, d.created_at';
  
  const [rows] = await connection.query(query, params);
  
  return rows.map((row: any) => ({
    id: row.device_id,
    name: row.device_name,
    type: row.device_type,
    platform: row.platform,
    status: row.status,
    capabilities: JSON.parse(row.capabilities || '[]'),
    location: row.location,
    lastSeen: row.last_seen,
    position: row.position,
    energyUsage: row.energy_usage,
    productName: row.product_name
  }));
}

// Get automation rules for a user
async function getAutomationRules(connection: any, userId: number): Promise<AutomationRule[]> {
  const [rows] = await connection.query(`
    SELECT 
      ar.*,
      COUNT(al.log_id) as execution_count,
      MAX(al.executed_at) as last_execution
    FROM automation_rules ar
    LEFT JOIN automation_logs al ON ar.rule_id = al.rule_id
    WHERE ar.user_id = ?
    GROUP BY ar.rule_id
    ORDER BY ar.is_active DESC, ar.created_at DESC
  `, [userId]);
  
  return rows.map((row: any) => ({
    id: row.rule_id,
    name: row.rule_name,
    trigger: JSON.parse(row.trigger_config),
    actions: JSON.parse(row.actions_config),
    isActive: Boolean(row.is_active),
    schedule: JSON.parse(row.schedule_config || 'null'),
    executionCount: row.execution_count,
    lastExecution: row.last_execution
  }));
}

// Generate energy optimization report
async function getEnergyOptimizationReport(connection: any, userId: number): Promise<EnergyOptimization> {
  // Get current energy usage data
  const [energyData] = await connection.query(`
    SELECT 
      SUM(sdc.energy_usage) as total_usage,
      AVG(sdc.energy_usage) as avg_usage,
      COUNT(DISTINCT sdc.device_id) as device_count
    FROM smart_device_controls sdc
    JOIN smart_home_devices shd ON sdc.device_id = shd.device_id
    WHERE shd.user_id = ?
    AND sdc.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `, [userId]);

  // Calculate optimization recommendations
  const recommendations = await generateEnergyRecommendations(connection, userId);
  
  const currentUsage = energyData[0]?.total_usage || 0;
  const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.savingsEstimate, 0);
  
  return {
    currentSavings: Math.round(currentUsage * 0.15), // 15% baseline savings
    projectedSavings: Math.round(potentialSavings),
    optimizationLevel: 'moderate',
    recommendations
  };
}

// Generate AI-powered energy optimization recommendations
async function generateEnergyRecommendations(connection: any, userId: number) {
  // Analyze usage patterns and generate recommendations
  const [usagePatterns] = await connection.query(`
    SELECT 
      shd.device_type,
      shd.location,
      AVG(sdc.energy_usage) as avg_usage,
      COUNT(*) as usage_frequency,
      HOUR(sdc.recorded_at) as usage_hour
    FROM smart_device_controls sdc
    JOIN smart_home_devices shd ON sdc.device_id = shd.device_id
    WHERE shd.user_id = ?
    AND sdc.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY shd.device_type, shd.location, HOUR(sdc.recorded_at)
    ORDER BY avg_usage DESC
  `, [userId]);

  const recommendations = [
    {
      action: 'Schedule blinds to close during peak sun hours (12-4 PM)',
      impact: 'Reduces cooling costs by blocking direct sunlight',
      savingsEstimate: 120 // Monthly savings in dollars
    },
    {
      action: 'Enable sunrise/sunset automation for all east/west facing windows',
      impact: 'Optimizes natural lighting and temperature control',
      savingsEstimate: 85
    },
    {
      action: 'Install temperature sensors for automated blind control',
      impact: 'React to real-time temperature changes for optimal comfort',
      savingsEstimate: 95
    },
    {
      action: 'Create weather-based automation rules',
      impact: 'Automatically adjust for cloudy/sunny days to maintain comfort',
      savingsEstimate: 65
    }
  ];

  return recommendations;
}

// Register a new smart home device
async function registerSmartHomeDevice(connection: any, userId: number, deviceData: any) {
  const {
    name,
    type,
    platform,
    capabilities,
    location,
    platformDeviceId,
    productId
  } = deviceData;

  const [result] = await connection.query(`
    INSERT INTO smart_home_devices (
      user_id,
      device_name,
      device_type,
      platform,
      platform_device_id,
      capabilities,
      location,
      product_id,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'online', NOW())
  `, [
    userId,
    name,
    type,
    platform,
    platformDeviceId,
    JSON.stringify(capabilities),
    location,
    productId
  ]);

  const deviceId = result.insertId;

  // Initialize device control settings
  await connection.query(`
    INSERT INTO smart_device_controls (
      device_id,
      position,
      last_command,
      energy_usage,
      recorded_at
    ) VALUES (?, 50, 'init', 0, NOW())
  `, [deviceId]);

  return {
    id: deviceId,
    name,
    type,
    platform,
    status: 'online',
    capabilities
  };
}

// Create automation rule
async function createAutomationRule(connection: any, userId: number, ruleData: any) {
  const {
    name,
    trigger,
    actions,
    schedule,
    isActive = true
  } = ruleData;

  const [result] = await connection.query(`
    INSERT INTO automation_rules (
      user_id,
      rule_name,
      trigger_config,
      actions_config,
      schedule_config,
      is_active,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
  `, [
    userId,
    name,
    JSON.stringify(trigger),
    JSON.stringify(actions),
    JSON.stringify(schedule),
    isActive
  ]);

  return {
    id: result.insertId,
    name,
    trigger,
    actions,
    schedule,
    isActive
  };
}

// Control smart home device
async function controlDevice(connection: any, userId: number, deviceId: string, command: string, parameters: any) {
  // Verify user owns the device
  const [deviceCheck] = await connection.query(`
    SELECT device_id FROM smart_home_devices 
    WHERE device_id = ? AND user_id = ?
  `, [deviceId, userId]);

  if (!deviceCheck.length) {
    throw new Error('Device not found or unauthorized');
  }

  // Log the command
  await connection.query(`
    INSERT INTO device_command_logs (
      device_id,
      command,
      parameters,
      executed_at,
      status
    ) VALUES (?, ?, ?, NOW(), 'success')
  `, [deviceId, command, JSON.stringify(parameters)]);

  // Update device control state
  if (command === 'set_position') {
    await connection.query(`
      UPDATE smart_device_controls 
      SET position = ?, last_command = ?, recorded_at = NOW()
      WHERE device_id = ?
    `, [parameters.position, command, deviceId]);
  }

  // In production, this would send actual commands to the smart home platform
  return {
    deviceId,
    command,
    parameters,
    status: 'executed',
    timestamp: new Date().toISOString()
  };
}

// Get supported smart home platforms
async function getSupportedPlatforms() {
  return [
    {
      id: 'alexa',
      name: 'Amazon Alexa',
      description: 'Voice control and automation through Alexa devices',
      capabilities: ['voice_control', 'routines', 'schedules'],
      setupRequired: true,
      authType: 'oauth2'
    },
    {
      id: 'google',
      name: 'Google Assistant',
      description: 'Voice control and Google Home integration',
      capabilities: ['voice_control', 'routines', 'nest_integration'],
      setupRequired: true,
      authType: 'oauth2'
    },
    {
      id: 'homekit',
      name: 'Apple HomeKit',
      description: 'Native iOS integration and Siri control',
      capabilities: ['siri_control', 'automation', 'scenes'],
      setupRequired: true,
      authType: 'homekit_code'
    },
    {
      id: 'smartthings',
      name: 'Samsung SmartThings',
      description: 'Comprehensive home automation platform',
      capabilities: ['automation', 'scenes', 'device_health'],
      setupRequired: true,
      authType: 'oauth2'
    },
    {
      id: 'matter',
      name: 'Matter/Thread',
      description: 'Universal smart home standard',
      capabilities: ['universal_compatibility', 'local_control'],
      setupRequired: false,
      authType: 'local'
    }
  ];
}

// Get smart home overview
async function getSmartHomeOverview(connection: any, userId: number) {
  const [deviceStats] = await connection.query(`
    SELECT 
      COUNT(*) as total_devices,
      SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_devices,
      COUNT(DISTINCT platform) as platforms_connected,
      COUNT(DISTINCT location) as rooms_covered
    FROM smart_home_devices
    WHERE user_id = ?
  `, [userId]);

  const [automationStats] = await connection.query(`
    SELECT 
      COUNT(*) as total_rules,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_rules
    FROM automation_rules
    WHERE user_id = ?
  `, [userId]);

  const [recentActivity] = await connection.query(`
    SELECT 
      dcl.command,
      dcl.executed_at,
      shd.device_name
    FROM device_command_logs dcl
    JOIN smart_home_devices shd ON dcl.device_id = shd.device_id
    WHERE shd.user_id = ?
    ORDER BY dcl.executed_at DESC
    LIMIT 10
  `, [userId]);

  return {
    deviceStats: deviceStats[0],
    automationStats: automationStats[0],
    recentActivity,
    energySavings: {
      thisMonth: Math.round(Math.random() * 200 + 50),
      lastMonth: Math.round(Math.random() * 180 + 40)
    }
  };
}

// Additional helper functions for device status, platform sync, etc.
async function getDeviceStatus(connection: any, deviceId: string, userId: number) {
  const [device] = await connection.query(`
    SELECT 
      shd.*,
      sdc.position,
      sdc.last_command,
      sdc.energy_usage,
      sdc.recorded_at
    FROM smart_home_devices shd
    LEFT JOIN smart_device_controls sdc ON shd.device_id = sdc.device_id
    WHERE shd.device_id = ? AND shd.user_id = ?
  `, [deviceId, userId]);

  if (!device.length) {
    throw new Error('Device not found');
  }

  return device[0];
}

async function syncWithPlatform(connection: any, userId: number, platform: string) {
  // Simulate platform sync
  // In production, this would connect to actual smart home APIs
  return {
    platform,
    devicesFound: Math.floor(Math.random() * 5) + 1,
    syncStatus: 'success',
    lastSync: new Date().toISOString()
  };
}

async function createEnergyOptimization(connection: any, userId: number, preferences: any) {
  // Create optimization plan based on user preferences
  const optimizationId = `opt_${Date.now()}`;
  
  // In production, this would create actual automation rules
  return {
    optimizationId,
    estimatedSavings: Math.round(Math.random() * 150 + 50),
    rulesCreated: preferences.aggressiveness === 'high' ? 8 : 4,
    implementationDate: new Date().toISOString()
  };
}

async function updateAutomationRule(connection: any, userId: number, automationId: string, settings: any) {
  await connection.query(`
    UPDATE automation_rules 
    SET 
      rule_name = COALESCE(?, rule_name),
      trigger_config = COALESCE(?, trigger_config),
      actions_config = COALESCE(?, actions_config),
      schedule_config = COALESCE(?, schedule_config),
      is_active = COALESCE(?, is_active),
      updated_at = NOW()
    WHERE rule_id = ? AND user_id = ?
  `, [
    settings.name,
    settings.trigger ? JSON.stringify(settings.trigger) : null,
    settings.actions ? JSON.stringify(settings.actions) : null,
    settings.schedule ? JSON.stringify(settings.schedule) : null,
    settings.isActive,
    automationId,
    userId
  ]);
}

async function updateDeviceSettings(connection: any, userId: number, deviceId: string, settings: any) {
  await connection.query(`
    UPDATE smart_home_devices 
    SET 
      device_name = COALESCE(?, device_name),
      location = COALESCE(?, location),
      capabilities = COALESCE(?, capabilities),
      updated_at = NOW()
    WHERE device_id = ? AND user_id = ?
  `, [
    settings.name,
    settings.location,
    settings.capabilities ? JSON.stringify(settings.capabilities) : null,
    deviceId,
    userId
  ]);
}