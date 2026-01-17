'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Package,
  AlertCircle,
  HelpCircle,
  Truck,
  RotateCcw,
  Wrench,
  CreditCard,
  Settings,
  MoreHorizontal
} from 'lucide-react';

interface Order {
  order_id: number;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
}

const categories = [
  { value: 'order_issue', label: 'Order Issue', icon: <Package className="w-4 h-4" />, description: 'Problems with your order' },
  { value: 'product_question', label: 'Product Question', icon: <HelpCircle className="w-4 h-4" />, description: 'Questions about products' },
  { value: 'shipping', label: 'Shipping', icon: <Truck className="w-4 h-4" />, description: 'Delivery & tracking issues' },
  { value: 'returns', label: 'Returns', icon: <RotateCcw className="w-4 h-4" />, description: 'Return & refund requests' },
  { value: 'installation', label: 'Installation', icon: <Wrench className="w-4 h-4" />, description: 'Installation help' },
  { value: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" />, description: 'Payment & billing issues' },
  { value: 'technical', label: 'Technical', icon: <Settings className="w-4 h-4" />, description: 'Website or account issues' },
  { value: 'other', label: 'Other', icon: <MoreHorizontal className="w-4 h-4" />, description: 'Other inquiries' },
];

const priorities = [
  { value: 'low', label: 'Low', description: 'General inquiry, no rush' },
  { value: 'medium', label: 'Medium', description: 'Standard request' },
  { value: 'high', label: 'High', description: 'Important, needs attention soon' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue, needs immediate help' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/v2/commerce/orders?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.orders) {
          setOrders(data.data.orders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError('Please provide more details (at least 10 characters)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v2/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          orderId: orderId ? parseInt(orderId) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/account/support/${data.data.ticketId}?created=true`);
      } else {
        setError(data.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/support">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600">Tell us how we can help you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What can we help you with?</CardTitle>
            <CardDescription>Select the category that best describes your issue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    category === cat.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mb-2 ${category === cat.value ? 'text-red-600' : 'text-gray-600'}`}>
                    {cat.icon}
                  </div>
                  <div className={`font-medium text-sm ${category === cat.value ? 'text-red-900' : 'text-gray-900'}`}>
                    {cat.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Selection (Optional) */}
        {(category === 'order_issue' || category === 'shipping' || category === 'returns') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Order (Optional)</CardTitle>
              <CardDescription>Select the order this issue is about</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific order</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.order_id} value={order.order_id.toString()}>
                      {order.order_number} - {formatDate(order.created_at)} - ${parseFloat(order.total_amount as any).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Details</CardTitle>
            <CardDescription>Provide details about your issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="mt-1"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your issue in detail. Include any relevant information like order numbers, product names, or error messages."
                className="mt-1 min-h-[150px]"
              />
              <p className="text-xs text-gray-500 mt-1">{message.length} characters (minimum 10)</p>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.label}</span>
                        <span className="text-xs text-gray-500">{p.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link href="/account/support">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Tips */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-red-900 mb-2">Tips for faster resolution</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Be specific about your issue and include relevant details</li>
            <li>• Include order numbers or product names when applicable</li>
            <li>• Attach screenshots if they help explain the issue</li>
            <li>• Check your email for updates on your ticket</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
