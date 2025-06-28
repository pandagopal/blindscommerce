'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, DollarSign, Percent, TrendingUp, Users, Edit, Trash2, Download, BarChart3 } from 'lucide-react';

interface CommissionRule {
  rule_id: number;
  rule_name: string;
  vendor_id?: number;
  vendor_name?: string;
  sales_staff_id?: number;
  sales_staff_name?: string;
  commission_type: 'percentage' | 'fixed_amount' | 'tiered';
  commission_rate: number;
  minimum_order_value: number;
  maximum_commission_amount?: number;
  tier_rules?: Array<{
    min_amount: number;
    max_amount?: number;
    rate: number;
  }>;
  is_active: boolean;
  applies_to: 'all_products' | 'specific_categories' | 'specific_products';
  target_ids?: number[];
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

interface CommissionCalculation {
  calculation_id: number;
  order_id: number;
  vendor_id: number;
  vendor_name: string;
  sales_staff_id?: number;
  sales_staff_name?: string;
  rule_id: number;
  rule_name: string;
  commission_rate: number;
  commission_amount: number;
  order_amount: number;
  payment_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at: string;
}

interface CommissionSummary {
  total_pending: number;
  total_approved: number;
  total_paid: number;
  this_month_commissions: number;
  top_performing_vendor: string;
  top_performing_sales: string;
}

export default function CommissionManagementPage() {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [commissionCalculations, setCommissionCalculations] = useState<CommissionCalculation[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<CommissionRule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    rule_name: '',
    vendor_id: '',
    sales_staff_id: '',
    commission_type: 'percentage' as const,
    commission_rate: 0,
    minimum_order_value: 0,
    maximum_commission_amount: '',
    tier_rules: [] as Array<{min_amount: number, max_amount?: number, rate: number}>,
    applies_to: 'all_products' as const,
    target_ids: [] as number[],
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  useEffect(() => {
    fetchCommissionData();
  }, [currentPage, searchTerm, statusFilter, vendorFilter, activeTab]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'rules') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          search: searchTerm,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(vendorFilter !== 'all' && { vendor_id: vendorFilter })
        });

        const response = await fetch(`/api/v2/admin/commissions/rules?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCommissionRules(data.rules);
        }
      } else if (activeTab === 'calculations') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(statusFilter !== 'all' && { payment_status: statusFilter }),
          ...(vendorFilter !== 'all' && { vendor_id: vendorFilter })
        });

        const response = await fetch(`/api/v2/admin/commissions/calculations?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCommissionCalculations(data.calculations);
        }
      } else if (activeTab === 'summary') {
        const response = await fetch('/api/v2/admin/commissions/summary');
        if (response.ok) {
          const data = await response.json();
          setCommissionSummary(data);
        }
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/v2/admin/commissions/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        fetchCommissionData();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating commission rule:', error);
    }
  };

  const handleUpdateRule = async (rule_id: number, updates: Partial<CommissionRule>) => {
    try {
      const response = await fetch(`/api/v2/admin/commissions/rules/${rule_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchCommissionData();
      }
    } catch (error) {
      console.error('Error updating commission rule:', error);
    }
  };

  const handleDeleteRule = async (rule_id: number) => {
    if (!confirm('Are you sure you want to delete this commission rule?')) return;

    try {
      const response = await fetch(`/api/v2/admin/commissions/rules/${rule_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCommissionData();
      }
    } catch (error) {
      console.error('Error deleting commission rule:', error);
    }
  };

  const handlePaymentStatusUpdate = async (calculation_id: number, status: string) => {
    try {
      const response = await fetch(`/api/v2/admin/commissions/calculations/${calculation_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: status })
      });

      if (response.ok) {
        fetchCommissionData();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      vendor_id: '',
      sales_staff_id: '',
      commission_type: 'percentage',
      commission_rate: 0,
      minimum_order_value: 0,
      maximum_commission_amount: '',
      tier_rules: [],
      applies_to: 'all_products',
      target_ids: [],
      valid_from: '',
      valid_until: '',
      is_active: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-2">Manage vendor and sales staff commission structures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Commission Rule</DialogTitle>
                <DialogDescription>
                  Set up a new commission structure for vendors or sales staff
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule_name">Rule Name</Label>
                    <Input
                      id="rule_name"
                      value={formData.rule_name}
                      onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                      placeholder="e.g., Standard Vendor Commission"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_type">Commission Type</Label>
                    <Select 
                      value={formData.commission_type} 
                      onValueChange={(value: any) => setFormData({...formData, commission_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="tiered">Tiered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission_rate">Commission Rate</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
                      placeholder={formData.commission_type === 'percentage' ? '5.00' : '50.00'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum_order_value">Minimum Order Value</Label>
                    <Input
                      id="minimum_order_value"
                      type="number"
                      step="0.01"
                      value={formData.minimum_order_value}
                      onChange={(e) => setFormData({...formData, minimum_order_value: parseFloat(e.target.value)})}
                      placeholder="100.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_until">Valid Until (Optional)</Label>
                    <Input
                      id="valid_until"
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {commissionSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionSummary.total_pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionSummary.this_month_commissions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Vendor</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{commissionSummary.top_performing_vendor}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Sales Staff</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{commissionSummary.top_performing_sales}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="calculations">Commission Payments</TabsTrigger>
          <TabsTrigger value="summary">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search commission rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rules List */}
          {loading ? (
            <div className="text-center py-8">Loading commission rules...</div>
          ) : commissionRules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-4">No commission rules found</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create First Rule</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {commissionRules.map((rule) => (
                <Card key={rule.rule_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{rule.rule_name}</h3>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {rule.commission_type === 'percentage' ? (
                              <><Percent className="h-3 w-3 mr-1" />{rule.commission_rate}%</>
                            ) : (
                              <><DollarSign className="h-3 w-3 mr-1" />{rule.commission_rate}</>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>Min Order: {formatCurrency(rule.minimum_order_value)}</span>
                          {rule.vendor_name && <span>Vendor: {rule.vendor_name}</span>}
                          {rule.sales_staff_name && <span>Sales: {rule.sales_staff_name}</span>}
                          <span>Valid: {new Date(rule.valid_from).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUpdateRule(rule.rule_id, { is_active: !rule.is_active })}
                        >
                          {rule.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRule(rule.rule_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculations" className="space-y-4">
          {/* Calculations List */}
          {loading ? (
            <div className="text-center py-8">Loading commission calculations...</div>
          ) : commissionCalculations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No commission calculations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {commissionCalculations.map((calc) => (
                <Card key={calc.calculation_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">Order #{calc.order_id}</h3>
                          <StatusBadge status={calc.payment_status} />
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>Vendor: {calc.vendor_name}</span>
                          {calc.sales_staff_name && <span>Sales: {calc.sales_staff_name}</span>}
                          <span>Order: {formatCurrency(calc.order_amount)}</span>
                          <span>Commission: {formatCurrency(calc.commission_amount)}</span>
                          <span>Rate: {calc.commission_rate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {calc.payment_status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePaymentStatusUpdate(calc.calculation_id, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        {calc.payment_status === 'approved' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePaymentStatusUpdate(calc.calculation_id, 'paid')}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Analytics</CardTitle>
              <CardDescription>Overview of commission performance and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard would be implemented here with charts and detailed metrics
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}