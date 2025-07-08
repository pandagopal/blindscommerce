'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface SystemLog {
  log_id: number;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'success' | 'debug';
  category: string;
  message: string;
  user_id?: number;
  user_email?: string;
  ip_address?: string;
  details?: Record<string, any>;
}

const logLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'error', label: 'Errors', icon: XCircle, color: 'text-red-500' },
  { value: 'warning', label: 'Warnings', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-500' },
  { value: 'debug', label: 'Debug', icon: AlertCircle, color: 'text-gray-500' },
];

const logCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'auth', label: 'Authentication' },
  { value: 'payment', label: 'Payments' },
  { value: 'order', label: 'Orders' },
  { value: 'api', label: 'API Calls' },
  { value: 'email', label: 'Email' },
  { value: 'system', label: 'System' },
  { value: 'security', label: 'Security' },
];

// Mock data for demonstration
const mockLogs: SystemLog[] = [
  {
    log_id: 1,
    timestamp: new Date().toISOString(),
    level: 'success',
    category: 'auth',
    message: 'User login successful',
    user_id: 1,
    user_email: 'admin@example.com',
    ip_address: '192.168.1.1',
  },
  {
    log_id: 2,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'error',
    category: 'payment',
    message: 'Payment processing failed',
    details: {
      error: 'Card declined',
      amount: 299.99,
      order_id: 'ORD-12345',
    },
  },
  {
    log_id: 3,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    level: 'warning',
    category: 'api',
    message: 'API rate limit approaching',
    details: {
      endpoint: '/api/v2/products',
      requests: 95,
      limit: 100,
    },
  },
  {
    log_id: 4,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    level: 'info',
    category: 'order',
    message: 'New order placed',
    user_id: 42,
    details: {
      order_id: 'ORD-12346',
      total: 599.99,
    },
  },
  {
    log_id: 5,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    level: 'error',
    category: 'security',
    message: 'Failed login attempt - invalid credentials',
    ip_address: '10.0.0.1',
    details: {
      email: 'test@example.com',
      attempts: 3,
    },
  },
];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>(mockLogs);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation, fetch from /api/v2/admin/logs
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLevel && matchesCategory && matchesSearch;
  });

  const getLevelIcon = (level: string) => {
    const levelConfig = logLevels.find(l => l.value === level);
    if (levelConfig?.icon) {
      const Icon = levelConfig.icon;
      return <Icon className={`h-4 w-4 ${levelConfig.color}`} />;
    }
    return null;
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User', 'IP Address', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.user_email || '-',
        log.ip_address || '-',
        JSON.stringify(log.details || {})
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-gray-600 mt-2">
            Monitor system activity and troubleshoot issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Filters</CardTitle>
          <CardDescription>
            Filter logs by level, category, or search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      {level.icon && <level.icon className={`h-4 w-4 ${level.color}`} />}
                      {level.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {logCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[120px]">IP Address</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getLevelIcon(log.level)}
                        <span className="capitalize">{log.level}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.category}</Badge>
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell className="text-sm">
                      {log.user_email || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      {log.details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            alert(JSON.stringify(log.details, null, 2));
                          }}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No logs found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          System logs are retained for 30 days. For compliance and audit purposes,
          logs older than 30 days are archived to cold storage.
        </AlertDescription>
      </Alert>
    </div>
  );
}