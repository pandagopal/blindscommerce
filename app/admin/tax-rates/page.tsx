'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, Download, Search, AlertTriangle, CheckCircle, 
  XCircle, FileText, Database, RefreshCw 
} from 'lucide-react';

interface TaxRate {
  tax_rate_id: number;
  zip_code: string;
  city: string;
  county: string;
  state_code: string;
  state_name: string;
  state_tax_rate: number;
  county_tax_rate: number;
  city_tax_rate: number;
  special_district_tax_rate: number;
  total_tax_rate: number;
  tax_jurisdiction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UploadResult {
  success: boolean;
  processed: number;
  imported: number;
  updated: number;
  errors: string[];
  preview?: any[];
  records?: any[];
  valid?: number;
  total_errors?: number;
}

export default function TaxRatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fileSelected, setFileSelected] = useState(false);
  const itemsPerPage = 50;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to first page when searching
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Load tax rates when component mounts or when search/pagination changes
    loadTaxRates();
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    // Set loading to false after initial mount
    setLoading(false);
  }, []);

  const loadTaxRates = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });

      const res = await fetch(`/api/v2/admin/tax-rates?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to load tax rates: ${errorData.error || res.statusText}`);
      }
      const result = await res.json();
      // V2 API wraps response in { success, data }
      const data = result.data || result;
      setTaxRates(data.rates || []);
      setTotalRecords(data.pagination?.total || data.total || 0);
      setTotalPages(Math.ceil((data.pagination?.total || data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  const handleFileUpload = async (preview: boolean = false) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setShowPreview(preview);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (preview) {
        formData.append('preview', 'true');
      }

      const response = await fetch('/api/v2/admin/tax-rates/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const result = await response.json();
      // Handle V2 API response format
      const uploadData = result.data || result;
      
      // Ensure errors array exists
      if (!uploadData.errors) {
        uploadData.errors = [];
      }
      
      // Map records to preview for consistency
      if (uploadData.records && !uploadData.preview) {
        uploadData.preview = uploadData.records;
      }
      
      setUploadResult(uploadData);

      if (uploadData.success && !preview) {
        // Reload tax rates after successful upload
        await loadTaxRates();
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFileSelected(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        processed: 0,
        imported: 0,
        updated: 0,
        errors: ['Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/v2/admin/tax-rates/upload/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tax_rates_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tax rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              Tax Rates Management
            </h1>
            <p className="text-gray-600">Upload and manage ZIP code-based tax rates</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button
              onClick={() => loadTaxRates()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="border-red-100 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary-red" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload Tax Rates CSV</h3>
                  <p className="text-gray-600">Select a CSV file with tax rate data</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      setFileSelected(!!e.target.files?.[0]);
                      setUploadResult(null);
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                  <Button
                    onClick={() => handleFileUpload(true)}
                    disabled={!fileSelected || uploading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => handleFileUpload(false)}
                    disabled={!fileSelected || uploading}
                    className="bg-primary-red hover:bg-primary-red-dark text-white flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Import to Database
                      </>
                    )}
                  </Button>
                </div>
                {fileInputRef.current?.files?.[0] && (
                  <p className="text-sm text-gray-500">
                    Selected: {fileInputRef.current.files[0].name}
                  </p>
                )}
              </div>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      uploadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {showPreview ? 'Preview Results' : 'Upload Results'}
                    </h4>
                    
                    {uploadResult.success && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-700">
                          Processed: <strong>{uploadResult.processed}</strong> rows
                        </p>
                        {!showPreview && (
                          <>
                            <p className="text-sm text-gray-700">
                              Imported: <strong>{uploadResult.imported}</strong> new records
                            </p>
                            <p className="text-sm text-gray-700">
                              Updated: <strong>{uploadResult.updated}</strong> existing records
                            </p>
                          </>
                        )}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <p className="text-sm text-orange-700">
                            Errors: <strong>{showPreview ? (uploadResult.total_errors || uploadResult.errors.length) : uploadResult.errors.length}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-800 mb-2">Errors:</h5>
                        <div className="max-h-32 overflow-y-auto">
                          {uploadResult.errors.slice(0, 10).map((error, index) => (
                            <p key={index} className="text-xs text-red-700 mb-1">
                              {error}
                            </p>
                          ))}
                          {uploadResult.errors.length > 10 && (
                            <p className="text-xs text-gray-600">
                              ... and {uploadResult.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {showPreview && uploadResult.preview && Array.isArray(uploadResult.preview) && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-800 mb-2">Preview (first 10 rows):</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-1">ZIP Code</th>
                                <th className="text-left p-1">City</th>
                                <th className="text-left p-1">State</th>
                                <th className="text-left p-1">Tax Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {uploadResult.preview.map((row, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-1">{row.zip_code}</td>
                                  <td className="p-1">{row.city}</td>
                                  <td className="p-1">{row.state}</td>
                                  <td className="p-1">{row.tax_rate}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Tax Rates Table */}
        <Card className="border-red-100 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                Current Tax Rates ({totalRecords} total)
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by ZIP, city, or state..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 text-xs font-medium text-gray-700">ZIP Code</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">City</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">County</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">State</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">Total Rate</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">Jurisdiction</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">Updated</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {taxRates.map((rate) => (
                    <tr key={rate.tax_rate_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-gray-900">{rate.zip_code}</td>
                      <td className="p-2 text-gray-800">{rate.city}</td>
                      <td className="p-2 text-gray-600">{rate.county || '-'}</td>
                      <td className="p-2">
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {rate.state_code}
                        </span>
                      </td>
                      <td className="p-2 text-gray-900">{rate.total_tax_rate}%</td>
                      <td className="p-2 text-gray-600">{rate.tax_jurisdiction || '-'}</td>
                      <td className="p-2">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${
                          rate.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2 text-gray-500">
                        {new Date(rate.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {taxRates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tax rates found. Upload a CSV file to get started.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} results
                </p>
                <div className="flex gap-1 items-center">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-xs text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}