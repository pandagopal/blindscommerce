'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Pause, 
  Play, 
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Eye
} from 'lucide-react';

interface ProductStatusManagerProps {
  productId: number;
  currentStatus: 'draft' | 'inactive' | 'active' | 'suspended';
  isVendor?: boolean;
  onStatusChange?: (newStatus: string) => void;
}

interface ValidationCheck {
  hasPrice: boolean;
  hasDescription: boolean;
  hasImages: boolean;
}

interface ProductInfo {
  productId: number;
  name: string;
  slug: string;
  status: string;
  price: number;
  description: string;
  imageCount: number;
  updatedAt: string;
}

interface StatusHistory {
  log_id: number;
  old_status: string;
  new_status: string;
  change_reason: string;
  created_at: string;
  changed_by_username: string;
}

const statusConfig = {
  draft: {
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
    label: 'Draft',
    description: 'Product is being prepared'
  },
  inactive: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Inactive',
    description: 'Product is not visible to customers'
  },
  active: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Active',
    description: 'Product is live and available for purchase'
  },
  suspended: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Pause,
    label: 'Suspended',
    description: 'Product is temporarily unavailable'
  }
};

export default function ProductStatusManager({
  productId,
  currentStatus,
  isVendor = false,
  onStatusChange
}: ProductStatusManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [validation, setValidation] = useState<ValidationCheck>({
    hasPrice: false,
    hasDescription: false,
    hasImages: false
  });
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isVendor) {
      fetchProductInfo();
    }
  }, [productId, isVendor]);

  const fetchProductInfo = async () => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}/activate`);
      const data = await response.json();
      
      if (response.ok) {
        setProductInfo(data.product);
        setValidation(data.validation.checks);
        setStatusHistory(data.statusHistory || []);
      }
    } catch (err) {
      console.error('Failed to fetch product info:', err);
    }
  };

  const getAvailableStatuses = (current: string): string[] => {
    const transitions: Record<string, string[]> = {
      'draft': ['active', 'inactive'],
      'inactive': ['active', 'suspended'],
      'active': ['inactive', 'suspended'],
      'suspended': ['inactive']
    };
    return transitions[current] || [];
  };

  const canActivate = selectedStatus === 'active' && validation.hasPrice && validation.hasDescription && validation.hasImages;

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    if (selectedStatus === 'active' && !canActivate) {
      setError('Product must have price, description, and images to be activated');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/vendor/products/${productId}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccess(`Product status changed to ${selectedStatus}`);
      
      if (onStatusChange) {
        onStatusChange(selectedStatus);
      }

      // Refresh product info
      await fetchProductInfo();
      
      // Clear notes
      setNotes('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const CurrentStatusIcon = statusConfig[currentStatus as keyof typeof statusConfig]?.icon || Clock;

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrentStatusIcon className="h-5 w-5" />
            Product Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={statusConfig[currentStatus as keyof typeof statusConfig]?.color}>
                {statusConfig[currentStatus as keyof typeof statusConfig]?.label}
              </Badge>
              <span className="text-sm text-gray-600">
                {statusConfig[currentStatus as keyof typeof statusConfig]?.description}
              </span>
            </div>
            
            {isVendor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showHistory ? 'Hide' : 'View'} History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Checks (for vendors) */}
      {isVendor && productInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Activation Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${validation.hasPrice ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.hasPrice ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Valid Price</span>
                </div>
                {productInfo.price && (
                  <Badge variant="outline">${productInfo.price}</Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${validation.hasDescription ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.hasDescription ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Product Description</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${validation.hasImages ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.hasImages ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Product Images</span>
                </div>
                {productInfo.imageCount > 0 && (
                  <Badge variant="outline">{productInfo.imageCount} image{productInfo.imageCount !== 1 ? 's' : ''}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Form (for vendors) */}
      {isVendor && (
        <Card>
          <CardHeader>
            <CardTitle>Change Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="status-select">New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentStatus} disabled>
                    {statusConfig[currentStatus as keyof typeof statusConfig]?.label} (Current)
                  </SelectItem>
                  {getAvailableStatuses(currentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status as keyof typeof statusConfig]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes (Optional)</Label>
              <Textarea
                id="status-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
                disabled={loading}
              />
            </div>

            {selectedStatus === 'active' && !canActivate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Product cannot be activated until all requirements are met (price, description, and images).
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleStatusChange}
              disabled={loading || selectedStatus === currentStatus || (selectedStatus === 'active' && !canActivate)}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Change Status to {statusConfig[selectedStatus as keyof typeof statusConfig]?.label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {isVendor && showHistory && statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.map((entry) => (
                <div key={entry.log_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={statusConfig[entry.old_status as keyof typeof statusConfig]?.color}>
                      {statusConfig[entry.old_status as keyof typeof statusConfig]?.label}
                    </Badge>
                    <span>→</span>
                    <Badge className={statusConfig[entry.new_status as keyof typeof statusConfig]?.color}>
                      {statusConfig[entry.new_status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>by {entry.changed_by_username}</div>
                    <div>{new Date(entry.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}