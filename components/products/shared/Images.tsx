'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, GripVertical, ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { toast } from "sonner";

interface ImageFile {
  id: string;
  file?: File;
  url: string;
  alt: string;
  is_primary: boolean;
}

interface ImagesProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  isReadOnly?: boolean;
  productId?: string;
}

export default function Images({ images, onChange, isReadOnly = false, productId }: ImagesProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.url?.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isReadOnly) return;

    let successCount = 0;
    let errorCount = 0;

    // Create blob URLs for preview - NO upload yet
    const newImages = acceptedFiles.map((file) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
        errorCount++;
        return null;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Maximum size is 5MB.`);
        errorCount++;
        return null;
      }

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      successCount++;
      
      return {
        id: `${productId || 'new'}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        file,
        url: blobUrl, // Blob URL for preview
        alt: `${productId || 'new'}_${file.name}`,
        is_primary: images.length === 0 // First image is primary
      };
    }).filter(Boolean) as ImageFile[];

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
      toast.success(`${successCount} image(s) selected - will upload when you click "Update Product"`);
    }
  }, [images, onChange, isReadOnly, productId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true,
    disabled: isReadOnly
  });

  const handleRemoveImage = (index: number) => {
    if (isReadOnly) return;

    const newImages = [...images];
    const removedImage = newImages[index];
    
    // Revoke object URL if it exists
    if (removedImage.file) {
      URL.revokeObjectURL(removedImage.url);
    }
    
    newImages.splice(index, 1);
    
    // If we removed the primary image and there are other images, make the first one primary
    if (removedImage.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    if (isReadOnly) return;

    const newImages = images.map((image, i) => ({
      ...image,
      is_primary: i === index
    }));
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReadOnly && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
          >
            <input {...getInputProps()} />
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <div className="space-y-2">
                <p>Drag & drop product images here, or click to select files</p>
                <p className="text-sm text-muted-foreground">
                  Supports: PNG, JPG, JPEG, WebP
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              draggable={!isReadOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group border rounded-lg overflow-hidden
                ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="aspect-square relative">
                {image.url && image.url.trim() !== '' ? (
                  <Image
                    src={image.url}
                    alt={image.alt || 'Product image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {!isReadOnly && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute top-2 right-2 flex gap-2">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(index)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <GripVertical className="absolute bottom-2 right-2 h-5 w-5 text-white cursor-move" />
                </div>
              )}
              
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}