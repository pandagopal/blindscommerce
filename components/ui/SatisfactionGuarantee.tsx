'use client';

import { Shield, CheckCircle, RotateCcw, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SatisfactionGuaranteeProps {
  variant?: 'compact' | 'full' | 'banner';
  showIcon?: boolean;
  className?: string;
}

export default function SatisfactionGuarantee({ 
  variant = 'full', 
  showIcon = true,
  className = '' 
}: SatisfactionGuaranteeProps) {
  
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          {showIcon && <Shield className="h-6 w-6 text-green-600" />}
          <div className="text-center">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 mb-2">
              90-Day Guarantee
            </Badge>
            <p className="text-sm font-medium text-gray-900">
              100% Satisfaction Guaranteed or Your Money Back
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        {showIcon && <Shield className="h-4 w-4 text-green-600" />}
        <span className="text-green-700 font-medium">90-Day Money Back Guarantee</span>
      </div>
    );
  }

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-green-900 mb-2">
            90-Day Satisfaction Guarantee
          </h3>
          
          <p className="text-green-800 mb-6">
            We're so confident you'll love your custom window treatments that we offer a 
            <strong> 90-day money-back guarantee</strong>. If you're not completely satisfied, 
            we'll make it right.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900">Quality Promise</h4>
              <p className="text-sm text-green-700">
                Premium materials and expert craftsmanship guaranteed
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <RotateCcw className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900">Easy Returns</h4>
              <p className="text-sm text-green-700">
                Hassle-free returns within 90 days of delivery
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900">Free Support</h4>
              <p className="text-sm text-green-700">
                Dedicated customer service and installation help
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">
              <strong>Guarantee Terms:</strong> Return products in original condition within 90 days. 
              Custom orders eligible for exchange or store credit. 
              <a href="/guarantee-policy" className="underline hover:text-green-600">
                View full terms
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}