'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Navigation, 
  Clock,
  DollarSign,
  Car,
  AlertCircle,
  Plus,
  X,
  Edit
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceArea {
  id: number;
  name: string;
  zipCodes: string[];
  maxDistance: number;
  travelFee: number;
  isActive: boolean;
  avgJobsPerMonth: number;
  preferredArea: boolean;
}

interface AreaStats {
  totalJobs: number;
  avgDriveTime: string;
  revenue: number;
  customerRating: number;
}

const serviceAreas: ServiceArea[] = [
  {
    id: 1,
    name: 'Downtown Austin',
    zipCodes: ['78701', '78702', '78703', '78704', '78705'],
    maxDistance: 10,
    travelFee: 0,
    isActive: true,
    avgJobsPerMonth: 25,
    preferredArea: true,
  },
  {
    id: 2,
    name: 'North Austin',
    zipCodes: ['78750', '78751', '78752', '78753', '78754'],
    maxDistance: 15,
    travelFee: 25,
    isActive: true,
    avgJobsPerMonth: 18,
    preferredArea: false,
  },
  {
    id: 3,
    name: 'South Austin',
    zipCodes: ['78741', '78742', '78743', '78744', '78745'],
    maxDistance: 20,
    travelFee: 35,
    isActive: false,
    avgJobsPerMonth: 12,
    preferredArea: false,
  },
];

const areaStats: Record<number, AreaStats> = {
  1: {
    totalJobs: 312,
    avgDriveTime: '15 min',
    revenue: 89500,
    customerRating: 4.8,
  },
  2: {
    totalJobs: 216,
    avgDriveTime: '25 min',
    revenue: 62300,
    customerRating: 4.7,
  },
  3: {
    totalJobs: 144,
    avgDriveTime: '35 min',
    revenue: 41200,
    customerRating: 4.6,
  },
};

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceArea[]>(serviceAreas);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newZipCode, setNewZipCode] = useState('');

  const handleToggleArea = (areaId: number) => {
    setAreas(areas.map(area => 
      area.id === areaId ? { ...area, isActive: !area.isActive } : area
    ));
  };

  const handleUpdateTravelFee = (areaId: number, fee: number) => {
    setAreas(areas.map(area => 
      area.id === areaId ? { ...area, travelFee: fee } : area
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const activeAreas = areas.filter(a => a.isActive).length;
  const totalZipCodes = areas.reduce((sum, a) => sum + a.zipCodes.length, 0);
  const avgMonthlyJobs = areas.reduce((sum, a) => sum + (a.isActive ? a.avgJobsPerMonth : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Areas</h1>
          <p className="text-gray-600 mt-2">
            Manage your service territories and travel preferences
          </p>
        </div>
        <Dialog open={showAddArea} onOpenChange={setShowAddArea}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service Area</DialogTitle>
              <DialogDescription>
                Define a new service area with ZIP codes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Area Name</Label>
                <Input placeholder="e.g., West Lake Hills" />
              </div>
              <div className="space-y-2">
                <Label>ZIP Codes</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter ZIP code"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    maxLength={5}
                  />
                  <Button variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* ZIP codes would be displayed here */}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Distance (miles)</Label>
                  <Input type="number" placeholder="25" />
                </div>
                <div className="space-y-2">
                  <Label>Travel Fee ($)</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddArea(false)}>
                Cancel
              </Button>
              <Button>Create Area</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAreas}</div>
            <p className="text-xs text-muted-foreground">
              {totalZipCodes} total ZIP codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Jobs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMonthlyJobs}</div>
            <p className="text-xs text-muted-foreground">Expected this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Drive Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22 min</div>
            <p className="text-xs text-muted-foreground">Per appointment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Areas List */}
      <div className="grid gap-4">
        {areas.map((area) => {
          const stats = areaStats[area.id];
          return (
            <Card key={area.id} className={!area.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {area.name}
                      {area.preferredArea && (
                        <Badge variant="success" className="text-xs">
                          Preferred
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {area.zipCodes.length} ZIP codes • Up to {area.maxDistance} miles
                    </CardDescription>
                  </div>
                  <Switch
                    checked={area.isActive}
                    onCheckedChange={() => handleToggleArea(area.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* ZIP Codes */}
                  <div>
                    <p className="text-sm font-medium mb-2">ZIP Codes</p>
                    <div className="flex flex-wrap gap-1">
                      {area.zipCodes.map((zip) => (
                        <Badge key={zip} variant="secondary" className="text-xs">
                          {zip}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Total Jobs</p>
                        <p className="font-semibold">{stats.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Drive</p>
                        <p className="font-semibold">{stats.avgDriveTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="font-semibold">{formatCurrency(stats.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-semibold">⭐ {stats.customerRating}</p>
                      </div>
                    </div>
                  )}

                  {/* Travel Fee */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium">Travel Fee</p>
                      <p className="text-xs text-gray-600">
                        Additional charge for this area
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        ${area.travelFee}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingArea(area)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Travel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Preferences</CardTitle>
          <CardDescription>
            Set your availability and travel policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Available for Emergency Calls</Label>
              <p className="text-sm text-gray-600">
                Accept last-minute appointments outside regular areas
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekend Service</Label>
              <p className="text-sm text-gray-600">
                Available for Saturday and Sunday installations
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Max Daily Drive Time</Label>
              <Select defaultValue="3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="5">5 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Start Time</Label>
              <Select defaultValue="8">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7:00 AM</SelectItem>
                  <SelectItem value="8">8:00 AM</SelectItem>
                  <SelectItem value="9">9:00 AM</SelectItem>
                  <SelectItem value="10">10:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Fee Edit Dialog */}
      <Dialog open={!!editingArea} onOpenChange={() => setEditingArea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Travel Fee</DialogTitle>
            <DialogDescription>
              Update the travel fee for {editingArea?.name}
            </DialogDescription>
          </DialogHeader>
          {editingArea && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fee Guidelines</AlertTitle>
                <AlertDescription>
                  Travel fees help compensate for longer drive times. Recommended:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>0-10 miles: $0</li>
                    <li>10-20 miles: $25</li>
                    <li>20-30 miles: $35-50</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Travel Fee Amount</Label>
                <div className="flex items-center gap-2">
                  <span>$</span>
                  <Input
                    type="number"
                    defaultValue={editingArea.travelFee}
                    min="0"
                    step="5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingArea(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Save logic here
                  setEditingArea(null);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <Alert>
        <Navigation className="h-4 w-4" />
        <AlertTitle>Optimization Tip</AlertTitle>
        <AlertDescription>
          Consider grouping appointments by area to minimize travel time. 
          You currently average 22 minutes between jobs. Reducing this by 
          just 5 minutes per job could save you 2+ hours per week.
        </AlertDescription>
      </Alert>
    </div>
  );
}