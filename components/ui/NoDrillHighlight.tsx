'use client';

import { Wrench, Shield, Home, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NoDrillHighlightProps {
  variant?: 'compact' | 'full' | 'banner';
  showBenefits?: boolean;
  className?: string;
}

export default function NoDrillHighlight({ 
  variant = 'full',
  showBenefits = true,
  className = '' 
}: NoDrillHighlightProps) {

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Wrench className="h-6 w-6 text-primary-red" />
          <div className="text-center">
            <Badge variant="outline" className="bg-red-100 text-primary-dark border-red-300 mb-2">
              No-Drill Installation
            </Badge>
            <p className="text-sm font-medium text-gray-900">
              Damage-Free Installation - No Tools Required
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <Wrench className="h-4 w-4 text-primary-red" />
        <span className="text-primary-dark font-medium">No-Drill Options Available</span>
        <Badge variant="outline" className="text-xs bg-red-50 text-primary-dark border-red-300">
          Damage-Free
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Wrench className="h-8 w-8 text-primary-red" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-red-900 mb-2">
            No-Drill Installation Options
          </h3>
          
          <p className="text-primary-dark mb-6">
            Perfect for renters, apartment dwellers, or anyone who wants to avoid 
            damaging their walls. Our no-drill options provide secure installation 
            without any holes or permanent changes.
          </p>

          {showBenefits && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Home className="h-6 w-6 text-primary-red" />
                </div>
                <h4 className="font-semibold text-red-900">Renter-Friendly</h4>
                <p className="text-sm text-primary-dark">
                  No damage to walls or window frames
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Clock className="h-6 w-6 text-primary-red" />
                </div>
                <h4 className="font-semibold text-red-900">Quick Setup</h4>
                <p className="text-sm text-primary-dark">
                  Install in minutes without any tools
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Shield className="h-6 w-6 text-primary-red" />
                </div>
                <h4 className="font-semibold text-red-900">Damage-Free</h4>
                <p className="text-sm text-primary-dark">
                  Removable without leaving marks
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-red-900">Available No-Drill Options:</h4>
            
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start space-x-3 p-3 bg-white border border-red-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary-red mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-900">Tension Mount System</h5>
                  <p className="text-sm text-primary-dark">
                    Uses spring tension to stay securely in place within the window frame
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-white border border-red-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary-red mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-900">Magnetic Brackets</h5>
                  <p className="text-sm text-primary-dark">
                    Strong magnets attach to metal window frames and doors
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-white border border-red-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary-red mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-900">Adhesive Strips</h5>
                  <p className="text-sm text-primary-dark">
                    Professional-grade removable adhesive for secure, damage-free mounting
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white border border-red-200 rounded-lg">
            <p className="text-xs text-primary-dark">
              <strong>Perfect for:</strong> Rental properties, dormitories, temporary installations, 
              or any situation where drilling is not allowed or desired.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}