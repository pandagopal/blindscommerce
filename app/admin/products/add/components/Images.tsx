import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Upload, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import Image from 'next/image';

interface ProductImage {
  fileId?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  category?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  uploadDate?: Date;
}

interface ExistingFile {
  fileId: string;
  originalName: string;
  category: string;
  url: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  uploadDate: Date;
}

interface UploadError {
  fileName: string;
  errors: string[];
}

interface DuplicateFile {
  originalName: string;
  duplicateOfFileId: string;
  message: string;
}

interface ImagesProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  category: string;
  vendorId?: number;
}

export default function Images({ images, onChange, category, vendorId }: ImagesProps) {
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>(images);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateFile[]>([]);
  const [showExisting, setShowExisting] = useState(true);

  // Load existing files on component mount
  useEffect(() => {
    loadExistingFiles();
  }, [category, vendorId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fetch(`/api/vendor/files?category=${category}&uploadType=productImages&stats=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files[category]) {
          setExistingFiles(data.files[category]);
        }
      }
    } catch (error) {
      console.error('Failed to load existing files:', error);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadErrors([]);
    setDuplicates([]);

    try {
      const formData = new FormData();
      formData.append('uploadType', 'productImages');
      formData.append('category', category);
      
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/vendor/files', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Add successfully uploaded images
        const newImages: ProductImage[] = result.uploaded.map((file: any) => ({
          fileId: file.fileId,
          url: file.url,
          alt: file.originalName,
          isPrimary: false,
          category: file.category,
          fileSize: file.size
        }));

        const updatedImages = [...uploadedImages, ...newImages];
        setUploadedImages(updatedImages);
        onChange(updatedImages);

        // Handle duplicates
        if (result.duplicates) {
          setDuplicates(result.duplicates);
        }

        // Handle errors
        if (result.errors) {
          setUploadErrors(result.errors);
        }

        // Reload existing files
        await loadExistingFiles();
      } else {
        setUploadErrors([{ fileName: 'Upload', errors: [result.error] }]);
      }
    } catch (error) {
      setUploadErrors([{ fileName: 'Upload', errors: [`Network error: ${error}`] }]);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    multiple: true,
    maxSize: 2 * 1024 * 1024, // 2MB limit (reduced)
    maxFiles: 10, // Max 10 images (reduced)
    disabled: uploading,
    validator: (file) => {
      // Strict client-side validation
      if (file.size > 2 * 1024 * 1024) {
        return {
          code: 'file-too-large',
          message: 'File size exceeds 2MB limit for web optimization'
        };
      }
      
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        return {
          code: 'file-invalid-type',
          message: 'Invalid file type. Only JPEG and PNG are allowed.'
        };
      }
      
      return null;
    }
  });

  const addExistingFile = (existingFile: ExistingFile) => {
    // Check if already added
    const alreadyAdded = uploadedImages.some(img => img.fileId === existingFile.fileId);
    if (alreadyAdded) return;

    const newImage: ProductImage = {
      fileId: existingFile.fileId,
      url: existingFile.url,
      alt: existingFile.originalName,
      isPrimary: false,
      category: existingFile.category,
      fileSize: existingFile.fileSize,
      dimensions: existingFile.dimensions,
      uploadDate: existingFile.uploadDate
    };

    const updatedImages = [...uploadedImages, newImage];
    setUploadedImages(updatedImages);
    onChange(updatedImages);
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = uploadedImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setUploadedImages(updatedImages);
    onChange(updatedImages);
  };

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    onChange(updatedImages);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Images</h3>
          <Badge variant="outline">
            {uploadedImages.length}/10 images • Only JPEG & PNG • Max 2MB each
          </Badge>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop images here' : 'Upload Product Images'}
          </p>
          <p className="text-sm text-gray-500">
            Drop files here or click to browse. Max 2MB per image. JPEG and PNG only.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Recommended: 1920x1080 or smaller for web optimization
          </p>
        </div>

        {/* Upload Status */}
        {uploading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700">Uploading and processing images...</span>
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="space-y-2">
            {uploadErrors.map((error, index) => (
              <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-700">{error.fileName}</p>
                  <p className="text-xs text-red-600">{error.errors.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Duplicates */}
        {duplicates.length > 0 && (
          <div className="space-y-2">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">Duplicate: {duplicate.originalName}</p>
                  <p className="text-xs text-yellow-600">{duplicate.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Files Section */}
      {existingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Your Uploaded Images ({category})</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExisting(!showExisting)}
            >
              {showExisting ? 'Hide' : 'Show'} Previous Uploads
            </Button>
          </div>

          {showExisting && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingFiles.map((file) => {
                const isAdded = uploadedImages.some(img => img.fileId === file.fileId);
                return (
                  <Card key={file.fileId} className={`relative ${isAdded ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-2">
                      <div className="relative aspect-square">
                        <Image
                          src={file.url}
                          alt={file.originalName}
                          fill
                          className="object-cover rounded"
                        />
                        {isAdded && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium truncate">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)}
                          {file.dimensions && ` • ${file.dimensions.width}×${file.dimensions.height}`}
                        </p>
                        <Button
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => addExistingFile(file)}
                          disabled={isAdded}
                        >
                          {isAdded ? 'Added' : <Plus className="h-4 w-4 mr-1" />}
                          {!isAdded && 'Add to Product'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Selected Product Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <Card key={index} className={`relative ${image.isPrimary ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium truncate">{image.alt}</p>
                    {image.fileSize && (
                      <p className="text-xs text-gray-500">{formatFileSize(image.fileSize)}</p>
                    )}
                    <Button
                      variant={image.isPrimary ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setPrimaryImage(index)}
                    >
                      {image.isPrimary ? 'Primary Image' : 'Set as Primary'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Folder Structure Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Files are organized as:</strong> vendor_{vendorId}_vendorName/{category}/image_files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Duplicate images are automatically detected and prevented. Only JPEG and PNG formats are supported for web optimization.
        </p>
      </div>
    </div>
  );
}