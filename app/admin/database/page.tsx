'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Database, Table, Trash2, RefreshCw, Download, Upload, 
  AlertTriangle, CheckCircle, Search, Play, Save
} from 'lucide-react';

interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  last_updated: string;
  status: 'healthy' | 'warning' | 'error';
}

interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  created_at: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
}

export default function AdminDatabasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [executingQuery, setExecutingQuery] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/admin/database');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/admin/database');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDatabaseInfo();
    }
  }, [user]);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      // Mock data since API might not exist yet
      const mockTables: DatabaseTable[] = [
        {
          name: 'users',
          rows: 1247,
          size: '2.4 MB',
          last_updated: '2023-10-25 14:30:00',
          status: 'healthy'
        },
        {
          name: 'products',
          rows: 892,
          size: '5.8 MB',
          last_updated: '2023-10-25 13:45:00',
          status: 'healthy'
        },
        {
          name: 'orders',
          rows: 3456,
          size: '12.1 MB',
          last_updated: '2023-10-25 15:22:00',
          status: 'healthy'
        },
        {
          name: 'cart_items',
          rows: 15234,
          size: '8.9 MB',
          last_updated: '2023-10-25 15:20:00',
          status: 'warning'
        },
        {
          name: 'payment_transactions',
          rows: 2891,
          size: '4.2 MB',
          last_updated: '2023-10-25 15:15:00',
          status: 'healthy'
        },
        {
          name: 'vendor_products',
          rows: 1567,
          size: '3.1 MB',
          last_updated: '2023-10-25 12:00:00',
          status: 'error'
        }
      ];

      const mockBackups: BackupInfo[] = [
        {
          id: 'backup-001',
          filename: 'blindscommerce_2023-10-25_daily.sql',
          size: '45.2 MB',
          created_at: '2023-10-25 02:00:00',
          type: 'automatic',
          status: 'completed'
        },
        {
          id: 'backup-002',
          filename: 'blindscommerce_2023-10-24_daily.sql',
          size: '44.8 MB',
          created_at: '2023-10-24 02:00:00',
          type: 'automatic',
          status: 'completed'
        },
        {
          id: 'backup-003',
          filename: 'blindscommerce_2023-10-23_manual.sql',
          size: '44.5 MB',
          created_at: '2023-10-23 16:30:00',
          type: 'manual',
          status: 'completed'
        }
      ];

      setTables(mockTables);
      setBackups(mockBackups);
    } catch (error) {
      console.error('Error fetching database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setExecutingQuery(true);
    try {
      // Mock query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock result based on query type
      if (sqlQuery.toLowerCase().includes('select')) {
        setQueryResult({
          type: 'select',
          rows: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ],
          count: 2
        });
      } else {
        setQueryResult({
          type: 'modify',
          message: 'Query executed successfully',
          affected_rows: 1
        });
      }
    } catch (error) {
      setQueryResult({
        type: 'error',
        message: 'Query execution failed: ' + error
      });
    } finally {
      setExecutingQuery(false);
    }
  };

  const createBackup = async () => {
    try {
      // Mock backup creation
      alert('Backup creation initiated. You will be notified when complete.');
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const optimizeTable = async (tableName: string) => {
    try {
      // Mock table optimization
      alert(`Optimizing table: ${tableName}...`);
      fetchDatabaseInfo(); // Refresh data
    } catch (error) {
      console.error('Error optimizing table:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'success',
      warning: 'warning',
      error: 'destructive',
      completed: 'success',
      in_progress: 'secondary',
      failed: 'destructive'
    } as const;

    const icons = {
      healthy: CheckCircle,
      warning: AlertTriangle,
      error: AlertTriangle,
      completed: CheckCircle,
      in_progress: RefreshCw,
      failed: AlertTriangle
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database information...</p>
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
              Database Management
            </h1>
            <p className="text-gray-600">Monitor and manage database tables, backups, and queries</p>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={createBackup}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button
              onClick={fetchDatabaseInfo}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="bg-white border border-purple-100">
            <TabsTrigger value="tables">
              <Table className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="backups">
              <Download className="h-4 w-4 mr-2" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="query">
              <Search className="h-4 w-4 mr-2" />
              Query
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Database Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tables.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-lg">{table.name}</h4>
                          {getStatusBadge(table.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {table.rows.toLocaleString()} rows • {table.size} • Last updated: {table.last_updated}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => optimizeTable(table.name)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Optimize
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Database className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Table Details - {table.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Rows:</strong> {table.rows.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Size:</strong> {table.size}
                                </div>
                                <div>
                                  <strong>Status:</strong> {getStatusBadge(table.status)}
                                </div>
                                <div>
                                  <strong>Last Updated:</strong> {table.last_updated}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button size="sm">View Structure</Button>
                                <Button variant="outline" size="sm">Export Data</Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Truncate
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Database Backups
                  </CardTitle>
                  <Button
                    onClick={createBackup}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    New Backup
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{backup.filename}</h4>
                          {getStatusBadge(backup.status)}
                          <Badge variant="outline">
                            {backup.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {backup.size} • Created: {backup.created_at}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  SQL Query Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Warning</h4>
                      <p className="text-sm text-yellow-700">
                        Direct database queries can modify or delete data. Please use caution and ensure you have backups.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SQL Query
                  </label>
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM users WHERE role = 'admin' LIMIT 10;"
                    rows={6}
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={executeQuery}
                    disabled={!sqlQuery.trim() || executingQuery}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {executingQuery ? 'Executing...' : 'Execute Query'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSqlQuery('');
                      setQueryResult(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {queryResult && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Query Result</h4>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      {queryResult.type === 'select' && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            {queryResult.count} rows returned
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  {queryResult.rows[0] && Object.keys(queryResult.rows[0]).map((key) => (
                                    <th key={key} className="text-left p-2 font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.rows.map((row: any, index: number) => (
                                  <tr key={index} className="border-b">
                                    {Object.values(row).map((value: any, i: number) => (
                                      <td key={i} className="p-2">
                                        {String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {queryResult.type === 'modify' && (
                        <div className="text-green-700">
                          <p>{queryResult.message}</p>
                          <p className="text-sm">Affected rows: {queryResult.affected_rows}</p>
                        </div>
                      )}
                      {queryResult.type === 'error' && (
                        <div className="text-red-700">
                          <p>{queryResult.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}