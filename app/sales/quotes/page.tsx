'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Search, DollarSign, Send, Copy, Download, Eye, Timer, CheckCircle } from 'lucide-react';

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  project_name: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  created_date: string;
  valid_until: string;
  sent_date?: string;
  items: QuoteItem[];
  notes?: string;
  follow_up_date?: string;
}

interface QuoteItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  room?: string;
}

interface QuoteStats {
  total_quotes: number;
  pending_quotes: number;
  accepted_quotes: number;
  total_value: number;
  conversion_rate: number;
}

export default function SalesQuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) { router.push('/login?redirect=/sales/quotes'); return; }
        const result = await res.json();
        const data = result.data || result;
        if (data.user.role !== 'sales' && data.user.role !== 'admin') { router.push('/'); return; }
        setUser(data.user);
      } catch (error) {
        router.push('/login?redirect=/sales/quotes');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => { if (user) fetchQuotes(); }, [user]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const [quotesRes, statsRes] = await Promise.all([
        fetch('/api/v2/commerce/quotes'),
        fetch('/api/v2/commerce/quote-stats')
      ]);
      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData.data || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || null);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/v2/commerce/quotes/${quoteId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to send quote');
      } else {
        alert('Quote sent successfully!');
        fetchQuotes();
      }
    } catch (error) {
      alert('Failed to send quote');
    }
  };

  const duplicateQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/v2/commerce/quotes/${quoteId}/duplicate`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        alert('Quote duplicated!');
        fetchQuotes();
      }
    } catch (error) {
      alert('Failed to duplicate quote');
    }
  };

  const downloadQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/v2/commerce/quotes/${quoteId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quoteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Failed to download quote');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date();
    const expiry = new Date(validUntil);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredQuotes = quotes.filter(quote => {
    if (filterStatus !== 'all' && quote.status !== filterStatus) return false;
    if (searchTerm && !quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !quote.project_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Quote Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Quote</Button>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold">{stats?.total_quotes || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-bold">{stats?.pending_quotes || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Accepted</p>
                <p className="text-lg font-bold">{stats?.accepted_quotes || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-red" />
              <div>
                <p className="text-xs text-gray-500">Value</p>
                <p className="text-lg font-bold">{formatCurrency(stats?.total_value || 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-gray-500">Conversion</p>
                <p className="text-lg font-bold text-green-600">{stats?.conversion_rate || 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search quotes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Quote #</th>
                  <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left p-3 font-medium text-gray-600">Project</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-center p-3 font-medium text-gray-600">Items</th>
                  <th className="text-right p-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-600">Created</th>
                  <th className="text-left p-3 font-medium text-gray-600">Expires</th>
                  <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{quote.quote_number}</td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{quote.customer_name}</div>
                      <div className="text-xs text-gray-500">{quote.customer_email}</div>
                    </td>
                    <td className="p-3 text-gray-600 max-w-[150px] truncate">{quote.project_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                      {getDaysUntilExpiry(quote.valid_until) <= 7 && quote.status !== 'accepted' && quote.status !== 'rejected' && (
                        <span className="ml-1 text-xs text-red-600">({getDaysUntilExpiry(quote.valid_until)}d)</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-gray-600">{quote.items.length}</td>
                    <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(quote.total_amount)}</td>
                    <td className="p-3 text-gray-600">{formatDate(quote.created_date)}</td>
                    <td className="p-3 text-gray-600">{formatDate(quote.valid_until)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedQuote(quote)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Quote {selectedQuote?.quote_number}</DialogTitle></DialogHeader>
                            {selectedQuote && (
                              <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-gray-500">Customer</p>
                                    <p className="font-medium">{selectedQuote.customer_name}</p>
                                    <p className="text-gray-600">{selectedQuote.customer_email}</p>
                                    <p className="text-gray-600">{selectedQuote.customer_phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Project</p>
                                    <p className="font-medium">{selectedQuote.project_name}</p>
                                    <p className="text-gray-600">Expires: {formatDate(selectedQuote.valid_until)}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium mb-2">Items ({selectedQuote.items.length})</p>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedQuote.items.map((item) => (
                                      <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{item.product_name}</p>
                                          <p className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t">
                                  <div className="flex gap-2">
                                    {selectedQuote.status === 'draft' && (
                                      <Button size="sm" onClick={() => sendQuote(selectedQuote.id)}><Send className="h-4 w-4 mr-1" /> Send</Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => duplicateQuote(selectedQuote.id)}><Copy className="h-4 w-4 mr-1" /> Duplicate</Button>
                                    <Button variant="outline" size="sm" onClick={() => downloadQuote(selectedQuote.id)}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                                  </div>
                                  <p className="text-lg font-bold">{formatCurrency(selectedQuote.total_amount)}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {quote.status === 'draft' && (
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => sendQuote(quote.id)}><Send className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateQuote(quote.id)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => downloadQuote(quote.id)}><Download className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuotes.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">No quotes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
