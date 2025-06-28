'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendorDiscount {
  type: 'vendor_discount' | 'vendor_coupon';
  vendor_id: number;
  vendor_name: string;
  discount_id?: number;
  coupon_id?: number;
  coupon_code?: string;
  name: string;
  discount_type: string;
  amount: number;
  applied_to: string;
  vendor_subtotal?: number;
  vendor_subtotal_after?: number;
}

interface AppliedDiscountsListProps {
  appliedDiscounts: VendorDiscount[];
  totalDiscountAmount: number;
  onRemoveCoupon?: (couponCode: string) => void;
}

export default function AppliedDiscountsList({ 
  appliedDiscounts, 
  totalDiscountAmount,
  onRemoveCoupon 
}: AppliedDiscountsListProps) {
  if (appliedDiscounts.length === 0) {
    return null;
  }

  const discounts = appliedDiscounts.filter(d => d.type === 'vendor_discount');
  const coupons = appliedDiscounts.filter(d => d.type === 'vendor_coupon');

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-green-800 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Applied Savings
          <Badge variant="secondary" className="ml-auto">
            -${totalDiscountAmount.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vendor Automatic Discounts */}
        {discounts.map((discount) => (
          <div 
            key={`discount-${discount.vendor_id}-${discount.discount_id}`}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Percent className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{discount.name}</div>
                <div className="text-sm text-gray-600">
                  {discount.vendor_name} • Automatic {discount.discount_type}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                -${discount.amount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                Applied to {discount.applied_to === 'all_vendor_products' ? 'all products' : 'selected products'}
              </div>
            </div>
          </div>
        ))}

        {/* Vendor Coupons */}
        {coupons.map((coupon) => (
          <div 
            key={`coupon-${coupon.vendor_id}-${coupon.coupon_id}`}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{coupon.name}</div>
                <div className="text-sm text-gray-600">
                  {coupon.vendor_name} • Code: {coupon.coupon_code}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  -${coupon.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {coupon.discount_type} discount
                </div>
              </div>
              {onRemoveCoupon && coupon.coupon_code && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCoupon(coupon.coupon_code!)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Summary by Vendor */}
        {appliedDiscounts.length > 1 && (
          <div className="pt-2 border-t border-green-200">
            <div className="text-sm text-gray-600 mb-2">Savings by Vendor:</div>
            {Array.from(new Set(appliedDiscounts.map(d => d.vendor_id))).map(vendorId => {
              const vendorDiscounts = appliedDiscounts.filter(d => d.vendor_id === vendorId);
              const vendorTotal = vendorDiscounts.reduce((sum, d) => sum + d.amount, 0);
              const vendorName = vendorDiscounts[0]?.vendor_name;
              
              return (
                <div key={vendorId} className="flex justify-between text-sm">
                  <span className="text-gray-700">{vendorName}:</span>
                  <span className="font-medium text-green-600">-${vendorTotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}