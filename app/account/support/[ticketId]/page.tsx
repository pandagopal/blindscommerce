'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  User,
  Package,
  Calendar,
  MessageSquare,
  XCircle
} from 'lucide-react';

interface Message {
  message_id: number;
  message: string;
  created_at: string;
  first_name: string;
  last_name: string;
  role: string;
  is_own_message: boolean;
}

interface Ticket {
  ticket_id: number;
  ticket_number: string;
  user_id: number;
  order_id: number | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  order_number: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
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
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-red-100 text-red-800', icon: <Clock className="w-4 h-4" /> },
  waiting_customer: { label: 'Awaiting Your Reply', color: 'bg-orange-100 text-orange-800', icon: <HelpCircle className="w-4 h-4" /> },
  waiting_support: { label: 'Awaiting Support', color: 'bg-red-100 text-red-800', icon: <Clock className="w-4 h-4" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" /> },
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketId = params.ticketId as string;
  const isNewTicket = searchParams.get('created') === 'true';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(isNewTicket);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/support/tickets/${ticketId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Ticket not found');
        } else {
          setError('Failed to load ticket');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTicket(data.data.ticket);
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/v2/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        await fetchTicketDetails(); // Refresh to get new message
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    setClosing(true);
    try {
      const response = await fetch(`/api/v2/support/tickets/${ticketId}/close`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await fetchTicketDetails();
      } else {
        setError(data.error || 'Failed to close ticket');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      setError('Failed to close ticket');
    } finally {
      setClosing(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <Link href="/account/support">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
            <Link href="/account/support">
              <Button>Return to Tickets</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) return null;

  const status = statusConfig[ticket.status] || statusConfig.open;
  const isTicketActive = !['closed', 'resolved'].includes(ticket.status);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Ticket Created Successfully!</h4>
            <p className="text-sm text-green-700">
              Your ticket #{ticket.ticket_number} has been submitted. Our support team will respond soon.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/account/support">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500 font-mono">{ticket.ticket_number}</span>
              <Badge className={status.color}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              <Badge className={priorityColors[ticket.priority]}>
                {ticket.priority}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
        </div>
        {isTicketActive && (
          <Button variant="outline" onClick={handleCloseTicket} disabled={closing}>
            {closing ? (
              <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Close Ticket
              </>
            )}
          </Button>
        )}
      </div>

      {/* Ticket Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium">{categoryLabels[ticket.category] || ticket.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium">{formatDate(ticket.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {ticket.order_number && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Related Order</p>
                  <Link
                    href={`/account/orders/${ticket.order_id}`}
                    className="font-medium text-red-600 hover:text-red-700"
                  >
                    {ticket.order_number}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Messages */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversation ({messages.length} message{messages.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${msg.is_own_message ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.is_own_message
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        msg.is_own_message
                          ? 'bg-red-500 text-white'
                          : 'bg-red-400 text-white'
                      }`}
                    >
                      {msg.first_name?.charAt(0) || 'S'}
                    </div>
                    <span className="text-sm font-medium">
                      {msg.is_own_message ? 'You' : `${msg.first_name || 'Support'} (${msg.role})`}
                    </span>
                    <span className={`text-xs ${msg.is_own_message ? 'text-red-200' : 'text-gray-500'}`}>
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          {isTicketActive ? (
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage}>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="min-h-[100px] mb-3"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Press Enter or click Send to reply
                  </p>
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t p-4 bg-gray-50 text-center">
              <p className="text-gray-600">
                This ticket is {ticket.status}.
                <Link href="/account/support/new" className="text-red-600 hover:text-red-700 ml-1">
                  Create a new ticket
                </Link> if you need further assistance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
