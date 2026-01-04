'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Eye, Clock, User, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  product_id: number | null;
  product_name: string | null;
  product_sku: string | null;
  requested_by: string;
  requester_email: string;
  requester_first_name: string;
  requester_last_name: string;
  vendor_id: number | null;
  vendor_name: string | null;
  request_data: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
}

interface Vendor {
  vendor_id: number;
  business_name: string;
}

interface ProductApprovalsWidgetProps {
  userRole: 'ADMIN' | 'VENDOR' | 'SALESPERSON';
  limit?: number; // Max number of items to show
  showFullView?: boolean; // If true, show full interface with filters
}

export default function ProductApprovalsWidget({
  userRole,
  limit = 5,
  showFullView = false
}: ProductApprovalsWidgetProps) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const isAdmin = userRole === 'ADMIN';
  const isVendor = userRole === 'VENDOR';
  const isSalesperson = userRole === 'SALESPERSON';

  // Load vendors (only for admin)
  useEffect(() => {
    if (isAdmin && showFullView) {
      loadVendors();
    }
  }, [isAdmin, showFullView]);

  // Load approvals
  useEffect(() => {
    loadApprovals();
  }, [selectedVendor, statusFilter, userRole]);

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/v2/admin/vendors');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setVendors(data.data);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    }
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);

      // Determine endpoint based on user role
      let endpoint = '';
      if (isAdmin) {
        endpoint = '/api/v2/admin/product-approvals';
      } else if (isVendor) {
        endpoint = '/api/v2/vendors/product-approvals';
      } else if (isSalesperson) {
        // Salesperson should see their own requests
        endpoint = '/api/v2/vendors/product-approvals'; // Will be filtered by their user_id on backend
      }

      const params = new URLSearchParams();
      params.append('status', statusFilter);

      if (isAdmin && selectedVendor !== 'all') {
        params.append('vendor_id', selectedVendor);
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setApprovals(data.data.slice(0, limit));
      } else {
        setApprovals([]);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setProcessing(true);
      const endpoint = isAdmin
        ? `/api/v2/admin/product-approvals/${requestId}/approve`
        : `/api/v2/vendors/product-approvals/${requestId}/approve`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Request approved successfully');
        loadApprovals();
        setShowDetailsDialog(false);
      } else {
        toast.error(data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      const endpoint = isAdmin
        ? `/api/v2/admin/product-approvals/${selectedRequest.id}/reject`
        : `/api/v2/vendors/product-approvals/${selectedRequest.id}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Request rejected successfully');
        loadApprovals();
        setShowRejectDialog(false);
        setShowDetailsDialog(false);
        setRejectionReason('');
      } else {
        toast.error(data.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const getActionBadge = (actionType: string) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {actionType}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const canApprove = isAdmin || isVendor;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {isSalesperson ? 'My Product Requests' : 'Product Approvals'}
            </CardTitle>
            {showFullView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadApprovals()}
              >
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - only show in full view */}
          {showFullView && (
            <div className="flex gap-4 mb-4">
              {/* Vendor Filter (Admin only) */}
              {isAdmin && (
                <div className="w-64">
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.vendor_id} value={vendor.vendor_id.toString()}>
                          {vendor.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status Filter */}
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Approvals List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No approval requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(request.action_type)}
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-500">#{request.id}</span>
                      </div>

                      <h4 className="font-medium text-sm">
                        {request.product_name || 'New Product'}
                      </h4>

                      {request.product_sku && (
                        <p className="text-xs text-gray-600">SKU: {request.product_sku}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {request.requester_first_name} {request.requester_last_name}
                          </span>
                        </div>
                        {request.vendor_name && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{request.vendor_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {request.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                          <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-xs text-red-700">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>

                      {canApprove && request.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processing}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectDialog(true);
                            }}
                            disabled={processing}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!showFullView && approvals.length >= limit && (
                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      const url = isAdmin
                        ? '/admin/product-approvals'
                        : '/vendor/product-approvals';
                      window.location.href = url;
                    }}
                  >
                    View All Approvals →
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Review the product changes requested
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Action Type</label>
                  <div className="mt-1">{getActionBadge(selectedRequest.action_type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested By</label>
                  <p className="mt-1">
                    {selectedRequest.requester_first_name} {selectedRequest.requester_last_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedRequest.requester_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested On</label>
                  <p className="mt-1">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Product Data</label>
                <pre className="mt-2 bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedRequest.request_data, null, 2)}
                </pre>
              </div>

              {canApprove && selectedRequest.status === 'PENDING' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowRejectDialog(true);
                    }}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processing}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
