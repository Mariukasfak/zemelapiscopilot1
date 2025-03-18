import React, { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // jei norime tam tikro kraštinių santykio
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  image, 
  onCrop, 
  onCancel, 
  aspectRatio 
}) => {
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 300, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Nustatome pradinį crop rect kai paveikslas užkraunamas
  useEffect(() => {
    if (imgRef.current) {
      const img = imgRef.current;
      
      // Palaukiame kol paveikslas užsikraus
      if (!img.complete) {
        img.onload = initCropRect;
      } else {
        initCropRect();
      }
    }
  }, [aspectRatio]);
  
  const initCropRect = () => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Nustatome apkarpymo stačiakampio dydį
    let width, height;
    
    if (aspectRatio) {
      // Jei nustatytas kraštinių santykis
      if (imgWidth / imgHeight > aspectRatio) {
        height = Math.min(imgHeight, 300);
        width = height * aspectRatio;
      } else {
        width = Math.min(imgWidth, 300);
        height = width / aspectRatio;
      }
    } else {
      // Automatiškai nustatome dydį
      width = Math.min(imgWidth * 0.8, 300);
      height = Math.min(imgHeight * 0.8, 200);
    }
    
    // Centruojame stačiakampį
    const x = (imgWidth - width) / 2;
    const y = (imgHeight - height) / 2;
    
    setCropRect({ x, y, width, height });
  };
  
  // Apkarpymo stačiakampio manipuliavimo funkcijos
  const handleCropStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropRect.x, y: e.clientY - cropRect.y });
  };
  
  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging && !resizeDirection) return;
    
    if (isDragging) {
      // Judinti stačiakampį
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, (imgRef.current?.naturalWidth || 0) - cropRect.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, (imgRef.current?.naturalHeight || 0) - cropRect.height));
      
      setCropRect({
        ...cropRect,
        x: newX,
        y: newY
      });
    } else if (resizeDirection) {
      // Keisti stačiakampio dydį
      const imageWidth = imgRef.current?.naturalWidth || 0;
      const imageHeight = imgRef.current?.naturalHeight || 0;
      
      let newRect = { ...cropRect };
      
      switch (resizeDirection) {
        case 'se':
          newRect.width = Math.max(50, Math.min(e.clientX - cropRect.x, imageWidth - cropRect.x));
          if (aspectRatio) {
            newRect.height = newRect.width / aspectRatio;
          } else {
            newRect.height = Math.max(50, Math.min(e.clientY - cropRect.y, imageHeight - cropRect.y));
          }
          break;
        case 'sw':
          newRect.width = Math.max(50, cropRect.x + cropRect.width - e.clientX);
          newRect.x = Math.min(cropRect.x + cropRect.width - 50, e.clientX);
          if (aspectRatio) {
            newRect.height = newRect.width / aspectRatio;
          } else {
            newRect.height = Math.max(50, Math.min(e.clientY - cropRect.y, imageHeight - cropRect.y));
          }
          break;
        case 'ne':
          newRect.width = Math.max(50, Math.min(e.clientX - cropRect.x, imageWidth - cropRect.x));
          if (aspectRatio) {
            newRect.height = newRect.width / aspectRatio;
            newRect.y = cropRect.y + cropRect.height - newRect.height;
          } else {
            const newHeight = Math.max(50, cropRect.y + cropRect.height - e.clientY);
            newRect.y = Math.min(cropRect.y + cropRect.height - 50, e.clientY);
            newRect.height = newHeight;
          }
          break;
        case 'nw':
          newRect.width = Math.max(50, cropRect.x + cropRect.width - e.clientX);
          newRect.x = Math.min(cropRect.x + cropRect.width - 50, e.clientX);
          if (aspectRatio) {
            newRect.height = newRect.width / aspectRatio;
            newRect.y = cropRect.y + cropRect.height - newRect.height;
          } else {
            const newHeight = Math.max(50, cropRect.y + cropRect.height - e.clientY);
            newRect.y = Math.min(cropRect.y + cropRect.height - 50, e.clientY);
            newRect.height = newHeight;
          }
          break;
      }
      
      setCropRect(newRect);
    }
  };
  
  const handleCropEnd = () => {
    setIsDragging(false);
    setResizeDirection(null);
  };
  
  const handleResizeCropFrame = (direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeDirection(direction);
  };
  
  const applyCrop = () => {
    if (!imgRef.current || !canvasRef.current) return;
    
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Nustatome canvas dydį pagal iškirpimo stačiakampį
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    
    // Piešiame iškirptą vaizdą į canvas
    ctx.drawImage(
      image,
      cropRect.x, cropRect.y, cropRect.width, cropRect.height,
      0, 0, cropRect.width, cropRect.height
    );
    
    // Konvertuojame canvas į data URL ir perduodame tėviniam komponentui
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };
  
  return (
    <div className="image-cropper">
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm font-medium">Apkarpykite nuotrauką</span>
      </div>
      
      <div 
        className="relative bg-gray-100 rounded-md overflow-hidden"
        onMouseMove={handleCropMove}
        onMouseUp={handleCropEnd}
        onMouseLeave={handleCropEnd}
      >
        <img
          ref={imgRef}
          alt="Apkarpyti"
          src={image}
          className="max-w-full"
          style={{ display: 'block' }}
        />
        
        {/* Crop frame */}
        <div 
          className="absolute border-2 border-blue-500 cursor-move bg-blue-500 bg-opacity-10"
          style={{
            width: `${cropRect.width}px`,
            height: `${cropRect.height}px`,
            left: `${cropRect.x}px`,
            top: `${cropRect.y}px`
          }}
          onMouseDown={handleCropStart}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-70">
            <Move size={24} />
          </div>
          
          {/* Resize handles */}
          <div className="absolute w-6 h-6 -bottom-3 -right-3 cursor-se-resize"
               onMouseDown={(e) => handleResizeCropFrame('se', e)} />
          <div className="absolute w-6 h-6 -bottom-3 -left-3 cursor-sw-resize"
               onMouseDown={(e) => handleResizeCropFrame('sw', e)} />
          <div className="absolute w-6 h-6 -top-3 -right-3 cursor-ne-resize"
               onMouseDown={(e) => handleResizeCropFrame('ne', e)} />
          <div className="absolute w-6 h-6 -top-3 -left-3 cursor-nw-resize"
               onMouseDown={(e) => handleResizeCropFrame('nw', e)} />
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div className="flex justify-end space-x-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          Atšaukti
        </button>
        <button
          onClick={applyCrop}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Apkarpyti
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
