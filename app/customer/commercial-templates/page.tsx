'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Template {
  templateId: string;
  templateName: string;
  description: string;
  minQuantity: number;
  maxQuantity: number;
  requiredColumns: string[];
  optionalColumns: string[];
}

interface BulkUpload {
  uploadId: string;
  templateId: string;
  fileName: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  status: string;
  totalAmount?: number;
  createdAt: string;
}

interface UploadResult {
  uploadId: string;
  fileName: string;
  status: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  validationErrors: any[];
  validationWarnings: any[];
  estimatedPricing?: {
    subtotal: number;
    bulkDiscount: number;
    discountPercentage: number;
    estimatedTotal: number;
  };
}

export default function CommercialTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string>('');

  useEffect(() => {
    loadTemplates();
    loadUploads();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v2/users/commercial-templates');
      const data = await response.json();

      if (response.ok && data.success) {
        setTemplates(data.templates);
      } else {
        if (response.status === 403) {
          setEligibilityError(data.reason || 'Access denied to commercial templates');
        } else {
          setError(data.error || 'Failed to load templates');
        }
      }
    } catch (error) {
      setError('Network error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const loadUploads = async () => {
    try {
      const response = await fetch('/api/v2/commerce/bulk-order');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploads(data.uploads);
        }
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  };

  const downloadTemplate = async (templateId: string, templateName: string) => {
    try {
      const response = await fetch(`/api/customer/commercial-templates?templateId=${templateId}&format=csv`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName.replace(/[^a-zA-Z0-9]/g, '_')}_template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to download template');
      }
    } catch (error) {
      setError('Network error downloading template');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('templateId', selectedTemplate);
      formData.append('csvFile', file);

      const response = await fetch('/api/v2/commerce/bulk-order', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadResult(data.upload);
        await loadUploads(); // Refresh upload history
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error) {
      setError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'invalid':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (eligibilityError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              Commercial Templates Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {eligibilityError}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">To access commercial bulk order templates, you need:</p>
              <ul className="text-sm text-gray-600 list-disc ml-6 space-y-1">
                <li>At least 2 completed orders</li>
                <li>Minimum $500 in completed orders</li>
                <li>Business email address</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Commercial Bulk Order Templates</h1>
        <p className="text-gray-600 mt-2">
          Download templates and upload your bulk orders for commercial blinds projects (5+ blinds)
        </p>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.templateId} className={selectedTemplate === template.templateId ? 'ring-2 ring-red-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {template.templateName}
                  <Badge variant="outline">
                    {template.minQuantity}+ blinds
                  </Badge>
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Required Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.requiredColumns.slice(0, 4).map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {template.requiredColumns.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.requiredColumns.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTemplate(template.templateId, template.templateName)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button
                    variant={selectedTemplate === template.templateId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplate(template.templateId)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {selectedTemplate === template.templateId ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Bulk Order</CardTitle>
            <CardDescription>
              Upload your completed CSV file for validation and processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {uploading ? 'Uploading...' : 'Upload CSV File'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Click to browse or drag and drop your CSV file here
                  </p>
                </label>
              </div>

              {uploading && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700">Processing bulk order...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon(uploadResult.status)}
              <span className="ml-2">Upload Result</span>
              <Badge className={`ml-auto ${getStatusColor(uploadResult.status)}`}>
                {uploadResult.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{uploadResult.rowCount}</p>
                <p className="text-sm text-gray-600">Total Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{uploadResult.validRows}</p>
                <p className="text-sm text-gray-600">Valid Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{uploadResult.invalidRows}</p>
                <p className="text-sm text-gray-600">Invalid Rows</p>
              </div>
              {uploadResult.estimatedPricing && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    ${uploadResult.estimatedPricing.estimatedTotal.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Estimated Total</p>
                </div>
              )}
            </div>

            {uploadResult.estimatedPricing && uploadResult.estimatedPricing.discountPercentage > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Bulk discount applied: {uploadResult.estimatedPricing.discountPercentage}% 
                  (${uploadResult.estimatedPricing.bulkDiscount.toLocaleString()} savings)
                </AlertDescription>
              </Alert>
            )}

            {uploadResult.validationErrors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Validation Errors:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uploadResult.validationErrors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                  {uploadResult.validationErrors.length > 10 && (
                    <p className="text-sm text-gray-500">
                      ... and {uploadResult.validationErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {uploadResult.validationWarnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">Warnings:</h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {uploadResult.validationWarnings.slice(0, 5).map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-600">
                      Row {warning.row}: {warning.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.status === 'valid' && (
              <div className="pt-4 border-t">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload History */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Your bulk order upload history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.slice(0, 5).map((upload) => (
                <div key={upload.uploadId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(upload.status)}
                    <div>
                      <p className="font-medium">{upload.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {upload.validRows} valid rows • {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(upload.status)}>
                      {upload.status}
                    </Badge>
                    {upload.totalAmount && (
                      <span className="text-sm font-medium">
                        ${upload.totalAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}