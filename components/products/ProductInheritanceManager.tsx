'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  GitBranch, 
  Sync, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Settings,
  ArrowUpDown
} from 'lucide-react';

interface InheritanceRelationship {
  inheritanceId: number;
  parentProduct: {
    productId: number;
    name: string;
    slug: string;
    price: number;
  };
  childProduct: {
    productId: number;
    name: string;
    slug: string;
    price: number;
    vendorPrice: number | null;
    status: string;
  };
  inheritanceType: 'clone' | 'variant' | 'template_instance';
  inheritedFields: Record<string, boolean>;
  customFields: Record<string, any>;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductInheritanceManagerProps {
  productId?: number;
  vendorId?: number;
  onInheritanceChange?: () => void;
}

const inheritanceTypeLabels = {
  clone: 'Clone',
  variant: 'Variant',
  template_instance: 'Template Instance'
};

const inheritanceTypeColors = {
  clone: 'bg-blue-100 text-blue-800',
  variant: 'bg-green-100 text-green-800',
  template_instance: 'bg-purple-100 text-purple-800'
};

const fieldLabels = {
  name: 'Product Name',
  description: 'Description',
  features: 'Features',
  categories: 'Categories',
  specifications: 'Specifications',
  images: 'Images',
  options: 'Configuration Options'
};

export default function ProductInheritanceManager({
  productId,
  vendorId,
  onInheritanceChange
}: ProductInheritanceManagerProps) {
  const [relationships, setRelationships] = useState<InheritanceRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInheritanceRelationships();
  }, [productId, vendorId]);

  const fetchInheritanceRelationships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId.toString());
      
      const response = await fetch(`/api/v2/vendors/products/inheritance?${params}`);
      const data = await response.json();

      if (response.ok) {
        if (!data.success) throw new Error(data.message || 'API request failed');
        setRelationships(data.data?.inheritanceRelationships || []);
      } else {
        setError(data.message || data.error || 'Failed to fetch inheritance relationships');
      }
    } catch (err) {
      setError('Failed to fetch inheritance relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (inheritanceId: number, fieldsToSync: string[] = []) => {
    setSyncingIds(prev => new Set(prev).add(inheritanceId));
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v2/vendors/products/inheritance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inheritanceId,
          fieldsToSync
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!data.success) throw new Error(data.message || 'API request failed');
        setSuccess(`Product synced successfully. ${data.data?.syncActions?.join(', ') || ''}`);
        await fetchInheritanceRelationships();
        
        if (onInheritanceChange) {
          onInheritanceChange();
        }
      } else {
        setError(data.message || data.error || 'Failed to sync product');
      }
    } catch (err) {
      setError('Failed to sync product');
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(inheritanceId);
        return newSet;
      });
    }
  };

  const updateSyncEnabled = async (inheritanceId: number, syncEnabled: boolean) => {
    try {
      const relationship = relationships.find(r => r.inheritanceId === inheritanceId);
      if (!relationship) return;

      const response = await fetch('/api/v2/vendors/products/inheritance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentProductId: relationship.parentProduct.productId,
          childProductId: relationship.childProduct.productId,
          inheritanceType: relationship.inheritanceType,
          inheritedFields: relationship.inheritedFields,
          customFields: relationship.customFields,
          syncEnabled
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        await fetchInheritanceRelationships();
        setSuccess(`Auto-sync ${syncEnabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        const data = await response.json();
        setError(data.message || data.error || 'Failed to update sync settings');
      }
    } catch (err) {
      setError('Failed to update sync settings');
    }
  };

  const formatLastSynced = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) return 'Never synced';
    
    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inheritance relationships...</span>
        </CardContent>
      </Card>
    );
  }

  if (relationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Product Inheritance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No inheritance relationships found</p>
            <p className="text-sm">Products cloned from templates will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Product Inheritance ({relationships.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {relationships.map((relationship) => (
            <div key={relationship.inheritanceId} className="border rounded-lg p-6">
              {/* Relationship Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={inheritanceTypeColors[relationship.inheritanceType]}>
                    {inheritanceTypeLabels[relationship.inheritanceType]}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Created {new Date(relationship.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`sync-${relationship.inheritanceId}`}
                      checked={relationship.syncEnabled}
                      onCheckedChange={(checked) => 
                        updateSyncEnabled(relationship.inheritanceId, checked)
                      }
                    />
                    <Label htmlFor={`sync-${relationship.inheritanceId}`} className="text-sm">
                      Auto-sync
                    </Label>
                  </div>
                </div>
              </div>

              {/* Product Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Parent Product */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Parent Product</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-medium">{relationship.parentProduct.name}</h4>
                    <p className="text-sm text-gray-600">${relationship.parentProduct.price}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ArrowUpDown className="h-6 w-6 text-gray-400" />
                </div>

                {/* Child Product */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Your Product</Label>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{relationship.childProduct.name}</h4>
                      <Badge variant="outline">{relationship.childProduct.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      ${relationship.childProduct.vendorPrice || relationship.childProduct.price}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inherited Fields */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Inherited Fields</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(relationship.inheritedFields).map(([field, inherited]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${inherited ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">{fieldLabels[field as keyof typeof fieldLabels] || field}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Sync Status and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Last synced: {formatLastSynced(relationship.lastSyncedAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={syncingIds.has(relationship.inheritanceId)}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSync(relationship.inheritanceId)}
                    disabled={syncingIds.has(relationship.inheritanceId)}
                  >
                    {syncingIds.has(relationship.inheritanceId) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Sync className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}