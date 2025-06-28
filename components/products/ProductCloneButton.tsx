'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Loader2, Check, AlertCircle } from 'lucide-react';

interface ProductCloneButtonProps {
  productId: number;
  productName: string;
  productPrice: number;
  isVendor?: boolean;
  onCloneSuccess?: (clonedProduct: any) => void;
}

interface CloneFormData {
  name: string;
  price: number;
  description: string;
  vendorDescription: string;
}

export default function ProductCloneButton({
  productId,
  productName,
  productPrice,
  isVendor = false,
  onCloneSuccess
}: ProductCloneButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CloneFormData>({
    name: `${productName} - Copy`,
    price: productPrice,
    description: '',
    vendorDescription: ''
  });

  const handleInputChange = (field: keyof CloneFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Product name is required';
    }
    if (formData.price <= 0) {
      return 'Product price must be greater than 0';
    }
    if (!formData.vendorDescription.trim()) {
      return 'Vendor description is required';
    }
    return null;
  };

  const handleClone = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/vendors/products/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          customizations: {
            name: formData.name,
            price: formData.price,
            description: formData.description,
            vendorDescription: formData.vendorDescription
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to clone product');
      }
      if (!data.success) {
        throw new Error(data.message || 'Failed to clone product');
      }

      setSuccess(true);
      
      // Call success callback if provided
      if (onCloneSuccess) {
        onCloneSuccess(data.data?.clonedProduct || data.clonedProduct);
      }

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        // Reset form
        setFormData({
          name: `${productName} - Copy`,
          price: productPrice,
          description: '',
          vendorDescription: ''
        });
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone product');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show clone button if not a vendor
  if (!isVendor) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          Clone Product
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Clone Product: {productName}</DialogTitle>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Product cloned successfully! The new product is in draft status and ready for editing.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="clone-name">Product Name</Label>
              <Input
                id="clone-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clone-price">Price ($)</Label>
              <Input
                id="clone-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="Enter price"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clone-description">Product Description (Optional)</Label>
              <Textarea
                id="clone-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter custom product description (leave empty to use original)"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clone-vendor-description">Vendor Description</Label>
              <Textarea
                id="clone-vendor-description"
                value={formData.vendorDescription}
                onChange={(e) => handleInputChange('vendorDescription', e.target.value)}
                placeholder="Enter description for your vendor catalog"
                rows={3}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClone}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Clone Product
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}