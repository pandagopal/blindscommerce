'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  Zap, 
  Settings, 
  Plus, 
  Smartphone,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Thermometer,
  Clock,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Calendar,
  Voice,
  Mic
} from 'lucide-react';

interface SmartDevice {
  id: string;
  name: string;
  type: 'blinds' | 'sensor' | 'hub' | 'controller';
  platform: string;
  status: 'online' | 'offline' | 'connecting';
  location: string;
  position?: number;
  energyUsage?: number;
  lastSeen: string;
}

interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  executionCount: number;
  lastExecution: string;
}

interface EnergyData {
  currentSavings: number;
  projectedSavings: number;
  thisMonth: number;
  lastMonth: number;
}

const SmartHomeDashboard: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [voiceControlActive, setVoiceControlActive] = useState(false);

  // Fetch smart home data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch overview data
        const overviewResponse = await fetch('/api/v2/iot/smart-home');
        const overviewResult = await overviewResponse.json();
        if (overviewResult.success) {
          setOverview(overviewResult.data.overview);
        }
        
        // Fetch devices
        const devicesResponse = await fetch('/api/v2/iot/smart-home?action=devices');
        const devicesResult = await devicesResponse.json();
        if (devicesResult.success) {
          setDevices(devicesResult.data.devices || []);
        }
        
        // Fetch automations
        const automationsResponse = await fetch('/api/v2/iot/smart-home?action=automations');
        const automationsResult = await automationsResponse.json();
        if (automationsResult.success) {
          setAutomations(automationsResult.data.automations || []);
        }
        
        // Fetch energy report
        const energyResponse = await fetch('/api/v2/iot/smart-home?action=energy-report');
        const energyResult = await energyResponse.json();
        if (energyResult.success) {
          setEnergyData(energyResult.data.energyReport);
        }
        
      } catch (error) {
        console.error('Error fetching smart home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Control device
  const controlDevice = async (deviceId: string, command: string, parameters: any) => {
    try {
      const response = await fetch('/api/v2/iot/smart-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'control-device',
          deviceId,
          command,
          parameters
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Update local device state
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, position: parameters.position || device.position }
            : device
        ));
      }
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  };

  // Create automation
  const createAutomation = async (automationData: any) => {
    try {
      const response = await fetch('/api/v2/iot/smart-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-automation',
          automationRule: automationData
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAutomations(prev => [...prev, result.data.automation]);
      }
    } catch (error) {
      console.error('Error creating automation:', error);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
    switch (platform.toLowerCase()) {
      case 'alexa':
        return <Voice className={iconClass} />;
      case 'google':
        return <Mic className={iconClass} />;
      case 'homekit':
        return <Home className={iconClass} />;
      default:
        return <Smartphone className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Home Control</h1>
          <p className="text-gray-600 mt-1">Manage your connected blinds and automation</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Connected Devices</p>
                  <p className="text-2xl font-bold">
                    {overview.deviceStats?.online_devices || 0}/{overview.deviceStats?.total_devices || 0}
                  </p>
                </div>
                <Wifi className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Automations</p>
                  <p className="text-2xl font-bold">
                    {overview.automationStats?.active_rules || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Energy Savings</p>
                  <p className="text-2xl font-bold">
                    ${overview.energySavings?.thisMonth || 0}
                  </p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rooms Covered</p>
                  <p className="text-2xl font-bold">
                    {overview.deviceStats?.rooms_covered || 0}
                  </p>
                </div>
                <Home className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Energy
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Voice className="h-4 w-4" />
            Voice Control
          </TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Card key={device.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(device.platform)}
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                    </div>
                    {getStatusIcon(device.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {device.location}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {device.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {device.type === 'blinds' && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Position</span>
                          <span className="text-sm text-gray-600">{device.position || 0}%</span>
                        </div>
                        <Slider
                          value={[device.position || 0]}
                          onValueChange={([value]) => {
                            controlDevice(device.id, 'set_position', { position: value });
                          }}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => controlDevice(device.id, 'open', {})}
                          className="flex-1"
                        >
                          Open
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => controlDevice(device.id, 'close', {})}
                          className="flex-1"
                        >
                          Close
                        </Button>
                      </div>
                      
                      {device.energyUsage !== undefined && (
                        <div className="text-xs text-gray-500 mt-2">
                          Energy: {device.energyUsage}W
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-3">
                    Last seen: {new Date(device.lastSeen).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Automation Rules</h3>
              <Button onClick={() => {
                // Example automation creation
                createAutomation({
                  name: 'Morning Routine',
                  trigger: {
                    type: 'time',
                    conditions: { time: '07:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
                  },
                  actions: [
                    { deviceId: devices[0]?.id, action: 'set_position', parameters: { position: 80 } }
                  ],
                  isActive: true
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </div>
            
            <div className="grid gap-4">
              {automations.map((automation) => (
                <Card key={automation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          automation.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <h4 className="font-medium">{automation.name}</h4>
                          <p className="text-sm text-gray-600">
                            Executed {automation.executionCount} times
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                          {automation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {automation.lastExecution && (
                      <div className="text-xs text-gray-400 mt-2">
                        Last run: {new Date(automation.lastExecution).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Energy Tab */}
        <TabsContent value="energy">
          {energyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Energy Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Savings</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${energyData.currentSavings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Projected Savings</span>
                      <span className="text-xl font-semibold text-red-600">
                        ${energyData.projectedSavings}
                      </span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>This Month</span>
                        <span className="font-medium">${energyData.thisMonth}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Last Month</span>
                        <span>${energyData.lastMonth}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-sm">Peak Hour Automation</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Close blinds during 12-4 PM to reduce cooling costs
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Est. $45/month savings
                      </Badge>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-sm">Sunrise/Sunset Schedule</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatic adjustment based on daylight hours
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Est. $30/month savings
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Voice Control Tab */}
        <TabsContent value="voice">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Voice className="h-5 w-5" />
                  Voice Control Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Voice className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <h4 className="font-medium">Amazon Alexa</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      "Alexa, close the living room blinds"
                    </p>
                    <Button size="sm" className="mt-3">
                      Connect
                    </Button>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Mic className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <h4 className="font-medium">Google Assistant</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      "Hey Google, open the bedroom blinds"
                    </p>
                    <Button size="sm" className="mt-3">
                      Connect
                    </Button>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Home className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                    <h4 className="font-medium">Apple HomeKit</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      "Hey Siri, set blinds to 50%"
                    </p>
                    <Button size="sm" className="mt-3">
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Voice Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>"Open all blinds"</span>
                    <Badge variant="outline">All Platforms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>"Close bedroom blinds"</span>
                    <Badge variant="outline">All Platforms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>"Set living room blinds to 75%"</span>
                    <Badge variant="outline">All Platforms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>"Good morning routine"</span>
                    <Badge variant="outline">Custom Scene</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartHomeDashboard;