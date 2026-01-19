'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, DollarSign, TrendingUp, Target, CheckCircle, Edit, Search } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'website' | 'referral' | 'advertising' | 'social' | 'cold_call';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high';
  estimated_value: number;
  product_interest: string;
  notes: string;
  created_at: string;
  last_contact: string;
  next_follow_up: string;
  assigned_to: string;
}

interface LeadStats {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  conversion_rate: number;
  avg_deal_value: number;
  pipeline_value: number;
}

export default function SalesLeadsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total_leads: 0, new_leads: 0, qualified_leads: 0,
    conversion_rate: 0, avg_deal_value: 0, pipeline_value: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', email: '', phone: '', source: 'website',
    status: 'new', priority: 'medium', estimated_value: 0,
    product_interest: '', notes: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) { router.push('/login?redirect=/sales/leads'); return; }
        const result = await res.json();
        const data = result.data || result;
        if (data.user.role !== 'sales' && data.user.role !== 'admin') { router.push('/'); return; }
        setUser(data.user);
      } catch (error) {
        router.push('/login?redirect=/sales/leads');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => { if (user) fetchLeads(); }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/sales/leads');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setLeads(result.data.leads || []);
          setStats(result.data.stats || stats);
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      const res = await fetch('/api/v2/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        fetchLeads();
        setNewLead({ name: '', email: '', phone: '', source: 'website', status: 'new', priority: 'medium', estimated_value: 0, product_interest: '', notes: '' });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/v2/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) { fetchLeads(); setEditingLead(null); }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-emerald-100 text-emerald-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (searchTerm && !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !lead.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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
          <h1 className="text-xl font-bold text-gray-900">Sales Leads</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Add Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
                <Input placeholder="Email" type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                <Input placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                <Select value={newLead.source} onValueChange={(value: Lead['source']) => setNewLead({ ...newLead, source: value })}>
                  <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="advertising">Advertising</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newLead.priority} onValueChange={(value: Lead['priority']) => setNewLead({ ...newLead, priority: value })}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Est. Value" type="number" value={newLead.estimated_value} onChange={(e) => setNewLead({ ...newLead, estimated_value: parseFloat(e.target.value) || 0 })} />
                <Input placeholder="Product Interest" className="col-span-2" value={newLead.product_interest} onChange={(e) => setNewLead({ ...newLead, product_interest: e.target.value })} />
                <Textarea placeholder="Notes" className="col-span-2" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} />
              </div>
              <Button onClick={handleCreateLead} className="mt-3">Create Lead</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold">{stats.total_leads}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">New</p>
                <p className="text-lg font-bold">{stats.new_leads}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-red" />
              <div>
                <p className="text-xs text-gray-500">Qualified</p>
                <p className="text-lg font-bold">{stats.qualified_leads}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Conversion</p>
                <p className="text-lg font-bold">{stats.conversion_rate}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Avg Deal</p>
                <p className="text-lg font-bold">{formatCurrency(stats.avg_deal_value)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-red" />
              <div>
                <p className="text-xs text-gray-500">Pipeline</p>
                <p className="text-lg font-bold">{formatCurrency(stats.pipeline_value)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed_won">Closed Won</SelectItem>
              <SelectItem value="closed_lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Name</th>
                  <th className="text-left p-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left p-3 font-medium text-gray-600">Source</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Priority</th>
                  <th className="text-left p-3 font-medium text-gray-600">Interest</th>
                  <th className="text-right p-3 font-medium text-gray-600">Value</th>
                  <th className="text-left p-3 font-medium text-gray-600">Follow-up</th>
                  <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="p-3">
                      <div className="text-gray-900">{lead.email}</div>
                      <div className="text-xs text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="p-3 text-gray-600 capitalize">{lead.source.replace('_', ' ')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 max-w-[150px] truncate">{lead.product_interest || '-'}</td>
                    <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(lead.estimated_value)}</td>
                    <td className="p-3 text-gray-600">{formatDate(lead.next_follow_up)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingLead(lead)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Update Lead</DialogTitle></DialogHeader>
                            {editingLead && (
                              <div className="space-y-3">
                                <Select value={editingLead.status} onValueChange={(value: Lead['status']) => setEditingLead({ ...editingLead, status: value })}>
                                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="proposal">Proposal</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="closed_won">Closed Won</SelectItem>
                                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea placeholder="Notes" value={editingLead.notes || ''} onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })} />
                                <Button onClick={() => handleUpdateLead(editingLead.id, editingLead)}>Update</Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Select value={lead.status} onValueChange={(value: Lead['status']) => handleUpdateLead(lead.id, { status: value })}>
                          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed_won">Won</SelectItem>
                            <SelectItem value="closed_lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">No leads found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
