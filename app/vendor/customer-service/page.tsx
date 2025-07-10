'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CustomerMessage {
  message_id: number;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  order_id?: string;
  category: string;
}

interface MessageThread {
  thread_id: number;
  messages: {
    sender: 'customer' | 'vendor';
    message: string;
    timestamp: string;
  }[];
}

export default function CustomerServicePage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/v2/vendors/customer-messages', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  const stats = {
    newMessages: messages.filter(m => m.status === 'new').length,
    inProgress: messages.filter(m => m.status === 'in_progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
    avgResponseTime: '2.5 hours',
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesSearch = !searchQuery || 
      message.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    // Update message status
    setMessages(messages.map(m => 
      m.message_id === selectedMessage.message_id
        ? { ...m, status: 'in_progress' as const }
        : m
    ));
    
    setReplyText('');
    setShowReplyDialog(false);
    alert('Reply sent successfully!');
  };

  const handleMarkResolved = (messageId: number) => {
    setMessages(messages.map(m => 
      m.message_id === messageId
        ? { ...m, status: 'resolved' as const }
        : m
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Service</h1>
        <p className="text-gray-600 mt-2">
          Manage customer inquiries and support requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newMessages}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Response Templates</CardTitle>
          <CardDescription>
            Use these templates for common customer inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Schedule Installation Call
            </Button>
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Product Care Guide
            </Button>
            <Button variant="outline" className="justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Request More Information
            </Button>
            <Button variant="outline" className="justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Order Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Customer Messages</CardTitle>
              <CardDescription>
                Respond to customer inquiries and support requests
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No messages found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No messages match your current filters.' 
                  : 'You have no customer messages at this time.'}
              </p>
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.message_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.customer_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{message.customer_name}</p>
                        <p className="text-xs text-gray-500">{message.customer_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{message.subject}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[300px]">
                      {message.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{message.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(message.priority) as any}>
                      {message.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(message.status)}
                      <span className="capitalize">{message.status.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(message.created_at).toRelativeString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowReplyDialog(true);
                        }}
                      >
                        Reply
                      </Button>
                      {message.status !== 'resolved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkResolved(message.message_id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Customer</DialogTitle>
            <DialogDescription>
              Send a response to the customer's inquiry
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{selectedMessage.customer_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium mb-1">{selectedMessage.subject}</p>
                <p className="text-sm">{selectedMessage.message}</p>
                {selectedMessage.order_id && (
                  <p className="text-xs text-gray-500 mt-2">
                    Order: {selectedMessage.order_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReplyDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
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

// Add this extension to make the relative time work
declare global {
  interface Date {
    toRelativeString(): string;
  }
}

Date.prototype.toRelativeString = function() {
  const now = new Date();
  const diff = now.getTime() - this.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};