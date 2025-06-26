'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Plus, Search, Calendar, DollarSign, User, 
  Send, Edit, Copy, Download, Eye, Timer, CheckCircle 
} from 'lucide-react';

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
  const [filterDate, setFilterDate] = useState<string>('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/sales/quotes');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'sales' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/sales/quotes');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      // Mock data since API might not exist yet
      const mockQuotes: Quote[] = [
        {
          id: 'quote-001',
          quote_number: 'Q-2023-001',
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah@example.com',
          customer_phone: '(555) 123-4567',
          project_name: 'Living Room & Kitchen Blinds',
          status: 'sent',
          total_amount: 1250.00,
          created_date: '2023-10-20',
          valid_until: '2023-11-19',
          sent_date: '2023-10-21',
          items: [
            {
              id: 'item-1',
              product_name: 'Premium Wood Blinds',
              description: 'Custom 48" x 60" wood blinds with cord lift',
              quantity: 3,
              unit_price: 285.00,
              total_price: 855.00,
              room: 'Living Room'
            },
            {
              id: 'item-2',
              product_name: 'Cellular Shades',
              description: 'Light filtering cellular shades 36" x 48"',
              quantity: 2,
              unit_price: 165.00,
              total_price: 330.00,
              room: 'Kitchen'
            },
            {
              id: 'item-3',
              product_name: 'Installation Service',
              description: 'Professional installation for all windows',
              quantity: 1,
              unit_price: 65.00,
              total_price: 65.00,
              room: 'All'
            }
          ],
          notes: 'Customer interested in motorization upgrade',
          follow_up_date: '2023-10-28'
        },
        {
          id: 'quote-002',
          quote_number: 'Q-2023-002',
          customer_name: 'Mike Wilson',
          customer_email: 'mike@example.com',
          customer_phone: '(555) 234-5678',
          project_name: 'Office Building - Conference Rooms',
          status: 'accepted',
          total_amount: 3500.00,
          created_date: '2023-10-18',
          valid_until: '2023-11-17',
          sent_date: '2023-10-19',
          items: [
            {
              id: 'item-4',
              product_name: 'Commercial Roller Shades',
              description: 'Blackout roller shades for conference rooms',
              quantity: 8,
              unit_price: 375.00,
              total_price: 3000.00,
              room: 'Conference Rooms'
            },
            {
              id: 'item-5',
              product_name: 'Commercial Installation',
              description: 'Professional installation with warranty',
              quantity: 1,
              unit_price: 500.00,
              total_price: 500.00,
              room: 'All'
            }
          ]
        },
        {
          id: 'quote-003',
          quote_number: 'Q-2023-003',
          customer_name: 'Lisa Chen',
          customer_email: 'lisa@example.com',
          customer_phone: '(555) 345-6789',
          project_name: 'Bedroom & Bathroom Updates',
          status: 'draft',
          total_amount: 890.00,
          created_date: '2023-10-25',
          valid_until: '2023-11-24',
          items: [
            {
              id: 'item-6',
              product_name: 'Privacy Cellular Shades',
              description: 'Top-down bottom-up cellular shades',
              quantity: 4,
              unit_price: 195.00,
              total_price: 780.00,
              room: 'Bedrooms'
            },
            {
              id: 'item-7',
              product_name: 'Bathroom Blinds',
              description: 'Moisture-resistant faux wood blinds',
              quantity: 2,
              unit_price: 55.00,
              total_price: 110.00,
              room: 'Bathroom'
            }
          ],
          notes: 'Customer wants to see samples before finalizing'
        },
        {
          id: 'quote-004',
          quote_number: 'Q-2023-004',
          customer_name: 'David Thompson',
          customer_email: 'david@example.com',
          customer_phone: '(555) 456-7890',
          project_name: 'Smart Home Integration',
          status: 'viewed',
          total_amount: 2100.00,
          created_date: '2023-10-22',
          valid_until: '2023-11-21',
          sent_date: '2023-10-23',
          items: [
            {
              id: 'item-8',
              product_name: 'Motorized Blinds',
              description: 'Smart motorized blinds with app control',
              quantity: 6,
              unit_price: 320.00,
              total_price: 1920.00,
              room: 'Whole House'
            },
            {
              id: 'item-9',
              product_name: 'Smart Hub Setup',
              description: 'Installation and configuration of smart hub',
              quantity: 1,
              unit_price: 180.00,
              total_price: 180.00,
              room: 'Main'
            }
          ],
          follow_up_date: '2023-10-30'
        }
      ];

      const mockStats: QuoteStats = {
        total_quotes: 48,
        pending_quotes: 12,
        accepted_quotes: 28,
        total_value: 125000,
        conversion_rate: 68.5
      };

      setQuotes(mockQuotes);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuote = async (quoteId: string) => {
    try {
      // Mock API call
      alert('Quote sent successfully! Customer will receive an email.');
      fetchQuotes(); // Refresh data
    } catch (error) {
      console.error('Error sending quote:', error);
    }
  };

  const duplicateQuote = async (quoteId: string) => {
    try {
      // Mock API call
      alert('Quote duplicated successfully!');
      fetchQuotes(); // Refresh data
    } catch (error) {
      console.error('Error duplicating quote:', error);
    }
  };

  const downloadQuote = async (quoteId: string) => {
    try {
      // Mock download functionality
      alert(`Downloading quote ${quoteId} as PDF...`);
    } catch (error) {
      console.error('Error downloading quote:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      sent: 'default',
      viewed: 'warning',
      accepted: 'success',
      rejected: 'destructive',
      expired: 'destructive'
    } as const;

    const icons = {
      draft: Edit,
      sent: Send,
      viewed: Eye,
      accepted: CheckCircle,
      rejected: Timer,
      expired: Timer
    };

    const Icon = icons[status as keyof typeof icons] || FileText;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Quote Management
            </h1>
            <p className="text-gray-600">Create, manage, and track your sales quotes</p>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.total_quotes || 0}</div>
              <div className="text-sm text-gray-600">Total Quotes</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Timer className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.pending_quotes || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.accepted_quotes || 0}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_value || 0)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.conversion_rate || 0}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-purple-100 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
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

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotes List */}
        <Card className="border-purple-100 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Quotes ({filteredQuotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">{quote.quote_number}</h4>
                      {getStatusBadge(quote.status)}
                      {getDaysUntilExpiry(quote.valid_until) <= 7 && quote.status !== 'accepted' && (
                        <Badge variant="destructive" className="text-xs">
                          Expires in {getDaysUntilExpiry(quote.valid_until)} days
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{quote.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{quote.project_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(quote.total_amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {formatDate(quote.created_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span>Expires: {formatDate(quote.valid_until)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{quote.items.length} items</span>
                      </div>
                    </div>
                    {quote.notes && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Notes:</strong> {quote.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuote(quote)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Quote Details - {selectedQuote?.quote_number}</DialogTitle>
                        </DialogHeader>
                        {selectedQuote && (
                          <div className="space-y-6">
                            {/* Quote Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div><strong>Customer:</strong> {selectedQuote.customer_name}</div>
                              <div><strong>Email:</strong> {selectedQuote.customer_email}</div>
                              <div><strong>Phone:</strong> {selectedQuote.customer_phone}</div>
                              <div><strong>Project:</strong> {selectedQuote.project_name}</div>
                              <div><strong>Status:</strong> {getStatusBadge(selectedQuote.status)}</div>
                              <div><strong>Total:</strong> {formatCurrency(selectedQuote.total_amount)}</div>
                              <div><strong>Created:</strong> {formatDate(selectedQuote.created_date)}</div>
                              <div><strong>Expires:</strong> {formatDate(selectedQuote.valid_until)}</div>
                            </div>

                            {/* Items */}
                            <div>
                              <h3 className="font-medium mb-2">Quote Items ({selectedQuote.items.length})</h3>
                              <div className="space-y-2">
                                {selectedQuote.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <div className="font-medium">{item.product_name}</div>
                                      <div className="text-sm text-gray-600">{item.description}</div>
                                      {item.room && (
                                        <div className="text-xs text-blue-600">Room: {item.room}</div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">{formatCurrency(item.total_price)}</div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity} × {formatCurrency(item.unit_price)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t">
                              {selectedQuote.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={() => sendQuote(selectedQuote.id)}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Quote
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateQuote(selectedQuote.id)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Duplicate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadQuote(selectedQuote.id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {quote.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => sendQuote(quote.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateQuote(quote.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQuote(quote.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredQuotes.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Quotes Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'No quotes match your current filters.'
                    : 'You haven\'t created any quotes yet.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}