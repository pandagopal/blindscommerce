'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Package,
  Search,
  Filter
} from 'lucide-react';

interface Ticket {
  ticket_id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  order_id: number | null;
  order_number: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categoryLabels: Record<string, string> = {
  order_issue: 'Order Issue',
  product_question: 'Product Question',
  shipping: 'Shipping',
  returns: 'Returns',
  installation: 'Installation',
  billing: 'Billing',
  technical: 'Technical',
  other: 'Other',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
  waiting_customer: { label: 'Awaiting Your Reply', color: 'bg-orange-100 text-orange-800', icon: <HelpCircle className="w-3 h-3" /> },
  waiting_support: { label: 'Awaiting Support', color: 'bg-purple-100 text-purple-800', icon: <Clock className="w-3 h-3" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/v2/support/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(data.data.tickets);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Get help with your orders and products</p>
        </div>
        <Link href="/account/support/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New Ticket
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter(''); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">All Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter('open'); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter('waiting_customer'); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Reply</p>
                <p className="text-2xl font-bold text-orange-600">
                  {tickets.filter(t => t.status === 'waiting_customer').length}
                </p>
              </div>
              <HelpCircle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter('resolved'); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            All
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(key); setPage(1); }}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? 'No tickets match your filter.' : 'You haven\'t created any support tickets yet.'}
              </p>
              <Link href="/account/support/new">
                <Button>Create Your First Ticket</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                return (
                  <Link
                    key={ticket.ticket_id}
                    href={`/account/support/${ticket.ticket_id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                            <Badge className={`text-xs ${status.color}`}>
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
                            </Badge>
                            <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(ticket.updated_at)}
                            </span>
                            <span>{categoryLabels[ticket.category] || ticket.category}</span>
                            {ticket.order_number && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {ticket.order_number}
                              </span>
                            )}
                            <span>{ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 mb-2">Need immediate help?</h3>
          <p className="text-sm text-blue-700 mb-3">
            For urgent matters, you can reach our support team directly.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="tel:1-800-BLINDS" className="text-blue-600 hover:text-blue-800 font-medium">
              Call: 1-800-BLINDS
            </a>
            <a href="mailto:support@blindscommerce.com" className="text-blue-600 hover:text-blue-800 font-medium">
              Email: support@blindscommerce.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
