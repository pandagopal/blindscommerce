'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, Phone, Mail, MapPin, Calendar, Clock, 
  Search, Eye, Star, MessageCircle, History
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_jobs: number;
  last_service: string;
  satisfaction_rating: number;
  notes: string;
  job_history: JobHistory[];
  preferred_time: string;
  communication_preference: 'phone' | 'email' | 'sms';
}

interface JobHistory {
  id: string;
  date: string;
  type: 'installation' | 'repair' | 'measurement';
  description: string;
  status: 'completed' | 'cancelled';
  rating?: number;
  notes?: string;
}

export default function InstallerCustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/customers');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'installer' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/customers');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/installer/customers');
      
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
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
              Customer Directory
            </h1>
            <p className="text-gray-600">Manage customer information and service history</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-purple-100 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      {getRatingStars(customer.satisfaction_rating)}
                      <span className="text-sm text-gray-600 ml-1">
                        ({customer.satisfaction_rating}/5)
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {customer.total_jobs} job{customer.total_jobs !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Last service: {formatDate(customer.last_service)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Prefers: {customer.preferred_time} appointments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="h-4 w-4" />
                  <span>Contact via: {customer.communication_preference}</span>
                </div>
                {customer.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notes:</strong> {customer.notes}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Customer History - {selectedCustomer?.name}</DialogTitle>
                      </DialogHeader>
                      {selectedCustomer && (
                        <div className="space-y-6">
                          {/* Customer Info */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <strong>Phone:</strong> {selectedCustomer.phone}
                            </div>
                            <div>
                              <strong>Email:</strong> {selectedCustomer.email}
                            </div>
                            <div className="col-span-2">
                              <strong>Address:</strong> {selectedCustomer.address}
                            </div>
                          </div>
                          
                          {/* Job History */}
                          <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                              <History className="h-4 w-4" />
                              Service History
                            </h3>
                            <div className="space-y-3">
                              {selectedCustomer.job_history.map((job) => (
                                <div key={job.id} className="flex justify-between items-start p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">{job.type.toUpperCase()}</Badge>
                                      <Badge variant={job.status === 'completed' ? 'success' : 'destructive'}>
                                        {job.status.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="font-medium">{job.description}</div>
                                    <div className="text-sm text-gray-600">
                                      {formatDate(job.date)}
                                    </div>
                                    {job.notes && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        {job.notes}
                                      </div>
                                    )}
                                  </div>
                                  {job.rating && (
                                    <div className="flex items-center gap-1">
                                      {getRatingStars(job.rating)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="flex-1">
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="border-purple-100 shadow-lg">
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Customers Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No customers match your search criteria.' : 'No customers in your directory yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}