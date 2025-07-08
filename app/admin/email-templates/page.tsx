'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Edit, Eye, Save, X, Copy, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailTemplate {
  template_id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
  is_active: boolean;
  last_modified: string;
}

const templateCategories = [
  { value: 'all', label: 'All Templates' },
  { value: 'order', label: 'Order Related' },
  { value: 'user', label: 'User Account' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'system', label: 'System' },
];

const defaultTemplates: EmailTemplate[] = [
  {
    template_id: 1,
    name: 'order_confirmation',
    subject: 'Order Confirmation - #{order_number}',
    body: `Dear {customer_name},

Thank you for your order! We're excited to confirm that we've received your order #{order_number}.

Order Details:
{order_items}

Subtotal: {subtotal}
Shipping: {shipping_cost}
Tax: {tax_amount}
Total: {total_amount}

Shipping Address:
{shipping_address}

Your order will be processed within 1-2 business days. You'll receive a shipping confirmation email once your items are on their way.

If you have any questions, please don't hesitate to contact us.

Best regards,
The Smart Blinds Hub Team`,
    category: 'order',
    variables: ['customer_name', 'order_number', 'order_items', 'subtotal', 'shipping_cost', 'tax_amount', 'total_amount', 'shipping_address'],
    is_active: true,
    last_modified: new Date().toISOString(),
  },
  {
    template_id: 2,
    name: 'welcome_email',
    subject: 'Welcome to Smart Blinds Hub!',
    body: `Hi {first_name},

Welcome to Smart Blinds Hub! We're thrilled to have you as our newest member.

Your account has been successfully created. Here's what you can do now:
- Browse our extensive collection of window treatments
- Save your favorite products to your wishlist
- Track your orders in real-time
- Access exclusive member discounts

As a welcome gift, enjoy 10% off your first order with code: WELCOME10

Start Shopping: {shop_url}

Happy shopping!
The Smart Blinds Hub Team`,
    category: 'user',
    variables: ['first_name', 'email', 'shop_url'],
    is_active: true,
    last_modified: new Date().toISOString(),
  },
  {
    template_id: 3,
    name: 'installation_reminder',
    subject: 'Installation Appointment Reminder',
    body: `Dear {customer_name},

This is a friendly reminder about your upcoming installation appointment:

Date: {installation_date}
Time: {installation_time}
Installer: {installer_name}
Address: {installation_address}

Please ensure someone is available at the property during the scheduled time.

If you need to reschedule, please contact us at least 24 hours in advance.

Thank you,
Smart Blinds Hub Installation Team`,
    category: 'order',
    variables: ['customer_name', 'installation_date', 'installation_time', 'installer_name', 'installation_address'],
    is_active: true,
    last_modified: new Date().toISOString(),
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const filteredTemplates = templates.filter(
    (template) => selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTemplates(templates.map(t => 
        t.template_id === editingTemplate.template_id 
          ? { ...editingTemplate, last_modified: new Date().toISOString() }
          : t
      ));
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !previewTemplate) return;

    setLoading(true);
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Test email sent to ${testEmail}`);
    } catch (err) {
      console.error('Failed to send test email:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = (template: EmailTemplate) => {
    let preview = template.body;
    const sampleData: Record<string, string> = {
      customer_name: 'John Doe',
      first_name: 'John',
      email: 'john.doe@example.com',
      order_number: 'ORD-12345',
      order_items: '1x Premium Motorized Blinds - $299.99',
      subtotal: '$299.99',
      shipping_cost: '$9.99',
      tax_amount: '$25.50',
      total_amount: '$335.48',
      shipping_address: '123 Main St, Anytown, CA 12345',
      installation_date: 'December 15, 2024',
      installation_time: '10:00 AM - 12:00 PM',
      installer_name: 'Mike Johnson',
      installation_address: '123 Main St, Anytown, CA 12345',
      shop_url: 'https://smartblindshub.com',
    };

    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `{${variable}}`;
      preview = preview.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return preview;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-gray-600 mt-2">
          Manage email templates for automated communications
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {templateCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button>
          <Mail className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.template_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {`{${variable}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the template content and variables
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={editingTemplate.body}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = editingTemplate.body.substring(0, cursorPos);
                          const textAfter = editingTemplate.body.substring(cursorPos);
                          setEditingTemplate({
                            ...editingTemplate,
                            body: `${textBefore}{${variable}}${textAfter}`,
                          });
                        }
                      }}
                    >
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold mb-2">Subject: {previewTemplate.subject}</div>
                <div className="whitespace-pre-wrap text-sm">
                  {renderPreview(previewTemplate)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Send Test Email To:</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button onClick={handleSendTestEmail} disabled={loading || !testEmail}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}