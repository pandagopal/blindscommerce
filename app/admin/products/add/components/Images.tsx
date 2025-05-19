import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface Image {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface ImagesProps {
  images: Image[];
  onChange: (images: Image[]) => void;
}

export default function Images({ images, onChange }: ImagesProps) {
  const [uploadedImages, setUploadedImages] = useState<Image[]>(images);

  const onDrop = async (acceptedFiles: File[]) => {
    // In a real application, you would upload these files to your storage service
    // For now, we'll just create object URLs
    const newImages = acceptedFiles.map(file => ({
      url: URL.createObjectURL(file),
      alt: file.name,
      isPrimary: false
    }));

    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    onChange(updatedImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

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

  return (
    <div className="p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-red bg-red-50' : 'border-gray-300 hover:border-primary-red'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag and drop images here, or click to select files</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {uploadedImages.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
              <button
                onClick={() => setPrimaryImage(index)}
                className={`px-3 py-1 rounded ${
                  image.isPrimary ? 'bg-primary-red' : 'bg-white text-black'
                }`}
              >
                {image.isPrimary ? 'Primary' : 'Set Primary'}
              </button>
              <button
                onClick={() => removeImage(index)}
                className="px-3 py-1 rounded bg-red-600 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 