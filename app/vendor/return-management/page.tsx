'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReturnRequest {
  return_id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  requested_date: string;
  amount: number;
  refund_amount?: number;
  notes?: string;
}

export default function ReturnManagementPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/vendors/returns');
      
      if (res.ok) {
        const data = await res.json();
        setReturns(data.data || []);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'processing':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleStatusUpdate = async (returnId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/v2/vendors/returns/${returnId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setReturns(returns.map(r => 
          r.return_id === returnId ? { ...r, status: newStatus as any } : r
        ));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update return status');
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      alert('Failed to update return status. Please try again.');
    }
  };

  const filteredReturns = returns.filter(r => 
    statusFilter === 'all' || r.status === statusFilter
  );

  const stats = {
    pending: returns.filter(r => r.status === 'pending').length,
    processing: returns.filter(r => r.status === 'processing').length,
    totalValue: returns.reduce((sum, r) => sum + r.amount, 0),
    avgProcessingTime: '2.5 days',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Return Management</h1>
        <p className="text-gray-600 mt-2">
          Handle customer returns and refund requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Return requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Resolution time</p>
          </CardContent>
        </Card>
      </div>

      {/* Return Policy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Return Policy</CardTitle>
          <CardDescription>
            Configure your return and refund policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Return Window</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Restocking Fee (%)</Label>
              <Input type="number" defaultValue="10" min="0" max="50" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Return Instructions</Label>
            <Textarea
              placeholder="Instructions shown to customers when initiating a return..."
              defaultValue="Please ensure items are in original packaging with all accessories included."
              rows={3}
            />
          </div>
          <Button className="mt-4">Save Policy</Button>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Return Requests</CardTitle>
              <CardDescription>
                Manage and process customer returns
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Returns</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600">Loading returns...</p>
              </div>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Returns Found</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} returns to display.`
                  : "You haven't received any return requests yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnRequest) => (
                  <TableRow key={returnRequest.return_id}>
                    <TableCell className="font-mono text-sm">
                      {returnRequest.order_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{returnRequest.customer_name}</p>
                        <p className="text-xs text-gray-500">{returnRequest.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {returnRequest.product_name}
                    </TableCell>
                    <TableCell>{returnRequest.reason}</TableCell>
                    <TableCell>${returnRequest.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(returnRequest.status)}
                        <Badge variant={getStatusColor(returnRequest.status) as any}>
                          {returnRequest.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnRequest);
                          setShowDetails(true);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Return Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Request Details</DialogTitle>
            <DialogDescription>
              Review and process this return request
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order ID</Label>
                  <p className="font-mono">{selectedReturn.order_id}</p>
                </div>
                <div>
                  <Label>Request Date</Label>
                  <p>{new Date(selectedReturn.requested_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p>{selectedReturn.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.customer_email}</p>
                </div>
                <div>
                  <Label>Product</Label>
                  <p>{selectedReturn.product_name}</p>
                </div>
              </div>

              <div>
                <Label>Return Reason</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedReturn.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Original Amount</Label>
                  <p className="text-lg font-semibold">${selectedReturn.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Refund Amount</Label>
                  <Input
                    type="number"
                    defaultValue={selectedReturn.refund_amount || selectedReturn.amount}
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add notes about this return..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Select
                  value={selectedReturn.status}
                  onValueChange={(value) => handleStatusUpdate(selectedReturn.return_id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Customer
                  </Button>
                  <Button variant="default">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}