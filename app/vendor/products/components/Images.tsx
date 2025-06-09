import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Image as ImageIcon, Star } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

interface ImagesProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export default function Images({ images, onChange }: ImagesProps) {
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  const addImage = () => {
    if (!newImageUrl.trim()) return;

    const newImage: ProductImage = {
      id: Date.now().toString(),
      url: newImageUrl.trim(),
      alt_text: newImageAlt.trim() || 'Product image',
      is_primary: images.length === 0,
      sort_order: images.length
    };

    onChange([...images, newImage]);
    setNewImageUrl('');
    setNewImageAlt('');
  };

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove?.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }

    onChange(updatedImages);
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    onChange(updatedImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [moved] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, moved);
    
    // Update sort orders
    updatedImages.forEach((img, index) => {
      img.sort_order = index;
    });

    onChange(updatedImages);
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    if (!draggedImage) return;

    const fromIndex = images.findIndex(img => img.id === draggedImage);
    const toIndex = images.findIndex(img => img.id === targetImageId);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderImages(fromIndex, toIndex);
    }

    setDraggedImage(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Images</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add images to showcase your product. The first image will be the main product image.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="imageAlt">Alt Text</Label>
              <Input
                id="imageAlt"
                placeholder="Describe the image"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addImage} disabled={!newImageUrl.trim()}>
            <Upload className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Images ({images.length})</CardTitle>
            <p className="text-sm text-gray-600">
              Drag and drop to reorder. Click the star to set as primary image.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, image.id)}
                    className="relative group border rounded-lg p-3 bg-gray-50 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center overflow-hidden">
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={image.alt_text}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className="hidden flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="h-8 w-8 mb-1" />
                        <span className="text-xs">Failed to load</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Image {index + 1}</span>
                        <div className="flex items-center gap-1">
                          {image.is_primary && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 truncate" title={image.alt_text}>
                        {image.alt_text}
                      </p>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrimaryImage(image.id)}
                          disabled={image.is_primary}
                          className="flex items-center gap-1"
                        >
                          <Star
                            className={`h-3 w-3 ${
                              image.is_primary ? 'fill-current text-yellow-500' : ''
                            }`}
                          />
                          {image.is_primary ? 'Primary' : 'Set Primary'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {images.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No images added yet</h3>
              <p className="text-sm">Add your first product image using the form above</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Image Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (at least 800x600 pixels)</li>
          <li>• Include multiple angles and detail shots</li>
          <li>• Add descriptive alt text for accessibility</li>
          <li>• The first image will be used as the main product image</li>
        </ul>
      </div>
    </div>
  );
}