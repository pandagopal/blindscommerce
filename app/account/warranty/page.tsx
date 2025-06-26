'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Calendar, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

interface Warranty {
  warranty_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  serial_number: string;
  purchase_date: string;
  registration_date: string;
  warranty_type: string;
  warranty_duration_months: number;
  warranty_status: 'active' | 'expired';
  expiry_date: string;
}

interface WarrantyClaim {
  claim_id: number;
  warranty_id: number;
  claim_type: string;
  issue_description: string;
  claim_date: string;
  status: string;
  resolution_notes?: string;
  resolved_date?: string;
  product_name: string;
  serial_number: string;
}

export default function WarrantyPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('warranties');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/account/warranty');
          return;
        }
        const result = await res.json();
        const data = result.data || result;setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/account/warranty');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchWarranties();
      fetchClaims();
    }
  }, [user]);

  const fetchWarranties = async () => {
    try {
      const res = await fetch(`/api/warranty/register?customer_id=${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setWarranties(data.warranties || []);
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await fetch(`/api/warranty/claims?customer_id=${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warranty information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Warranty & Claims
          </h1>
          <p className="text-gray-600">Manage your product warranties and submit claims</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/account/warranty/register')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register Product
            </Button>
            <Button
              onClick={() => router.push('/account/warranty/lookup')}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Warranty Lookup
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-purple-100">
            <TabsTrigger value="warranties">
              My Warranties ({warranties.length})
            </TabsTrigger>
            <TabsTrigger value="claims">
              Claims History ({claims.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="warranties">
            <div className="grid gap-6">
              {warranties.length === 0 ? (
                <Card className="border-purple-100 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Warranties Registered</h3>
                    <p className="text-gray-600 mb-6">
                      Register your products to activate warranty protection and access support
                    </p>
                    <Button
                      onClick={() => router.push('/account/warranty/register')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Register Your First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                warranties.map((warranty) => (
                  <Card key={warranty.warranty_id} className="border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {warranty.product_name}
                          </CardTitle>
                          <p className="text-gray-600">Serial: {warranty.serial_number}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(warranty.warranty_status)}
                          {getStatusBadge(warranty.warranty_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Purchase Date</p>
                          <p className="font-medium">{formatDate(warranty.purchase_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Warranty Type</p>
                          <p className="font-medium capitalize">{warranty.warranty_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expires</p>
                          <p className="font-medium">{formatDate(warranty.expiry_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${warranty.product_slug}`}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          View Product
                        </Link>
                        {warranty.warranty_status === 'active' && (
                          <Button
                            onClick={() => router.push(`/account/warranty/claim?warranty_id=${warranty.warranty_id}`)}
                            variant="outline"
                            size="sm"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            Submit Claim
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="claims">
            <div className="grid gap-6">
              {claims.length === 0 ? (
                <Card className="border-purple-100 shadow-lg">
                  <CardContent className="text-center py-12">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Claims Submitted</h3>
                    <p className="text-gray-600">
                      Your warranty claim history will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                claims.map((claim) => (
                  <Card key={claim.claim_id} className="border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {claim.product_name} - {claim.claim_type}
                          </CardTitle>
                          <p className="text-gray-600">Claim #{claim.claim_id} • {claim.serial_number}</p>
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Issue Description</p>
                        <p className="text-gray-800">{claim.issue_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">{formatDate(claim.claim_date)}</p>
                        </div>
                        {claim.resolved_date && (
                          <div>
                            <p className="text-sm text-gray-500">Resolved</p>
                            <p className="font-medium">{formatDate(claim.resolved_date)}</p>
                          </div>
                        )}
                      </div>

                      {claim.resolution_notes && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Resolution Notes</p>
                          <p className="text-gray-800">{claim.resolution_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}