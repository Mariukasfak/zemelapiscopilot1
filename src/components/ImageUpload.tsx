import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, Check } from 'lucide-react';
import AdvancedImageCropper from './AdvancedImageCropper';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, userId }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result as string);
        // Iškart nustatome cropMode true
        setCropMode(true);
        setError(null);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setImgSrc(croppedImage);
    setCropMode(false);
  };

  const handleCropCancel = () => {
    setCropMode(false);
  };

  const handleImageUpload = async () => {
    if (!imgSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      // Konvertuojame data URL į blob
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      
      // Unikalus failo pavadinimas
      const uniqueId = userId || 'anonymous';
      const fileName = `${uniqueId}/${Date.now()}.jpeg`;
      
      // Įkeliame į Supabase
      const { error: uploadError } = await supabase.storage
        .from('location-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
        
      if (uploadError) {
        throw uploadError;
      }

      // Gauname viešą URL
      const { data: publicUrlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);
        
      // Perduodame URL tėviniam komponentui
      onImageUploaded(publicUrlData.publicUrl);
      
      // Išvalome būseną
      setImgSrc(null);
      setCropMode(false);

    } catch (error: any) {
      console.error("Error uploading image:", error);
      setError(error.message || "Klaida įkeliant nuotrauką");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    setImgSrc(null);
    setCropMode(false);
    setError(null);
  };

  return (
    <div className="image-upload-container">
      {!imgSrc ? (
        <div className="flex flex-col items-center space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            ref={fileInputRef}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-md w-full"
            disabled={loading}
          >
            <Upload size={18} className="mr-2" />
            Pasirinkti nuotrauką iš įrenginio
          </button>
        </div>
      ) : cropMode ? (
        <AdvancedImageCropper
          image={imgSrc}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      ) : (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Nuotrauka paruošta įkėlimui</span>
            <button 
              onClick={cancelUpload} 
              className="text-red-500 hover:text-red-700"
              title="Atšaukti"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="mb-3 border rounded-md overflow-hidden">
            <img
              src={imgSrc}
              alt="Pasirinkta nuotrauka"
              className="max-w-full"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={cancelUpload}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Pasirinkti kitą
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
                  <Check size={16} className="mr-2" />
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
