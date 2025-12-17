'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, User, Bell, Calendar, MapPin, Clock, 
  Smartphone, Mail, Save, Shield, Camera
} from 'lucide-react';

interface InstallerSettings {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    specialties: string[];
    bio: string;
    availability: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    job_assignments: boolean;
    schedule_changes: boolean;
    customer_messages: boolean;
    payment_updates: boolean;
  };
  schedule: {
    start_time: string;
    end_time: string;
    working_days: string[];
    break_duration: number;
    travel_buffer: number;
    max_jobs_per_day: number;
  };
  preferences: {
    preferred_job_types: string[];
    service_radius: number;
    auto_accept_jobs: boolean;
    require_customer_confirmation: boolean;
    enable_gps_tracking: boolean;
    photo_quality: string;
  };
}

export default function InstallerSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<InstallerSettings>({
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      specialties: [],
      bio: '',
      availability: 'full_time'
    },
    notifications: {
      email_notifications: true,
      sms_notifications: true,
      job_assignments: true,
      schedule_changes: true,
      customer_messages: true,
      payment_updates: true
    },
    schedule: {
      start_time: '08:00',
      end_time: '17:00',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      break_duration: 60,
      travel_buffer: 30,
      max_jobs_per_day: 4
    },
    preferences: {
      preferred_job_types: ['installation'],
      service_radius: 25,
      auto_accept_jobs: false,
      require_customer_confirmation: true,
      enable_gps_tracking: true,
      photo_quality: 'high'
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/settings');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'installer' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
        
        // Populate form with user data
        if (data.user) {
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              email: data.user.email || '',
              phone: data.user.phone || ''
            }
          }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/settings');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSave = async (section?: string) => {
    setSaving(true);
    try {
      const dataToSave = section ? { [section]: settings[section as keyof InstallerSettings] } : settings;
      
      // Mock save - in real implementation, this would save to the database
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof InstallerSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const toggleWorkingDay = (day: string) => {
    const currentDays = settings.schedule.working_days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    updateSetting('schedule', 'working_days', newDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              Installer Settings
            </h1>
            <p className="text-gray-600">Manage your profile, preferences, and notifications</p>
          </div>
          
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-red-100">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={(e) => updateSetting('profile', 'firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={(e) => updateSetting('profile', 'lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.profile.phone}
                      onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Service Address</Label>
                  <Input
                    id="address"
                    value={settings.profile.address}
                    onChange={(e) => updateSetting('profile', 'address', e.target.value)}
                    placeholder="Your primary service location"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.profile.bio}
                    onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                    placeholder="Tell customers about your experience and expertise..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Availability Status</Label>
                  <Select
                    value={settings.profile.availability}
                    onValueChange={(value) => updateSetting('profile', 'availability', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="weekends_only">Weekends Only</SelectItem>
                      <SelectItem value="on_call">On Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => handleSave('profile')}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Communication Methods</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Notifications</span>
                      </div>
                      <Switch
                        checked={settings.notifications.email_notifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'email_notifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS Notifications</span>
                      </div>
                      <Switch
                        checked={settings.notifications.sms_notifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sms_notifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Notification Types</h3>
                    <div className="space-y-2">
                      {Object.entries(settings.notifications)
                        .filter(([key]) => !key.includes('email_') && !key.includes('sms_'))
                        .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <Switch
                            checked={value as boolean}
                            onCheckedChange={(checked) => updateSetting('notifications', key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('notifications')}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Schedule Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={settings.schedule.start_time}
                      onChange={(e) => updateSetting('schedule', 'start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={settings.schedule.end_time}
                      onChange={(e) => updateSetting('schedule', 'end_time', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <Button
                        key={day}
                        variant={settings.schedule.working_days.includes(day) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleWorkingDay(day)}
                        className="capitalize"
                      >
                        {day.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                    <Input
                      id="breakDuration"
                      type="number"
                      value={settings.schedule.break_duration}
                      onChange={(e) => updateSetting('schedule', 'break_duration', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="travelBuffer">Travel Buffer (minutes)</Label>
                    <Input
                      id="travelBuffer"
                      type="number"
                      value={settings.schedule.travel_buffer}
                      onChange={(e) => updateSetting('schedule', 'travel_buffer', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxJobs">Max Jobs per Day</Label>
                    <Input
                      id="maxJobs"
                      type="number"
                      value={settings.schedule.max_jobs_per_day}
                      onChange={(e) => updateSetting('schedule', 'max_jobs_per_day', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('schedule')}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Work Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                    <Input
                      id="serviceRadius"
                      type="number"
                      value={settings.preferences.service_radius}
                      onChange={(e) => updateSetting('preferences', 'service_radius', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoQuality">Photo Quality</Label>
                    <Select
                      value={settings.preferences.photo_quality}
                      onValueChange={(value) => updateSetting('preferences', 'photo_quality', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster upload)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Best quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Automation Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">Auto-accept Job Assignments</span>
                        <p className="text-sm text-gray-600">Automatically accept jobs that match your preferences</p>
                      </div>
                      <Switch
                        checked={settings.preferences.auto_accept_jobs}
                        onCheckedChange={(checked) => updateSetting('preferences', 'auto_accept_jobs', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">Require Customer Confirmation</span>
                        <p className="text-sm text-gray-600">Send confirmation requests before job starts</p>
                      </div>
                      <Switch
                        checked={settings.preferences.require_customer_confirmation}
                        onCheckedChange={(checked) => updateSetting('preferences', 'require_customer_confirmation', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">Enable GPS Tracking</span>
                        <p className="text-sm text-gray-600">Allow location tracking during jobs</p>
                      </div>
                      <Switch
                        checked={settings.preferences.enable_gps_tracking}
                        onCheckedChange={(checked) => updateSetting('preferences', 'enable_gps_tracking', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('preferences')}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}