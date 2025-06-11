'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Globe } from 'lucide-react';

interface ProductVendorBadgeProps {
  productId: number;
  className?: string;
}

interface VendorAssignment {
  vendorId: number;
  companyName: string;
  status: string;
}

export default function ProductVendorBadge({ productId, className = '' }: ProductVendorBadgeProps) {
  const [vendors, setVendors] = useState<VendorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorAssignments();
  }, [productId]);

  const fetchVendorAssignments = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendor assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse ${className}`}>
        Loading...
      </Badge>
    );
  }

  if (vendors.length === 0) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Globe className="h-3 w-3" />
        Marketplace
      </Badge>
    );
  }

  if (vendors.length === 1) {
    return (
      <Badge variant="default" className={`gap-1 ${className}`}>
        <Building2 className="h-3 w-3" />
        {vendors[0].companyName}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`gap-1 ${className}`}>
      <Users className="h-3 w-3" />
      {vendors.length} Vendors
    </Badge>
  );
}