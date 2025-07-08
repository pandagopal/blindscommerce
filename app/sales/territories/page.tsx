'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Users, 
  TrendingUp,
  DollarSign,
  Building,
  Phone,
  Mail,
  Search
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Territory {
  id: number;
  name: string;
  region: string;
  zipCodes: string[];
  totalCustomers: number;
  activeLeads: number;
  monthlyRevenue: number;
  growthRate: number;
  keyAccounts: KeyAccount[];
}

interface KeyAccount {
  name: string;
  type: string;
  contact: string;
  email: string;
  phone: string;
  lastOrder?: string;
  totalSpent: number;
}

const territories: Territory[] = [
  {
    id: 1,
    name: 'Downtown Austin',
    region: 'Central',
    zipCodes: ['78701', '78702', '78703', '78704', '78705'],
    totalCustomers: 156,
    activeLeads: 23,
    monthlyRevenue: 45600,
    growthRate: 12.5,
    keyAccounts: [
      {
        name: 'Luxury Living Condos',
        type: 'Property Management',
        contact: 'James Wilson',
        email: 'james@luxuryliving.com',
        phone: '(512) 555-0123',
        lastOrder: '2024-06-15',
        totalSpent: 28500,
      },
      {
        name: 'Modern Office Spaces',
        type: 'Commercial',
        contact: 'Sarah Chen',
        email: 'sarah@modernoffices.com',
        phone: '(512) 555-0124',
        lastOrder: '2024-06-20',
        totalSpent: 15200,
      },
    ],
  },
  {
    id: 2,
    name: 'West Austin',
    region: 'West',
    zipCodes: ['78731', '78732', '78733', '78734', '78735'],
    totalCustomers: 189,
    activeLeads: 31,
    monthlyRevenue: 62300,
    growthRate: 8.2,
    keyAccounts: [
      {
        name: 'Westlake Properties',
        type: 'Residential Developer',
        contact: 'Michael Brown',
        email: 'michael@westlakeprops.com',
        phone: '(512) 555-0125',
        lastOrder: '2024-06-18',
        totalSpent: 42100,
      },
    ],
  },
  {
    id: 3,
    name: 'North Austin',
    region: 'North',
    zipCodes: ['78750', '78751', '78752', '78753', '78754'],
    totalCustomers: 142,
    activeLeads: 19,
    monthlyRevenue: 38900,
    growthRate: 15.8,
    keyAccounts: [
      {
        name: 'Tech Campus Solutions',
        type: 'Commercial',
        contact: 'Lisa Martinez',
        email: 'lisa@techcampus.com',
        phone: '(512) 555-0126',
        totalSpent: 19800,
      },
    ],
  },
];

export default function SalesTerritoriesPage() {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<KeyAccount | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTerritories = territories.filter(territory =>
    territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    territory.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    territory.zipCodes.some(zip => zip.includes(searchQuery))
  );

  const totalStats = {
    customers: territories.reduce((sum, t) => sum + t.totalCustomers, 0),
    leads: territories.reduce((sum, t) => sum + t.activeLeads, 0),
    revenue: territories.reduce((sum, t) => sum + t.monthlyRevenue, 0),
    avgGrowth: territories.reduce((sum, t) => sum + t.growthRate, 0) / territories.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Territories</h1>
          <p className="text-gray-600 mt-2">
            Manage your assigned territories and key accounts
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search territories or ZIP codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-[300px]"
          />
        </div>
      </div>

      {/* Territory Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.customers}</div>
            <p className="text-xs text-muted-foreground">
              Across all territories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.leads}</div>
            <p className="text-xs text-muted-foreground">
              Potential customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Combined territories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalStats.avgGrowth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Year over year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Territory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTerritories.map((territory) => (
          <Card
            key={territory.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTerritory(territory)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{territory.name}</CardTitle>
                  <CardDescription>{territory.region} Region</CardDescription>
                </div>
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {territory.zipCodes.slice(0, 3).map((zip) => (
                    <Badge key={zip} variant="secondary" className="text-xs">
                      {zip}
                    </Badge>
                  ))}
                  {territory.zipCodes.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{territory.zipCodes.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Customers</p>
                    <p className="font-semibold">{territory.totalCustomers}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Active Leads</p>
                    <p className="font-semibold">{territory.activeLeads}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Revenue</p>
                    <p className="font-semibold">{formatCurrency(territory.monthlyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Growth</p>
                    <p className="font-semibold text-green-600">+{territory.growthRate}%</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Key Accounts</p>
                  <p className="font-semibold">{territory.keyAccounts.length} accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Territory Details Dialog */}
      <Dialog open={!!selectedTerritory} onOpenChange={() => setSelectedTerritory(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTerritory?.name} Territory</DialogTitle>
            <DialogDescription>
              Detailed view of territory and key accounts
            </DialogDescription>
          </DialogHeader>
          {selectedTerritory && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ZIP Codes</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTerritory.zipCodes.map((zip) => (
                      <Badge key={zip} variant="outline">
                        {zip}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Performance Metrics</Label>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm">
                      <span className="text-gray-600">Revenue:</span>{' '}
                      <span className="font-semibold">
                        {formatCurrency(selectedTerritory.monthlyRevenue)}/month
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Growth Rate:</span>{' '}
                      <span className="font-semibold text-green-600">
                        +{selectedTerritory.growthRate}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Key Accounts</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTerritory.keyAccounts.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.type}</Badge>
                        </TableCell>
                        <TableCell>{account.contact}</TableCell>
                        <TableCell>{formatCurrency(account.totalSpent)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowAccountDetails(true);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  <strong>Territory Tip:</strong> Focus on converting the {selectedTerritory.activeLeads} active 
                  leads in this territory. The {selectedTerritory.growthRate}% growth rate indicates 
                  strong market potential.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account Details Dialog */}
      <Dialog open={showAccountDetails} onOpenChange={setShowAccountDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount?.name}</DialogTitle>
            <DialogDescription>
              Key account information
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Type</Label>
                  <p className="font-medium">{selectedAccount.type}</p>
                </div>
                <div>
                  <Label>Total Revenue</Label>
                  <p className="font-medium">{formatCurrency(selectedAccount.totalSpent)}</p>
                </div>
              </div>

              <div>
                <Label>Primary Contact</Label>
                <p className="font-medium">{selectedAccount.contact}</p>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedAccount.email}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  {selectedAccount.phone}
                </Button>
              </div>

              {selectedAccount.lastOrder && (
                <div>
                  <Label>Last Order</Label>
                  <p className="font-medium">
                    {new Date(selectedAccount.lastOrder).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1">Create Quote</Button>
                <Button variant="outline" className="flex-1">View History</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}