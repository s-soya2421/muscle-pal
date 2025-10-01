'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostImageGalleryProps {
  images: string[];
}

export function PostImageGallery({ images }: PostImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImage(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    }
  };

  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2';
    }
  };

  const getImageClass = (index: number) => {
    if (images.length === 3 && index === 0) {
      return 'col-span-2';
    }
    return '';
  };

  return (
    <>
      {/* Image Grid */}
      <div data-testid="post-image-gallery" className={`grid ${getGridClass()} gap-2 rounded-lg overflow-hidden`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative aspect-square bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity ${getImageClass(index)}`}
            onClick={() => openModal(index)}
          >
            <img
              src={image}
              alt={`投稿画像 ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA3MEg4MFY5MEg2MFY3MFpNMTAwIDcwSDEyMFY5MEgxMDBWNzBaTTEwMCAxMTBIMTIwVjEzMEgxMDBWMTEwWk02MCA5MEg4MFYxMTBINjBWOTBaTTgwIDEzMEgxNDBWMTUwSDgwVjEzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
              }}
            />
            {images.length > 1 && index === images.length - 1 && images.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  +{images.length - 3}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Image */}
            <img
              src={images[selectedImage]}
              alt={`投稿画像 ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTgwSDIwMFYyMjBIMTYwVjE4MFpNMjQwIDE4MEgyODBWMjIwSDI0MFYxODBaTTI0MCAyNDBIMjgwVjI4MEgyNDBWMjQwWk0xNjAgMjIwSDIwMFYyNjBIMTYwVjIyMFpNMjAwIDI4MEgzMDBWMzIwSDIwMFYyODBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
              }}
            />

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                {selectedImage + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeModal}
          />
        </div>
      )}
    </>
  );
}
