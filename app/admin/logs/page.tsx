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
  FileText, Download, Search, Filter, RefreshCw, AlertTriangle, 
  Info, CheckCircle, XCircle, Eye, Trash2, Calendar, AlertCircle
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  stack_trace?: string;
  request_id?: string;
}

interface LogStats {
  total_entries: number;
  errors_today: number;
  warnings_today: number;
  most_common_error: string;
  last_error_time: string;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/admin/logs');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/admin/logs');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, filterLevel, filterCategory, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/admin/logs', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch logs:', response.status, response.statusText);
        // Don't throw error, just set empty data
        setLogs([]);
        setStats({
          total_entries: 0,
          errors_today: 0,
          warnings_today: 0,
          most_common_error: 'No logs available',
          last_error_time: ''
        });
        return;
      }

      const data = await response.json();
      
      // Handle V2 API response structure
      if (data.success === false) {
        console.error('API returned error:', data.error);
        setLogs([]);
        setStats({
          total_entries: 0,
          errors_today: 0,
          warnings_today: 0,
          most_common_error: data.error || 'System logs table not found',
          last_error_time: ''
        });
        return;
      }
      
      // Extract data from response
      const responseData = data.data || data;
      setLogs(responseData.logs || []);
      setStats(responseData.stats || {
        total_entries: 0,
        errors_today: 0,
        warnings_today: 0,
        most_common_error: '',
        last_error_time: ''
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Ensure empty state on error
      setLogs([]);
      setStats({
        total_entries: 0,
        errors_today: 0,
        warnings_today: 0,
        most_common_error: '',
        last_error_time: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await fetch(`/api/v2/admin/logs/export?dateRange=${dateRange}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear old logs? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/v2/admin/logs/clear', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          fetchLogs(); // Refresh data
        } else {
          throw new Error('Failed to clear logs');
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      info: 'default',
      warning: 'warning',
      error: 'destructive',
      debug: 'secondary'
    } as const;

    const icons = {
      info: Info,
      warning: AlertTriangle,
      error: XCircle,
      debug: FileText
    };

    const Icon = icons[level as keyof typeof icons] || Info;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'default'} className="gap-1">
        <Icon className="h-3 w-3" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {category}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system logs...</p>
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
              System Logs
            </h1>
            <p className="text-gray-600">Monitor system activities and troubleshoot issues</p>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={exportLogs}
              variant="outline"
              className="border-red-200 text-primary-red hover:bg-red-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={fetchLogs}
              variant="outline"
              className="border-red-200 text-primary-red hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={clearLogs}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{stats?.total_entries.toLocaleString() || 0}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600">{stats?.errors_today || 0}</div>
              <div className="text-sm text-gray-600">Errors Today</div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{stats?.warnings_today || 0}</div>
              <div className="text-sm text-gray-600">Warnings Today</div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto text-primary-red mb-2" />
              <div className="text-lg font-bold">
                {stats?.last_error_time ? formatTimestamp(stats.last_error_time).split(',')[1] : 'None'}
              </div>
              <div className="text-sm text-gray-600">Last Error</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-red-100 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="border-red-100 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              Log Entries ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No logs available</p>
                  <p className="text-sm text-gray-500">
                    {stats.most_common_error === 'System logs table not found' 
                      ? 'The system_logs table needs to be created in the database.' 
                      : 'Try adjusting your filters or check back later.'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {getLevelBadge(log.level)}
                      {getCategoryBadge(log.category)}
                      <span className="text-sm text-gray-600">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div className="font-medium">{log.message}</div>
                    <div className="text-sm text-gray-600">
                      IP: {log.ip_address}
                      {log.user_id && ` • User: ${log.user_id}`}
                      {log.request_id && ` • Request: ${log.request_id}`}
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          Log Details - {selectedLog?.id}
                          {selectedLog && getLevelBadge(selectedLog.level)}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedLog && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div><strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}</div>
                            <div><strong>Level:</strong> {selectedLog.level}</div>
                            <div><strong>Category:</strong> {selectedLog.category}</div>
                            <div><strong>IP Address:</strong> {selectedLog.ip_address}</div>
                            {selectedLog.user_id && (
                              <div><strong>User ID:</strong> {selectedLog.user_id}</div>
                            )}
                            {selectedLog.request_id && (
                              <div><strong>Request ID:</strong> {selectedLog.request_id}</div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Message</h4>
                            <p className="p-3 bg-gray-50 rounded">{selectedLog.message}</p>
                          </div>

                          {selectedLog.user_agent && (
                            <div>
                              <h4 className="font-medium mb-2">User Agent</h4>
                              <p className="p-3 bg-gray-50 rounded text-sm font-mono break-all">
                                {selectedLog.user_agent}
                              </p>
                            </div>
                          )}

                          {selectedLog.stack_trace && (
                            <div>
                              <h4 className="font-medium mb-2">Stack Trace</h4>
                              <pre className="p-3 bg-gray-900 text-green-400 rounded text-sm overflow-x-auto">
                                {selectedLog.stack_trace}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}