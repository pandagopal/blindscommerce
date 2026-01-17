'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface BulkJob {
  job_id: string;
  vendor_id: number;
  vendor_name: string;
  operation_type: 'import' | 'export' | 'update';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
  file_name: string;
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  created_at: string;
  completed_at?: string;
}

export default function AdminBulkOperationsPage() {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'completed_with_errors', label: 'Completed with Errors' },
    { value: 'failed', label: 'Failed' },
  ];

  const operationOptions = [
    { value: 'all', label: 'All Operations' },
    { value: 'import', label: 'Import' },
    { value: 'export', label: 'Export' },
    { value: 'update', label: 'Update' },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    completed_with_errors: 'bg-orange-100 text-orange-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    pending: Clock,
    processing: RefreshCw,
    completed: CheckCircle,
    completed_with_errors: AlertCircle,
    failed: AlertCircle,
  };

  const operationIcons = {
    import: Upload,
    export: Download,
    update: Package,
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedStatus, selectedOperation]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedOperation !== 'all') {
        params.append('operation', selectedOperation);
      }
      
      const response = await fetch(`/api/v2/admin/bulk?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getProgressPercentage = (job: BulkJob) => {
    if (job.total_records === 0) return 0;
    return Math.round((job.processed_records / job.total_records) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Operations Monitor</h1>
          <p className="text-gray-600">Monitor vendor bulk product operations across the platform</p>
        </div>
        <button
          onClick={fetchJobs}
          className="bg-primary-red text-white px-4 py-2 rounded-lg hover:bg-primary-red-dark transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusOptions.slice(1)).map(([_, option]) => {
          const count = jobs.filter(job => job.status === option.value).length;
          const StatusIcon = statusIcons[option.value as keyof typeof statusIcons];
          
          return (
            <div key={option.value} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <StatusIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{option.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by file name, vendor, or job ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-red"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-red"
            >
              {operationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => {
                const StatusIcon = statusIcons[job.status];
                const OperationIcon = operationIcons[job.operation_type];
                const progress = getProgressPercentage(job);
                
                return (
                  <tr key={job.job_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {job.job_id.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500">{job.file_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.vendor_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {job.vendor_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <OperationIcon className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {job.operation_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            job.status === 'completed' ? 'bg-green-600' :
                            job.status === 'failed' ? 'bg-red-600' :
                            job.status === 'processing' ? 'bg-blue-600' : 'bg-gray-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {job.processed_records}/{job.total_records} ({progress}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2`} />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[job.status]}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {job.error_count > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {job.error_count} errors
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-red-600 hover:text-red-800">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No bulk operations found</p>
          </div>
        )}
      </div>
    </div>
  );
}