'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, GripVertical, ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isReadOnly) return;

    // Upload files and get URLs
    const uploadPromises = acceptedFiles.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (productId) {
          formData.append('productId', productId);
        }

        const response = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        return {
          id: `${productId || 'new'}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          file,
          url: result.url,
          alt: `${productId || 'new'}_${file.name}`,
          is_primary: false
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        // Fallback to object URL for preview
        return {
          id: `${productId || 'new'}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          file,
          url: URL.createObjectURL(file),
          alt: `${productId || 'new'}_${file.name}`,
          is_primary: false
        };
      }
    });

    const newImages = await Promise.all(uploadPromises);
    onChange([...images, ...newImages]);
  }, [images, onChange, isReadOnly]);

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