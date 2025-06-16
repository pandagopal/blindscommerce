'use client';

import { useState } from 'react';
import { TrendingDown, AlertCircle, CheckCircle, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PriceMatchGuaranteeProps {
  variant?: 'compact' | 'full' | 'banner';
  productId?: string;
  currentPrice?: number;
  className?: string;
}

export default function PriceMatchGuarantee({ 
  variant = 'full', 
  productId,
  currentPrice,
  className = '' 
}: PriceMatchGuaranteeProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    competitorName: '',
    competitorUrl: '',
    competitorPrice: '',
    productUrl: '',
    additionalInfo: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/price-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          productId,
          currentPrice,
          competitorPrice: parseFloat(formData.competitorPrice)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          competitorName: '',
          competitorUrl: '',
          competitorPrice: '',
          productUrl: '',
          additionalInfo: ''
        });
      } else {
        setError(data.error || 'Failed to submit price match request');
      }
    } catch (error) {
      console.error('Error submitting price match request:', error);
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-6 w-6 text-blue-600" />
            <div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 mb-1">
                Price Match Guarantee
              </Badge>
              <p className="text-sm font-medium text-gray-900">
                Found a lower price? We'll match it + beat it by 5%
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowRequestForm(true)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Request Match
          </Button>
        </div>
        <PriceMatchModal 
          open={showRequestForm}
          onOpenChange={setShowRequestForm}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          loading={loading}
          success={success}
          error={error}
          currentPrice={currentPrice}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <TrendingDown className="h-4 w-4 text-blue-600" />
        <span className="text-blue-700 font-medium">Price Match Guarantee</span>
        <Button
          onClick={() => setShowRequestForm(true)}
          variant="link"
          size="sm"
          className="p-0 h-auto text-blue-600 underline"
        >
          Request Match
        </Button>
        <PriceMatchModal 
          open={showRequestForm}
          onOpenChange={setShowRequestForm}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          loading={loading}
          success={success}
          error={error}
          currentPrice={currentPrice}
        />
      </div>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-blue-900 mb-2">
            14-Day Price Match Guarantee
          </h3>
          
          <p className="text-blue-800 mb-6">
            Found the same product for less? We'll match the price and 
            <strong> beat it by 5%</strong>. Simply submit a price match request within 
            14 days of your purchase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
            <div className="space-y-2">
              <div className="flex justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">Same Product</h4>
              <p className="text-sm text-blue-700">
                Identical model, size, and specifications
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">Lower Price</h4>
              <p className="text-sm text-blue-700">
                Current advertised price from authorized dealer
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <ExternalLink className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">Easy Process</h4>
              <p className="text-sm text-blue-700">
                Submit competitor link and we'll verify the price
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Request Price Match
          </Button>

          <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Conditions apply:</strong> Price must be from authorized dealer, 
              in stock, and for identical product. Sale/clearance prices excluded. 
              <a href="/price-match-policy" className="underline hover:text-blue-600">
                View full terms
              </a>
            </p>
          </div>

          <PriceMatchModal 
            open={showRequestForm}
            onOpenChange={setShowRequestForm}
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            loading={loading}
            success={success}
            error={error}
            currentPrice={currentPrice}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Separate modal component
function PriceMatchModal({
  open,
  onOpenChange,
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  success,
  error,
  currentPrice
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  success: boolean;
  error: string;
  currentPrice?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Price Match</DialogTitle>
          <DialogDescription>
            Submit competitor pricing information and we'll review your request within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">
              We'll review your price match request and contact you within 24 hours with our decision.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentPrice && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current Price: <span className="font-semibold">${currentPrice.toFixed(2)}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
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
              <Label htmlFor="competitorName">Competitor Store Name *</Label>
              <Input
                id="competitorName"
                name="competitorName"
                value={formData.competitorName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Blinds.com, Home Depot"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitorPrice">Competitor Price *</Label>
              <Input
                id="competitorPrice"
                name="competitorPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.competitorPrice}
                onChange={handleInputChange}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitorUrl">Competitor Product URL *</Label>
              <Input
                id="competitorUrl"
                name="competitorUrl"
                type="url"
                value={formData.competitorUrl}
                onChange={handleInputChange}
                required
                placeholder="https://competitor.com/product-page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                placeholder="Any additional details about the competitor offer..."
                rows={3}
              />
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

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[150px]"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}