'use client';

import { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface UserLimits {
  remainingLifetime: number;
  remainingPeriod: number;
  isSuspended: boolean;
  periodEnd: string;
}

interface Swatch {
  id: string;
  name: string;
  color: string;
  material: string;
  image: string;
  isPremium: boolean;
  inStock: boolean;
  categoryName: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface SampleRequestWidgetProps {
  userEmail?: string;
  showLimitsInfo?: boolean;
  onRequestComplete?: (orderId: string) => void;
}

export default function SampleRequestWidget({ 
  userEmail, 
  showLimitsInfo = true,
  onRequestComplete 
}: SampleRequestWidgetProps) {
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([]);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form data for shipping
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    priority: 'STANDARD'
  });

  // Load swatches and limits
  useEffect(() => {
    loadData();
  }, [userEmail, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory.toString());
      }
      if (userEmail) {
        params.append('email', userEmail);
      }

      const response = await fetch(`/api/v2/commerce/swatches?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSwatches(result.data.swatches);
        setCategories(result.data.categories);
        setUserLimits(result.data.userLimits);
      } else {
        setError(result.message || 'Failed to load swatches');
      }
    } catch (error) {
      console.error('Error loading swatches:', error);
      setError('Failed to load swatches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwatchSelect = (swatchId: string) => {
    setSelectedSwatches(prev => {
      if (prev.includes(swatchId)) {
        return prev.filter(id => id !== swatchId);
      } else {
        // Check limits before adding
        if (userLimits) {
          const newCount = prev.length + 1;
          if (newCount > userLimits.remainingPeriod) {
            setError(`You can only request ${userLimits.remainingPeriod} more samples this period`);
            return prev;
          }
          if (newCount > userLimits.remainingLifetime) {
            setError(`You can only request ${userLimits.remainingLifetime} more samples total`);
            return prev;
          }
        }
        setError('');
        return [...prev, swatchId];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/v2/commerce/swatches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedSwatches,
          shippingInfo: formData,
          priority: formData.priority
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Sample request submitted successfully! Order ID: ${result.data.orderId}`);
        setSelectedSwatches([]);
        setShowRequestForm(false);
        loadData(); // Refresh limits
        onRequestComplete?.(result.data.orderId);
      } else {
        setError(result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitRequest = () => {
    return selectedSwatches.length > 0 && 
           userLimits && 
           !userLimits.isSuspended &&
           selectedSwatches.length <= userLimits.remainingPeriod &&
           selectedSwatches.length <= userLimits.remainingLifetime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Limits Information */}
      {showLimitsInfo && userLimits && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 mb-3">Sample Request Limits</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-red-700">Remaining this period:</span>
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      {userLimits.remainingPeriod} samples
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-red-700">Lifetime remaining:</span>
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      {userLimits.remainingLifetime} samples
                    </Badge>
                  </div>
                  <div className="text-xs text-red-600 mt-2">
                    Period resets: {new Date(userLimits.periodEnd).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suspension Notice */}
      {userLimits?.isSuspended && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">
                Your sample request privileges have been suspended. Please contact customer service.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All Categories
        </Button>
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="rounded-full"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Selected Samples Counter */}
      {selectedSwatches.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  {selectedSwatches.length} sample{selectedSwatches.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <Button
                onClick={() => setShowRequestForm(true)}
                disabled={!canSubmitRequest() || userLimits?.isSuspended}
                className="bg-primary-red hover:bg-red-700"
                size="sm"
              >
                Request Samples
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Swatches Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {swatches.map(swatch => {
          const isSelected = selectedSwatches.includes(swatch.id);
          const isDisabled = !swatch.inStock || userLimits?.isSuspended;
          
          return (
            <Card
              key={swatch.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
              }`}
              onClick={() => !isDisabled && handleSwatchSelect(swatch.id)}
            >
              <CardContent className="p-3">
              {/* Sample Image */}
              <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                {swatch.image ? (
                  <img
                    src={swatch.image}
                    alt={swatch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: swatch.color }}
                  />
                )}
              </div>

              {/* Sample Info */}
              <div className="text-sm">
                <div className="font-medium text-gray-900 truncate">{swatch.name}</div>
                <div className="text-gray-500 text-xs">{swatch.material}</div>
                {swatch.categoryName && (
                  <div className="text-gray-400 text-xs">{swatch.categoryName}</div>
                )}
              </div>

                {/* Badges */}
                <div className="absolute top-2 right-2 space-y-1">
                  {swatch.isPremium && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      Premium
                    </Badge>
                  )}
                  {!swatch.inStock && (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Form Modal */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Sample Shipping</DialogTitle>
            <DialogDescription>
              Enter your shipping details to receive the selected samples.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  placeholder="State"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Shipping Priority</Label>
              <Select name="priority" value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard (3-5 business days)</SelectItem>
                  <SelectItem value="EXPRESS">Express (1-2 business days) - $5.99</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {success && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="min-w-[150px]"
              >
                {submitting ? 'Submitting...' : `Request ${selectedSwatches.length} Samples`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}