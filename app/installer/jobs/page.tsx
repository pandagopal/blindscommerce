'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wrench, MapPin, Calendar, Clock, User, Package, CheckCircle, 
  AlertCircle, Star, FileText, Camera, Plus, Edit, Phone
} from 'lucide-react';

interface InstallerJob {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  job_type: 'installation' | 'repair' | 'measurement' | 'consultation';
  status: 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number;
  products: JobProduct[];
  materials_needed: string[];
  special_instructions: string;
  notes: string;
  completion_notes?: string;
  customer_satisfaction?: number;
  before_photos?: string[];
  after_photos?: string[];
  created_at: string;
  completed_at?: string;
  assigned_installer: string;
}

interface JobProduct {
  id: string;
  name: string;
  quantity: number;
  room: string;
  specifications: string;
}

interface JobStats {
  total_jobs: number;
  completed_jobs: number;
  pending_jobs: number;
  today_jobs: number;
  avg_completion_time: number;
  customer_rating: number;
}

export default function InstallerJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<InstallerJob[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total_jobs: 0,
    completed_jobs: 0,
    pending_jobs: 0,
    today_jobs: 0,
    avg_completion_time: 0,
    customer_rating: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<InstallerJob | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/jobs');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'installer' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/jobs');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/installer/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setStats(data.stats);
      } else {
        // Mock data for demonstration
        const mockJobs: InstallerJob[] = [
          {
            id: 'JOB-001',
            customer_name: 'Sarah Johnson',
            customer_phone: '+1-555-0123',
            address: '123 Maple St, Austin, TX 78701',
            job_type: 'installation',
            status: 'scheduled',
            priority: 'high',
            scheduled_date: '2023-10-25',
            scheduled_time: '09:00',
            estimated_duration: 240,
            products: [
              {
                id: 'PROD-001',
                name: 'Premium Wood Blinds',
                quantity: 4,
                room: 'Living Room',
                specifications: '72" x 48", Mahogany finish'
              },
              {
                id: 'PROD-002',
                name: 'Plantation Shutters',
                quantity: 2,
                room: 'Master Bedroom',
                specifications: '60" x 36", White painted'
              }
            ],
            materials_needed: ['Mounting brackets', 'Wood screws', 'Wall anchors', 'Level'],
            special_instructions: 'Customer prefers morning installation. Use dust sheets.',
            notes: 'High-end installation. Take extra care with finishing.',
            created_at: '2023-10-20',
            assigned_installer: 'Mike Rodriguez'
          },
          {
            id: 'JOB-002',
            customer_name: 'David Thompson',
            customer_phone: '+1-555-0456',
            address: '456 Oak Ave, Dallas, TX 75201',
            job_type: 'repair',
            status: 'in_progress',
            priority: 'medium',
            scheduled_date: '2023-10-24',
            scheduled_time: '14:00',
            estimated_duration: 120,
            products: [
              {
                id: 'PROD-003',
                name: 'Cellular Shades',
                quantity: 3,
                room: 'Office',
                specifications: 'Cord repair and cleaning'
              }
            ],
            materials_needed: ['Replacement cord', 'Cord locks', 'Cleaning supplies'],
            special_instructions: 'Commercial building. Check in with security.',
            notes: 'Customer reported cord mechanism failure.',
            created_at: '2023-10-22',
            assigned_installer: 'Lisa Martinez'
          },
          {
            id: 'JOB-003',
            customer_name: 'Jennifer Martinez',
            customer_phone: '+1-555-0789',
            address: '789 Pine Rd, Houston, TX 77001',
            job_type: 'measurement',
            status: 'completed',
            priority: 'low',
            scheduled_date: '2023-10-23',
            scheduled_time: '10:30',
            estimated_duration: 90,
            products: [
              {
                id: 'PROD-004',
                name: 'Roller Shades',
                quantity: 5,
                room: 'Multiple Rooms',
                specifications: 'Measure for quote'
              }
            ],
            materials_needed: ['Measuring tape', 'Notebook', 'Camera'],
            special_instructions: 'Potential large order. Provide detailed measurements.',
            notes: 'Customer interested in motorized options.',
            completion_notes: 'All measurements taken. Quote to follow.',
            customer_satisfaction: 5,
            created_at: '2023-10-21',
            completed_at: '2023-10-23',
            assigned_installer: 'Carlos Santos'
          }
        ];

        setJobs(mockJobs);
        setStats({
          total_jobs: 156,
          completed_jobs: 142,
          pending_jobs: 14,
          today_jobs: 3,
          avg_completion_time: 185,
          customer_rating: 4.8
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: InstallerJob['status'], notes?: string) => {
    try {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completion_notes = notes;
      }

      const res = await fetch(`/api/installer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        fetchJobs();
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: 'default',
      scheduled: 'secondary',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'destructive'
    } as const;

    const icons = {
      assigned: Clock,
      scheduled: Calendar,
      in_progress: Wrench,
      completed: CheckCircle,
      cancelled: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'warning',
      urgent: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'default'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const variants = {
      installation: 'default',
      repair: 'warning',
      measurement: 'secondary',
      consultation: 'default'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const filteredJobs = (jobs || []).filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (filterType !== 'all' && job.job_type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
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
              Installation Jobs
            </h1>
            <p className="text-gray-600">Manage your installation and service jobs</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
                <Wrench className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_jobs || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completed_jobs || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending_jobs || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Jobs</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.today_jobs || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats?.avg_completion_time || 0)}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.customer_rating || 0}/5</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-purple-100 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="measurement">Measurement</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card className="border-purple-100 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Jobs Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">{job.id}</h4>
                      {getStatusBadge(job.status)}
                      {getPriorityBadge(job.priority)}
                      {getJobTypeBadge(job.job_type)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{job.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{job.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(job.scheduled_date)} at {formatTime(job.scheduled_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Est. {formatDuration(job.estimated_duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{job.products?.length || 0} items</span>
                      </div>
                    </div>
                    {job.special_instructions && (
                      <div className="text-sm text-blue-600">
                        Special: {job.special_instructions}
                      </div>
                    )}
                    {job.completion_notes && (
                      <div className="text-sm text-green-600">
                        Completed: {job.completion_notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right space-y-2 ml-6">
                    {job.customer_satisfaction && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium">{job.customer_satisfaction}/5</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJob(job)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Job Details - {selectedJob?.id}</DialogTitle>
                          </DialogHeader>
                          {selectedJob && (
                            <div className="space-y-6">
                              {/* Job Info */}
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h3 className="font-medium mb-2">Customer Information</h3>
                                  <div className="space-y-1 text-sm">
                                    <div>Name: {selectedJob.customer_name}</div>
                                    <div>Phone: {selectedJob.customer_phone}</div>
                                    <div>Address: {selectedJob.address}</div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-medium mb-2">Job Information</h3>
                                  <div className="space-y-1 text-sm">
                                    <div>Type: {selectedJob.job_type}</div>
                                    <div>Scheduled: {formatDate(selectedJob.scheduled_date)} at {formatTime(selectedJob.scheduled_time)}</div>
                                    <div>Duration: {formatDuration(selectedJob.estimated_duration)}</div>
                                    <div>Installer: {selectedJob.assigned_installer}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Products */}
                              <div>
                                <h3 className="font-medium mb-2">Products</h3>
                                <div className="space-y-2">
                                  {selectedJob.products?.map((product) => (
                                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-gray-600">
                                          {product.room} • Qty: {product.quantity}
                                        </div>
                                        <div className="text-sm text-gray-600">{product.specifications}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Materials */}
                              <div>
                                <h3 className="font-medium mb-2">Materials Needed</h3>
                                <div className="flex flex-wrap gap-2">
                                  {selectedJob.materials_needed?.map((material, index) => (
                                    <Badge key={index} variant="outline">{material}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Status Update */}
                              {selectedJob.status !== 'completed' && selectedJob.status !== 'cancelled' && (
                                <div>
                                  <h3 className="font-medium mb-2">Update Job Status</h3>
                                  <div className="flex gap-2">
                                    {selectedJob.status === 'assigned' && (
                                      <Button onClick={() => handleUpdateJobStatus(selectedJob.id, 'scheduled')}>
                                        Mark as Scheduled
                                      </Button>
                                    )}
                                    {(selectedJob.status === 'scheduled' || selectedJob.status === 'assigned') && (
                                      <Button onClick={() => handleUpdateJobStatus(selectedJob.id, 'in_progress')}>
                                        Start Job
                                      </Button>
                                    )}
                                    {selectedJob.status === 'in_progress' && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button>Complete Job</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Complete Job</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <Textarea
                                              placeholder="Add completion notes..."
                                              onChange={(e) => {
                                                const notes = e.target.value;
                                                document.getElementById('completion-notes')?.setAttribute('data-notes', notes);
                                              }}
                                            />
                                            <Button
                                              onClick={() => {
                                                const notes = document.getElementById('completion-notes')?.getAttribute('data-notes') || '';
                                                handleUpdateJobStatus(selectedJob.id, 'completed', notes);
                                              }}
                                              className="w-full"
                                              id="completion-notes"
                                            >
                                              Mark as Completed
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <Select
                          value={job.status}
                          onValueChange={(value: InstallerJob['status']) => handleUpdateJobStatus(job.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}