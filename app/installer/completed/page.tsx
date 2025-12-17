'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, Calendar, Clock, User, MapPin, Star, 
  Camera, FileText, Download, Search, Filter
} from 'lucide-react';

interface CompletedJob {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  type: 'installation' | 'repair' | 'measurement';
  completedDate: string;
  duration: number;
  products: string[];
  satisfaction_rating: number;
  notes: string;
  before_photos: string[];
  after_photos: string[];
  invoice_amount: number;
  warranty_period: number;
}

export default function InstallerCompletedJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');
  const [selectedJob, setSelectedJob] = useState<CompletedJob | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/completed');
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
        router.push('/login?redirect=/installer/completed');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchCompletedJobs();
    }
  }, [user, filterPeriod]);

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/installer/completed-jobs');
      
      if (res.ok) {
        const data = await res.json();
        setCompletedJobs(data.data || []);
      } else {
        setCompletedJobs([]);
      }
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      setCompletedJobs([]);
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const getTypeBadge = (type: string) => {
    const variants = {
      installation: 'default',
      repair: 'warning',
      measurement: 'secondary'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const filteredJobs = completedJobs.filter(job => {
    if (filterType !== 'all' && job.type !== filterType) return false;
    if (searchTerm && !job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Filter by period
    const jobDate = new Date(job.completedDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (filterPeriod) {
      case '7d':
        return diffDays <= 7;
      case '30d':
        return diffDays <= 30;
      case '90d':
        return diffDays <= 90;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              Completed Jobs
            </h1>
            <p className="text-gray-600">Review your completed installations and service history</p>
          </div>
          
          <Button 
            variant="outline"
            className="border-red-200 text-primary-red hover:bg-red-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-red-100 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="measurement">Measurement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{filteredJobs.length}</div>
              <div className="text-sm text-gray-600">Completed Jobs</div>
            </CardContent>
          </Card>
          
          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">
                {filteredJobs.length > 0 
                  ? (filteredJobs.reduce((sum, job) => sum + job.satisfaction_rating, 0) / filteredJobs.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </CardContent>
          </Card>
          
          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">
                {filteredJobs.length > 0 
                  ? formatDuration(filteredJobs.reduce((sum, job) => sum + job.duration, 0) / filteredJobs.length)
                  : '0m'
                }
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </CardContent>
          </Card>
          
          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredJobs.reduce((sum, job) => sum + job.invoice_amount, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="border-red-100 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.customerName}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {getTypeBadge(job.type)}
                      <Badge variant="success">COMPLETED</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRatingStars(job.satisfaction_rating)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(job.completedDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(job.duration)}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{job.address}</span>
                </div>
                <div className="text-sm">
                  <strong>Products:</strong>
                  <ul className="mt-1 space-y-1">
                    {job.products.map((product, index) => (
                      <li key={index} className="text-gray-600">• {product}</li>
                    ))}
                  </ul>
                </div>
                {job.invoice_amount > 0 && (
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(job.invoice_amount)}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedJob(job)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Job Details - {selectedJob?.id}</DialogTitle>
                      </DialogHeader>
                      {selectedJob && (
                        <div className="space-y-6">
                          {/* Job Summary */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div><strong>Customer:</strong> {selectedJob.customerName}</div>
                            <div><strong>Phone:</strong> {selectedJob.customerPhone}</div>
                            <div><strong>Date:</strong> {formatDate(selectedJob.completedDate)}</div>
                            <div><strong>Duration:</strong> {formatDuration(selectedJob.duration)}</div>
                            <div className="col-span-2"><strong>Address:</strong> {selectedJob.address}</div>
                          </div>
                          
                          {/* Products */}
                          <div>
                            <h3 className="font-medium mb-2">Products & Services</h3>
                            <ul className="space-y-1">
                              {selectedJob.products.map((product, index) => (
                                <li key={index} className="text-gray-600">• {product}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Notes */}
                          {selectedJob.notes && (
                            <div>
                              <h3 className="font-medium mb-2">Notes</h3>
                              <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedJob.notes}</p>
                            </div>
                          )}
                          
                          {/* Photos */}
                          {(selectedJob.before_photos.length > 0 || selectedJob.after_photos.length > 0) && (
                            <div>
                              <h3 className="font-medium mb-2 flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Photos
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedJob.before_photos.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Before</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {selectedJob.before_photos.map((photo, index) => (
                                        <div key={index} className="h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          {photo}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedJob.after_photos.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">After</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {selectedJob.after_photos.map((photo, index) => (
                                        <div key={index} className="h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          {photo}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Warranty */}
                          {selectedJob.warranty_period > 0 && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <h3 className="font-medium text-blue-800">Warranty Information</h3>
                              <p className="text-blue-600 text-sm">
                                {selectedJob.warranty_period} months warranty from completion date
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <Card className="border-red-100 shadow-lg">
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Completed Jobs</h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'No jobs match your current filters.' 
                  : 'You haven\'t completed any jobs yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}