'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Target, 
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';
import { CountryCode } from '@/lib/utils/phoneFormatter';

interface SalesPerson {
  salesStaffId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneCountry?: CountryCode;
  territory?: string;
  commissionRate: number;
  targetSales: number;
  totalSales: number;
  isActive: boolean;
  startDate: string;
}

export default function VendorSalesTeamPage() {
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    phoneCountry: 'US' as CountryCode,
    territory: '',
    commissionRate: 5.0,
    targetSales: 50000,
    isActive: true
  });

  useEffect(() => {
    fetchSalesTeam();
  }, []);

  const fetchSalesTeam = async () => {
    try {
      const res = await fetch('/api/v2/vendors/sales-team');
      if (!res.ok) throw new Error('Failed to fetch sales team');
      const data = await res.json();
      setSalesTeam(data.salesTeam || []);
    } catch (error) {
      console.error('Error fetching sales team:', error);
      setMessage({ type: 'error', text: 'Failed to load sales team' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const endpoint = editingId 
        ? `/api/v2/vendors/sales-team/${editingId}`
        : '/api/v2/vendors/sales-team';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save sales person');
      }

      setMessage({ 
        type: 'success', 
        text: editingId ? 'Sales person updated successfully!' : 'Sales person added successfully!' 
      });
      
      resetForm();
      fetchSalesTeam();
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving sales person:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save sales person' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (person: SalesPerson) => {
    setFormData({
      email: person.email,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone || '',
      territory: person.territory || '',
      commissionRate: person.commissionRate,
      targetSales: person.targetSales,
      isActive: person.isActive
    });
    setEditingId(person.salesStaffId);
    setShowAddForm(true);
  };

  const handleToggleActive = async (salesStaffId: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/v2/vendors/sales-team/${salesStaffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      fetchSalesTeam();
      setMessage({ 
        type: 'success', 
        text: `Sales person ${isActive ? 'activated' : 'deactivated'} successfully!` 
      });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleDelete = async (salesStaffId: number) => {
    if (!confirm('Are you sure you want to remove this sales person from your team?')) return;

    try {
      const res = await fetch(`/api/v2/vendors/sales-team/${salesStaffId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete sales person');
      
      fetchSalesTeam();
      setMessage({ type: 'success', text: 'Sales person removed successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting sales person:', error);
      setMessage({ type: 'error', text: 'Failed to remove sales person' });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      phoneCountry: 'US' as CountryCode,
      territory: '',
      commissionRate: 5.0,
      targetSales: 50000,
      isActive: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Team Management</h1>
          <p className="text-gray-600">Manage your sales representatives and their performance</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-primary-red hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Sales Person
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Sales Person' : 'Add New Sales Person'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={editingId !== null}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(value, country) => setFormData({ 
                      ...formData, 
                      phone: value,
                      phoneCountry: country || formData.phoneCountry
                    })}
                    onCountryChange={(country) => setFormData({ 
                      ...formData, 
                      phoneCountry: country 
                    })}
                    country={formData.phoneCountry}
                    showCountrySelector={true}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="territory">Territory</Label>
                  <Input
                    id="territory"
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    placeholder="e.g., North Region, Downtown"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="targetSales">Target Sales ($)</Label>
                  <Input
                    id="targetSales"
                    type="number"
                    min="0"
                    value={formData.targetSales}
                    onChange={(e) => setFormData({ ...formData, targetSales: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')} Sales Person
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sales Team List */}
      <div className="grid gap-4">
        {salesTeam.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Team Members</h3>
              <p className="text-gray-600 mb-4">Add your first sales representative to get started.</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Sales Person
              </Button>
            </CardContent>
          </Card>
        ) : (
          salesTeam.map((person) => (
            <Card key={person.salesStaffId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-red" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {person.firstName} {person.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {person.email}
                        </span>
                        {person.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {person.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1 text-blue-600" />
                          Target: ${person.targetSales.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                          Sales: ${person.totalSales.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-primary-red" />
                          {person.commissionRate}%
                        </span>
                      </div>
                      {person.territory && (
                        <p className="text-sm text-gray-600 mt-1">Territory: {person.territory}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={person.isActive}
                        onCheckedChange={(checked) => handleToggleActive(person.salesStaffId, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(person)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(person.salesStaffId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}