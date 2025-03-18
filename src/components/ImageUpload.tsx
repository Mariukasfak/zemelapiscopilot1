import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

// Define crop area interface
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, userId }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Crop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 300, height: 225 });

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result as string);
        setError(null);
        // Reset zoom and crop area when new image is loaded
        setZoom(1);
        setCropArea({ x: 0, y: 0, width: 300, height: 225 });
      });
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = useCallback(() => {
    if (imgRef.current && containerRef.current) {
      // Center the initial crop area when image loads
      const imgWidth = imgRef.current.clientWidth;
      const imgHeight = imgRef.current.clientHeight;
      
      // Set crop area to maintain 4:3 aspect ratio and fit within image
      const cropWidth = Math.min(300, imgWidth * 0.8);
      const cropHeight = cropWidth * (3/4); // 4:3 aspect ratio
      
      setCropArea({
        x: (imgWidth - cropWidth) / 2,
        y: (imgHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });
    }
  }, []);

  const handleCropStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate drag start position relative to crop area
    const cropRect = cropAreaRef.current?.getBoundingClientRect();
    if (cropRect) {
      setDragStart({
        x: e.clientX - cropRect.left,
        y: e.clientY - cropRect.top
      });
    }
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();
    
    // Calculate bounds to keep crop area inside the image
    const boundsLeft = imgRect.left - containerRect.left;
    const boundsTop = imgRect.top - containerRect.top;
    const boundsRight = boundsLeft + imgRect.width - cropArea.width;
    const boundsBottom = boundsTop + imgRect.height - cropArea.height;
    
    // Calculate new position
    let newX = e.clientX - containerRect.left - dragStart.x;
    let newY = e.clientY - containerRect.top - dragStart.y;
    
    // Keep within bounds
    newX = Math.max(boundsLeft, Math.min(newX, boundsRight));
    newY = Math.max(boundsTop, Math.min(newY, boundsBottom));
    
    setCropArea(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 1));
  };

  const getCroppedImg = async (): Promise<Blob> => {
    if (!imgRef.current || !cropAreaRef.current || !containerRef.current) {
      throw new Error('Missing required elements');
    }

    const imgRect = imgRef.current.getBoundingClientRect();
    const cropRect = cropAreaRef.current.getBoundingClientRect();

    // Calculate the crop coordinates relative to the original image
    const scaleX = imgRef.current.naturalWidth / imgRect.width;
    const scaleY = imgRef.current.naturalHeight / imgRect.height;
    
    const cropX = (cropRect.left - imgRect.left) * scaleX;
    const cropY = (cropRect.top - imgRect.top) * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;
    
    // Create a canvas and draw the cropped image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.drawImage(
      imgRef.current,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg', 0.95);
    });
  };

  const handleImageUpload = async () => {
    if (!imgSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      const croppedImage = await getCroppedImg();
      
      const uniqueId = userId || 'anonymous';
      const fileName = `${uniqueId}/${Date.now()}.jpeg`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('location-images')
        .upload(fileName, croppedImage, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
        
      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);
        
      onImageUploaded(publicUrlData.publicUrl);
      setImgSrc(null);

    } catch (error: any) {
      console.error("Error uploading image:", error);
      setError(error.message || "Klaida įkeliant nuotrauką");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    setImgSrc(null);
    setError(null);
    setZoom(1);
    setCropArea({ x: 0, y: 0, width: 300, height: 225 });
  };

  return (
    <div className="image-upload-container">
      {!imgSrc ? (
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-md w-full hover:bg-blue-600"
            disabled={loading}
          >
            <Upload size={16} className="mr-2" />
            Įkelti nuotrauką
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            ref={fileInputRef}
            className="hidden"
          />
        </div>
      ) : (
        <div className="crop-container">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Nuotraukos apkarpymas</span>
            <button 
              onClick={cancelUpload} 
              className="text-red-500 hover:text-red-700"
              title="Atšaukti"
            >
              <X size={16} />
            </button>
          </div>
          
          <div 
            ref={containerRef}
            className="relative mb-3 border rounded-md overflow-hidden bg-gray-900"
            style={{ height: '300px' }}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            <div 
              className="absolute"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center'
              }}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Apkarpyti vaizdą"
                className="max-w-full h-auto"
                onLoad={handleImageLoad}
              />
            </div>

            {/* Crop overlay */}
            <div 
              ref={cropAreaRef}
              className="absolute border-2 border-blue-500 bg-transparent cursor-move"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }}
              onMouseDown={handleCropStart}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-70">
                <Move size={20} />
              </div>
            </div>

            {/* Dark overlay outside crop area */}
            <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none">
              <div 
                className="absolute bg-transparent"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height
                }}
              />
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-center mb-3 space-x-2">
            <button 
              onClick={handleZoomOut} 
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              disabled={zoom <= 1}
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full mx-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <button 
              onClick={handleZoomIn} 
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              disabled={zoom >= 3}
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <button 
              onClick={cancelUpload} 
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Atšaukti
            </button>
            <button 
              onClick={handleImageUpload} 
              disabled={loading} 
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center"
            >
              {loading ? (
                <>
                  <span className="mr-2">Įkeliama...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                </>
              ) : (
                <>
                  <span>Išsaugoti</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
