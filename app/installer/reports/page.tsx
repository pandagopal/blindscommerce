'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Calendar, TrendingUp, Clock, Star, 
  DollarSign, Users, Package, BarChart3, PieChart
} from 'lucide-react';

interface ReportData {
  performance: {
    total_jobs: number;
    completed_jobs: number;
    avg_rating: number;
    avg_completion_time: number;
    on_time_percentage: number;
    repeat_customers: number;
  };
  revenue: {
    total_revenue: number;
    avg_job_value: number;
    monthly_revenue: number[];
    revenue_by_type: { [key: string]: number };
  };
  productivity: {
    jobs_per_day: number;
    utilization_rate: number;
    travel_time_percentage: number;
    most_productive_day: string;
  };
  customer_satisfaction: {
    avg_rating: number;
    rating_distribution: { [key: number]: number };
    feedback_summary: string[];
  };
}

export default function InstallerReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/reports');
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
        router.push('/login?redirect=/installer/reports');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installer/reports?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to fetch report data');
        setReportData(null);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const exportReport = async (type: string) => {
    try {
      // Mock export functionality
      const filename = `installer-report-${type}-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      alert(`Exporting ${filename}...`);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
              Performance Reports
            </h1>
            <p className="text-gray-600">Track your performance metrics and analytics</p>
          </div>
          
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => exportReport('complete')}
              className="bg-primary-red hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{reportData?.performance.completed_jobs || 0}</div>
              <div className="text-sm text-gray-600">Jobs Completed</div>
              <div className="text-xs text-green-600 mt-1">
                {reportData?.performance.completed_jobs && reportData?.performance.total_jobs
                  ? `${Math.round((reportData.performance.completed_jobs / reportData.performance.total_jobs) * 100)}% completion rate`
                  : ''
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">{reportData?.performance.avg_rating || 0}/5</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
              <div className="text-xs text-green-600 mt-1">
                {reportData?.customer_satisfaction.rating_distribution[5] || 0} five-star reviews
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(reportData?.revenue.total_revenue || 0)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-xs text-green-600 mt-1">
                {formatCurrency(reportData?.revenue.avg_job_value || 0)} avg per job
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{reportData?.performance.on_time_percentage || 0}%</div>
              <div className="text-sm text-gray-600">On-Time Rate</div>
              <div className="text-xs text-gray-600 mt-1">
                {formatDuration(reportData?.performance.avg_completion_time || 0)} avg time
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-purple-100">
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="productivity">
              <BarChart3 className="h-4 w-4 mr-2" />
              Productivity
            </TabsTrigger>
            <TabsTrigger value="satisfaction">
              <Star className="h-4 w-4 mr-2" />
              Customer Satisfaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Job Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Total Jobs</span>
                      <span className="font-bold">{reportData?.performance.total_jobs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Completed Jobs</span>
                      <span className="font-bold text-green-600">{reportData?.performance.completed_jobs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Avg Completion Time</span>
                      <span className="font-bold">{formatDuration(reportData?.performance.avg_completion_time || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">On-Time Percentage</span>
                      <span className="font-bold text-green-600">{reportData?.performance.on_time_percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Repeat Customers</span>
                      <span className="font-bold text-blue-600">{reportData?.performance.repeat_customers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Performance trend chart</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="font-bold text-green-600">{formatCurrency(reportData?.revenue.total_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Avg Job Value</span>
                      <span className="font-bold">{formatCurrency(reportData?.revenue.avg_job_value || 0)}</span>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Revenue by Job Type</h4>
                      {reportData?.revenue.revenue_by_type && Object.entries(reportData.revenue.revenue_by_type).map(([type, amount]) => (
                        <div key={type} className="flex justify-between items-center p-2 mb-2">
                          <span className="text-sm capitalize">{type}</span>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Revenue trend chart</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="productivity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Productivity Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Jobs per Day</span>
                      <span className="font-bold">{reportData?.productivity.jobs_per_day || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Utilization Rate</span>
                      <span className="font-bold text-green-600">{reportData?.productivity.utilization_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Travel Time</span>
                      <span className="font-bold">{reportData?.productivity.travel_time_percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Most Productive Day</span>
                      <span className="font-bold text-blue-600">{reportData?.productivity.most_productive_day || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Productivity Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Productivity analysis chart</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Customer Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {reportData?.customer_satisfaction.avg_rating || 0}/5
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Rating Distribution</h4>
                      {reportData?.customer_satisfaction.rating_distribution && 
                        Object.entries(reportData.customer_satisfaction.rating_distribution)
                          .reverse()
                          .map(([rating, count]) => (
                          <div key={rating} className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{rating} stars</span>
                              <div className="flex">
                                {Array.from({ length: parseInt(rating) }, (_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Customer Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Common Positive Feedback</h4>
                    {reportData?.customer_satisfaction.feedback_summary.map((feedback, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">{feedback}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}