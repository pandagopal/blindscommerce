'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageCircle, ShoppingCart, HelpCircle, Copy, Check } from 'lucide-react';

interface AssistanceRequestProps {
  onRequestSubmitted?: (data: { accessPin: string; sessionId: number }) => void;
}

export default function AssistanceRequest({ onRequestSubmitted }: AssistanceRequestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionType, setSessionType] = useState<'cart_assistance' | 'consultation' | 'general_support'>('cart_assistance');
  const [response, setResponse] = useState<{
    success: boolean;
    accessPin?: string;
    sessionId?: number;
    expiresAt?: string;
    availableStaff?: number;
    error?: string;
  } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  const sessionTypes = [
    {
      value: 'cart_assistance' as const,
      label: 'Cart Assistance',
      description: 'Help with my current cart items and checkout',
      icon: ShoppingCart
    },
    {
      value: 'consultation' as const,
      label: 'Product Consultation',
      description: 'Expert advice on product selection',
      icon: MessageCircle
    },
    {
      value: 'general_support' as const,
      label: 'General Support',
      description: 'General questions and support',
      icon: HelpCircle
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/v2/users/request-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType,
          message: message.trim() || undefined
        }),
      });

      const result = await res.json();
      if (result.success) {
        setResponse({
          success: true,
          accessPin: result.data.accessPin,
          sessionId: result.data.sessionId,
          expiresAt: result.data.expiresAt,
          availableStaff: result.data.availableStaff
        });

        if (onRequestSubmitted) {
          onRequestSubmitted({
            accessPin: result.data.accessPin,
            sessionId: result.data.sessionId
          });
        }
      } else {
        setResponse({
          success: false,
          error: result.message || 'Failed to request assistance'
        });
      }
    } catch (error) {
      console.error('Error requesting assistance:', error);
      setResponse({
        success: false,
        error: 'Failed to request assistance. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPinToClipboard = async () => {
    if (response?.accessPin) {
      try {
        await navigator.clipboard.writeText(response.accessPin);
        setPinCopied(true);
        setTimeout(() => setPinCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy PIN:', error);
      }
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));
    return `${diffMinutes} minutes`;
  };

  if (response?.success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Assistance Request Created</CardTitle>
          <CardDescription>
            Share your PIN with a sales representative to get help
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Your Access PIN</div>
            <div className="flex items-center justify-center space-x-2">
              <div className="text-3xl font-mono font-bold bg-gray-100 px-4 py-2 rounded-lg">
                {response.accessPin}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyPinToClipboard}
                className="ml-2"
              >
                {pinCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Session Type:</span>
              <Badge variant="outline">
                {sessionTypes.find(t => t.value === sessionType)?.label}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Expires in:</span>
              <span>{response.expiresAt ? formatExpiryTime(response.expiresAt) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Staff:</span>
              <span>{response.availableStaff || 0} online</span>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              A sales representative will be notified of your request. Share your PIN with them to begin assistance.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResponse(null);
              setMessage('');
              setPinCopied(false);
            }}
          >
            Request New Assistance
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request Sales Assistance</CardTitle>
        <CardDescription>
          Get help from our sales team with your shopping or questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              What kind of assistance do you need?
            </label>
            <div className="grid gap-3">
              {sessionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      sessionType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSessionType(type.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-primary-red mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        sessionType === type.value
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}>
                        {sessionType === type.value && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-medium mb-2 block">
              Additional Details (Optional)
            </label>
            <Textarea
              id="message"
              placeholder="Describe what you need help with..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {response?.error && (
            <Alert variant="destructive">
              <AlertDescription>{response.error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-primary-dark"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting Assistance...
              </>
            ) : (
              'Request Assistance'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}