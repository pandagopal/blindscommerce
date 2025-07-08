'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Database, 
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Shield,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface Backup {
  backup_id: number;
  backup_type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  created_at: string;
  size_mb: number;
  duration_seconds: number;
  location: string;
  includes_db: boolean;
  includes_files: boolean;
  retention_days: number;
}

interface BackupSchedule {
  schedule_id: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  type: 'full' | 'incremental';
  is_active: boolean;
  last_run?: string;
  next_run: string;
}

// Mock data
const mockBackups: Backup[] = [
  {
    backup_id: 1,
    backup_type: 'full',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    size_mb: 2048,
    duration_seconds: 180,
    location: 'aws-s3',
    includes_db: true,
    includes_files: true,
    retention_days: 30,
  },
  {
    backup_id: 2,
    backup_type: 'incremental',
    status: 'completed',
    created_at: new Date(Date.now() - 43200000).toISOString(),
    size_mb: 256,
    duration_seconds: 45,
    location: 'aws-s3',
    includes_db: true,
    includes_files: false,
    retention_days: 7,
  },
  {
    backup_id: 3,
    backup_type: 'incremental',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    size_mb: 0,
    duration_seconds: 0,
    location: 'aws-s3',
    includes_db: true,
    includes_files: false,
    retention_days: 7,
  },
];

const mockSchedules: BackupSchedule[] = [
  {
    schedule_id: 1,
    name: 'Daily Database Backup',
    frequency: 'daily',
    time: '02:00',
    type: 'incremental',
    is_active: true,
    last_run: new Date(Date.now() - 43200000).toISOString(),
    next_run: new Date(Date.now() + 43200000).toISOString(),
  },
  {
    schedule_id: 2,
    name: 'Weekly Full Backup',
    frequency: 'weekly',
    time: '03:00',
    type: 'full',
    is_active: true,
    last_run: new Date(Date.now() - 86400000).toISOString(),
    next_run: new Date(Date.now() + 518400000).toISOString(),
  },
];

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [schedules, setSchedules] = useState<BackupSchedule[]>(mockSchedules);
  const [loading, setLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);

  useEffect(() => {
    // Simulate backup progress
    const currentBackup = backups.find(b => b.status === 'in_progress');
    if (currentBackup) {
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Update backup status
            setBackups(backups.map(b => 
              b.backup_id === currentBackup.backup_id
                ? { ...b, status: 'completed', size_mb: 312, duration_seconds: 52 }
                : b
            ));
            return 100;
          }
          return prev + 10;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [backups]);

  const handleCreateBackup = async (type: 'full' | 'incremental') => {
    setLoading(true);
    try {
      // Simulate backup creation
      const newBackup: Backup = {
        backup_id: backups.length + 1,
        backup_type: type,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        size_mb: 0,
        duration_seconds: 0,
        location: 'aws-s3',
        includes_db: true,
        includes_files: type === 'full',
        retention_days: type === 'full' ? 30 : 7,
      };
      setBackups([newBackup, ...backups]);
      setBackupProgress(0);
    } catch (err) {
      console.error('Failed to create backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setLoading(true);
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Restore process initiated. The system will be unavailable during restoration.');
      setShowRestoreDialog(false);
    } catch (err) {
      console.error('Failed to restore backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (mb: number) => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Backup Management</h1>
          <p className="text-gray-600 mt-2">
            Manage database backups and disaster recovery
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleCreateBackup('incremental')}
            disabled={loading || backups.some(b => b.status === 'in_progress')}
          >
            <Database className="h-4 w-4 mr-2" />
            Quick Backup
          </Button>
          <Button
            onClick={() => handleCreateBackup('full')}
            disabled={loading || backups.some(b => b.status === 'in_progress')}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Full Backup
          </Button>
        </div>
      </div>

      {/* Backup Status Alert */}
      {backups.some(b => b.status === 'in_progress') && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Backup in Progress</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm">Creating backup... {backupProgress}% complete</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {backups.filter(b => b.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSize(backups.reduce((sum, b) => sum + b.size_mb, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.length > 0 
                ? format(new Date(backups[0].created_at), 'HH:mm')
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backups.length > 0 
                ? format(new Date(backups[0].created_at), 'MMM dd, yyyy')
                : 'No backups yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
          <CardDescription>
            Manage and restore from previous backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Includes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.backup_id}>
                  <TableCell>
                    {format(new Date(backup.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {backup.backup_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {backup.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {backup.status === 'in_progress' && (
                        <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      {backup.status === 'failed' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="capitalize">{backup.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {backup.size_mb > 0 ? formatSize(backup.size_mb) : '-'}
                  </TableCell>
                  <TableCell>
                    {backup.duration_seconds > 0 ? formatDuration(backup.duration_seconds) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {backup.includes_db && (
                        <Badge variant="secondary" className="text-xs">DB</Badge>
                      )}
                      {backup.includes_files && (
                        <Badge variant="secondary" className="text-xs">Files</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {backup.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowRestoreDialog(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backup Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedules</CardTitle>
          <CardDescription>
            Automated backup schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.schedule_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                  <div>
                    <h4 className="font-semibold">{schedule.name}</h4>
                    <p className="text-sm text-gray-600">
                      {schedule.frequency} at {schedule.time} • {schedule.type} backup
                    </p>
                    <p className="text-xs text-gray-500">
                      Next run: {format(new Date(schedule.next_run), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                    {schedule.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSchedules(schedules.map(s =>
                        s.schedule_id === schedule.schedule_id
                          ? { ...s, is_active: !s.is_active }
                          : s
                      ));
                    }}
                  >
                    {schedule.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              This will restore your system to the selected backup point
            </DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Restoring from this backup will overwrite all current data. 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Backup Date:</span>{' '}
                  {format(new Date(selectedBackup.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Type:</span>{' '}
                  {selectedBackup.backup_type}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Size:</span>{' '}
                  {formatSize(selectedBackup.size_mb)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={loading}
            >
              {loading ? 'Restoring...' : 'Restore Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}