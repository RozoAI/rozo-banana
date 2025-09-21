'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface MultiImageUploaderProps {
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  className?: string;
}

export function MultiImageUploader({ 
  maxImages = 9, 
  onImagesChange,
  className = ''
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;
    
    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`);
      return;
    }

    Array.from(files).forEach((file, index) => {
      if (index >= remainingSlots) return;
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        newImages.push(base64);
        
        if (newImages.length === files.length || newImages.length === remainingSlots) {
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          onImagesChange(updatedImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            dragActive
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-300 hover:border-yellow-400 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-3">
              You can upload up to {maxImages} images (JPG, PNG, GIF)
            </p>
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              Choose Images
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={image}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                {index + 1}/{images.length}
              </div>
            </div>
          ))}
          
          {/* Add More Button */}
          {images.length < maxImages && (
            <button
              onClick={triggerFileInput}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-yellow-50"
            >
              <Plus className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Add More</span>
              <span className="text-xs text-gray-500">
                {maxImages - images.length} slots left
              </span>
            </button>
          )}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {images.length} image{images.length > 1 ? 's' : ''} selected
            </span>
          </div>
          {images.length === maxImages && (
            <span className="text-yellow-600 font-medium">
              Maximum images reached
            </span>
          )}
        </div>
      )}
    </div>
  );
}