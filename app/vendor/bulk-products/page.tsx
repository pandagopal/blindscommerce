'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Package,
  BarChart3,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { useRoleAuth } from '@/lib/hooks/useRoleAuth';

interface BulkJob {
  job_id: string;
  operation_type: 'import' | 'export' | 'update';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  created_at: string;
  completed_at?: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number;
  recentJobs: number;
}

export default function VendorBulkProductsPage() {
  const { isAuthorized, isLoading } = useRoleAuth('vendor');
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'jobs'>('import');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedJob, setSelectedJob] = useState<BulkJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);

  const [exportOptions, setExportOptions] = useState({
    includeInactive: false,
    includeImages: true,
    includePricing: true,
    includeInventory: true,
    categoryFilter: '',
  });

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/v2/vendors/products/bulk/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/vendors/products/bulk/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const downloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/vendors/products/bulk/template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'product-import-template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/v2/vendors/products/bulk', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert('Import started successfully! Check the jobs tab for progress.');
        setSelectedFile(null);
        fetchJobs();
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error starting import:', error);
      alert('Import failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        includeInactive: exportOptions.includeInactive.toString(),
        includeImages: exportOptions.includeImages.toString(),
        includePricing: exportOptions.includePricing.toString(),
        includeInventory: exportOptions.includeInventory.toString(),
        categoryFilter: exportOptions.categoryFilter,
      });

      const response = await fetch(`/api/v2/vendors/products/bulk/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Loader;
      case 'failed': return AlertCircle;
      default: return RefreshCw;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Product Management</h1>
          <p className="text-gray-600">Import, export, and manage products in bulk</p>
        </div>
        <button
          onClick={fetchJobs}
          className="bg-primary-red text-white px-4 py-2 rounded-lg hover:bg-primary-red-dark transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentJobs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['import', 'export', 'jobs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-red text-primary-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Import Products</h2>
            <p className="text-gray-600">Upload a CSV file to bulk import or update products</p>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Start with our CSV template to ensure proper formatting
                </p>
                <button
                  onClick={downloadTemplate}
                  disabled={loading}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Downloading...' : 'Download Template'}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-red hover:text-primary-red-dark">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!selectedFile || loading}
              className="bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-primary-red-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Export Products</h2>
            <p className="text-gray-600">Download your product data as a CSV file</p>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Export Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeInactive}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeInactive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include inactive products</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeImages}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include image URLs</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includePricing}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includePricing: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include pricing data</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeInventory}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeInventory: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include inventory levels</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Filters</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Filter (optional)
                </label>
                <input
                  type="text"
                  value={exportOptions.categoryFilter}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, categoryFilter: e.target.value }))}
                  placeholder="Leave empty for all categories"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red"
                />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Products
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Operation History</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No bulk operations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => {
                const StatusIcon = getStatusIcon(job.status);
                
                return (
                  <div key={job.job_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(job.status).split(' ')[0]}`} />
                          <span className="font-medium text-gray-900">
                            {job.operation_type.toUpperCase()} - {job.file_name}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(job.status)}`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Total:</span> {job.total_records}
                          </div>
                          <div>
                            <span className="font-medium">Processed:</span> {job.processed_records}
                          </div>
                          <div>
                            <span className="font-medium">Success:</span> {job.success_count}
                          </div>
                          <div>
                            <span className="font-medium">Errors:</span> {job.error_count}
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Started:</span> {new Date(job.created_at).toLocaleString()}
                          {job.completed_at && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="font-medium">Completed:</span> {new Date(job.completed_at).toLocaleString()}
                            </>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {job.status === 'processing' && (
                          <div className="mt-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${job.total_records > 0 ? (job.processed_records / job.total_records) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobDetail(true);
                          }}
                          className="text-primary-red hover:text-primary-red-dark"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Job Detail Modal */}
      {showJobDetail && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Job Details - {selectedJob.job_id}
                </h3>
                <button
                  onClick={() => setShowJobDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Operation</label>
                    <p className="text-sm text-gray-900">{selectedJob.operation_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedJob.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">File Name</label>
                    <p className="text-sm text-gray-900">{selectedJob.file_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Records</label>
                    <p className="text-sm text-gray-900">{selectedJob.total_records}</p>
                  </div>
                </div>

                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Errors</label>
                    <div className="mt-2 max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-md p-3">
                      {selectedJob.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          Row {error.row}: {error.field} - {error.message}
                        </div>
                      ))}
                      {selectedJob.errors.length > 10 && (
                        <div className="text-sm text-red-600 font-medium">
                          ... and {selectedJob.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowJobDetail(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}