import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Star, Move } from 'lucide-react';
import { LocationCategory } from '../types';
import { supabase } from '../lib/supabase';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: any) => void;
  currentPosition?: [number, number];
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPosition
}) => {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(currentPosition ? currentPosition[0] : 55.1694);
  const [longitude, setLongitude] = useState(currentPosition ? currentPosition[1] : 23.8813);
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 300, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Update coordinates when currentPosition changes
  useEffect(() => {
    if (currentPosition) {
      setLatitude(currentPosition[0]);
      setLongitude(currentPosition[1]);
    } else {
      // If no position provided, try to get user's current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Lithuania center if geolocation fails
          setLatitude(55.1694);
          setLongitude(23.8813);
        }
      );
    }
  }, [currentPosition, isOpen]);
  
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Keep coordinates if they were set
      if (!currentPosition) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          (error) => {
            console.log('Geolocation error:', error);
            setLatitude(55.1694);
            setLongitude(23.8813);
          }
        );
      }
      
      setName('');
      setDescription('');
      setCategories([]);
      setIsPublic(true);
      setIsPaid(false);
      setImages([]);
      setMainImageIndex(0);
      setImageUrl('');
      setPreviewImage(null);
      setCameraActive(false);
      setCropMode(false);
    }
  }, [isOpen, currentPosition]);
  
  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  // Category options
  const categoryOptions = [
    { value: 'fishing', label: 'Žvejyba' },
    { value: 'swimming', label: 'Maudymasis' },
    { value: 'camping', label: 'Stovyklavietė' },
    { value: 'rental', label: 'Nuoma' },
    { value: 'paid', label: 'Mokama zona' },
    { value: 'private', label: 'Privati teritorija' },
    { value: 'bonfire', label: 'Laužavietė' },
    { value: 'playground', label: 'Vaikų žaidimų aikštelė' },
    { value: 'picnic', label: 'Pikniko vieta' },
    { value: 'campsite', label: 'Kempingas' },
    { value: 'extreme', label: 'Ekstremalaus sporto vieta' }
  ];
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !latitude || !longitude) {
      alert('Prašome užpildyti visus privalomus laukus');
      return;
    }
    
    onSave({
      name,
      description,
      latitude,
      longitude,
      categories,
      is_public: isPublic,
      is_paid: isPaid,
      images,
      main_image_index: mainImageIndex
    });
    
    onClose();
  };
  
  // Handle category selection
  const handleCategoryChange = (category: LocationCategory) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };
  
  // Handle adding image from URL
  const handleAddImage = () => {
    if (!imageUrl) return;
    
    if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
      alert('Prašome įvesti teisingą nuotraukos URL');
      return;
    }
    
    setImages([...images, imageUrl]);
    setImageUrl('');
  };
  
  // Handle removing image
  const handleRemoveImage = (url: string) => {
    const newImages = images.filter(image => image !== url);
    setImages(newImages);
    
    // Update main image index if needed
    if (mainImageIndex >= newImages.length && newImages.length > 0) {
      setMainImageIndex(0);
    }
  };
  
  // Handle setting main image
  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setCropMode(true);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle camera start
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setPhotoReady(false);
        
        // Set photoReady to true after a short delay to ensure camera is initialized
        setTimeout(() => {
          setPhotoReady(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Nepavyko pasiekti kameros. Patikrinkite, ar suteikėte leidimą.');
    }
  };
  
  // Handle camera stop
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  };
  
  // Handle photo capture
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewImage(dataUrl);
      setCropMode(true);
      
      // Stop camera
      stopCamera();
    }
  };
  
  // Handle crop start
  const handleCropStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropRect.x, y: e.clientY - cropRect.y });
  };
  
  // Handle crop move
  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging && !resizeDirection) return;
    
    if (isDragging) {
      // Move the crop frame
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, (imageRef.current?.width || 0) - cropRect.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, (imageRef.current?.height || 0) - cropRect.height));
      
      setCropRect({
        ...cropRect,
        x: newX,
        y: newY
      });
    } else if (resizeDirection) {
      // Resize the crop frame
      const imageWidth = imageRef.current?.width || 0;
      const imageHeight = imageRef.current?.height || 0;
      
      let newRect = { ...cropRect };
      
      switch (resizeDirection) {
        case 'se':
          newRect.width = Math.max(50, Math.min(e.clientX - cropRect.x, imageWidth - cropRect.x));
          newRect.height = Math.max(50, Math.min(e.clientY - cropRect.y, imageHeight - cropRect.y));
          break;
        case 'sw':
          const newWidthSW = Math.max(50, cropRect.x + cropRect.width - e.clientX);
          const newXSW = Math.min(cropRect.x + cropRect.width - 50, e.clientX);
          newRect.x = newXSW;
          newRect.width = newWidthSW;
          newRect.height = Math.max(50, Math.min(e.clientY - cropRect.y, imageHeight - cropRect.y));
          break;
        case 'ne':
          newRect.width = Math.max(50, Math.min(e.clientX - cropRect.x, imageWidth - cropRect.x));
          const newHeightNE = Math.max(50, cropRect.y + cropRect.height - e.clientY);
          const newYNE = Math.min(cropRect.y + cropRect.height - 50, e.clientY);
          newRect.y = newYNE;
          newRect.height = newHeightNE;
          break;
        case 'nw':
          const newWidthNW = Math.max(50, cropRect.x + cropRect.width - e.clientX);
          const newXNW = Math.min(cropRect.x + cropRect.width - 50, e.clientX);
          const newHeightNW = Math.max(50, cropRect.y + cropRect.height - e.clientY);
          const newYNW = Math.min(cropRect.y + cropRect.height - 50, e.clientY);
          newRect.x = newXNW;
          newRect.y = newYNW;
          newRect.width = newWidthNW;
          newRect.height = newHeightNW;
          break;
      }
      
      setCropRect(newRect);
    }
  };
  
  // Handle crop end
  const handleCropEnd = () => {
    setIsDragging(false);
    setResizeDirection(null);
  };
  
  // Handle resize crop frame
  const handleResizeCropFrame = (direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeDirection(direction);
  };
  
  // Handle crop
  const handleCrop = () => {
    if (!previewImage || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Set canvas dimensions to match crop rect
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;
      
      // Draw cropped image to canvas
      ctx.drawImage(
        imageRef.current,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        0,
        0,
        cropRect.width,
        cropRect.height
      );
      
      // Convert canvas to data URL
      const croppedDataUrl = canvas.toDataURL('image/jpeg');
      setPreviewImage(croppedDataUrl);
      setCropMode(false);
    }
  };
  
  // Handle image upload
  const handleUploadImage = async () => {
    if (!previewImage) return;
    
    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      // Convert data URL to blob
      const res = await fetch(previewImage);
      const blob = await res.blob();
      
      // Generate unique filename
      const filename = `location_${Date.now()}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('location-images')
        .upload(filename, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('location-images')
        .getPublicUrl(data.path);
      
      // Add to images array
      setImages([...images, publicUrl]);
      
      // Reset state
      setPreviewImage(null);
      setUploadingImage(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Nepavyko įkelti nuotraukos. Bandykite dar kartą.');
      setUploadingImage(false);
    }
  };
  
  // Handle cancel image upload
  const cancelImageUpload = () => {
    setPreviewImage(null);
    setCropMode(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pridėti naują vietą</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {cameraActive ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Fotografavimas</h3>
            <div className="relative bg-black rounded-md overflow-hidden">
              <video 
                ref={videoRef}
                className="w-full h-auto"
                autoPlay
                playsInline
                onLoadedMetadata={() => setPhotoReady(true)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={stopCamera}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Atšaukti
              </button>
              <button
                onClick={capturePhoto}
                disabled={!photoReady}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                Fotografuoti
              </button>
            </div>
          </div>
        ) : previewImage && cropMode ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Nuotraukos apkarpymas</h3>
            <div 
              className="relative bg-gray-100 rounded-md overflow-hidden"
              onMouseMove={handleCropMove}
              onMouseUp={handleCropEnd}
            >
              <img 
                ref={imageRef}
                src={previewImage} 
                alt="Preview" 
                className="w-full h-auto"
                onLoad={() => {
                  if (imageRef.current) {
                    // Initialize crop rect to center of image
                    const width = Math.min(300, imageRef.current.width * 0.8);
                    const height = Math.min(200, imageRef.current.height * 0.8);
                    const x = (imageRef.current.width - width) / 2;
                    const y = (imageRef.current.height - height) / 2;
                    setCropRect({ x, y, width, height });
                  }
                }}
              />
              <div 
                ref={cropFrameRef}
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
                <div 
                  className="absolute w-6 h-6 -bottom-3 -right-3 cursor-se-resize"
                  onMouseDown={(e) => handleResizeCropFrame('se', e)}
                />
                <div 
                  className="absolute w-6 h-6 -bottom-3 -left-3 cursor-sw-resize"
                  onMouseDown={(e) => handleResizeCropFrame('sw', e)}
                />
                <div 
                  className="absolute w-6 h-6 -top-3 -right-3 cursor-ne-resize"
                  onMouseDown={(e) => handleResizeCropFrame('ne', e)}
                />
                <div 
                  className="absolute w-6 h-6 -top-3 -left-3 cursor-nw-resize"
                  onMouseDown={(e) => handleResizeCropFrame('nw', e)}
                />
              </div>
              <canvas 
                ref={canvasRef}
                width={300}
                height={200}
                className="hidden"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={cancelImageUpload}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Atšaukti
              </button>
              <button
                onClick={handleCrop}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Apkarpyti
              </button>
            </div>
          </div>
        ) : previewImage ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Nuotraukos peržiūra</h3>
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-auto rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={cancelImageUpload}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Atšaukti
              </button>
              <button
                onClick={handleUploadImage}
                disabled={uploadingImage}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                {uploadingImage ? `Įkeliama... ${uploadProgress}%` : 'Įkelti'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pavadinimas
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aprašymas
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platuma
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ilguma
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorijos
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {categoryOptions.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${option.value}`}
                      checked={categories.includes(option.value as LocationCategory)}
                      onChange={() => handleCategoryChange(option.value as LocationCategory)}
                      className="mr-2"
                    />
                    <label htmlFor={`category-${option.value}`} className="text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Vieša vieta
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isPaid" className="text-sm">
                  Mokama vieta
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuotraukos
              </label>
              
              {/* URL input */}
              <div className="flex mb-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Įveskite nuotraukos URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                >
                  Pridėti
                </button>
              </div>
              
              {/* Upload buttons */}
              <div className="flex space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md"
                >
                  <Upload size={16} className="mr-2" />
                  Įkelti nuotrauką
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md"
                >
                  <Camera size={16} className="mr-2" />
                  Fotografuoti
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {/* Image gallery */}
              {images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pasirinkite pagrindinę nuotrauką:</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {images.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Nuotrauka ${index + 1}`}
                          className={`w-full h-24 object-cover rounded ${mainImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => handleSetMainImage(index)}
                        />
                        <div className="absolute top-1 right-1 flex space-x-1">
                          {mainImageIndex === index && (
                            <div className="bg-blue-500 text-white rounded-full p-1">
                              <Star size={14} />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Atšaukti
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Išsaugoti
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddLocationModal;