import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Crop, Check, X, Image, Loader } from 'lucide-react';

interface SmartImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
  onCancel?: () => void;
}

const SmartImageUploader: React.FC<SmartImageUploaderProps> = ({ 
  onImageUploaded, 
  userId = 'anonymous',
  onCancel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropRatio, setCropRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Funkcija failo pasirinkimui
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Tikriname ar failas yra paveikslėlis
      if (!selectedFile.type.startsWith('image/')) {
        alert('Prašome pasirinkti paveikslėlį');
        return;
      }
      
      setFile(selectedFile);
      
      // Sukuriame peržiūros URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
          // Automatiškai pereiti į apkarpymo režimą
          setCropMode(true);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Funkcija apkarpymo patvirtinimui
  const handleCropComplete = (croppedImage: string) => {
    setPreview(croppedImage);
    setCropMode(false);
  };
  
  // Funkcija nuotraukos įkėlimui
  const uploadImage = async () => {
    if (!preview) return;
    
    setLoading(true);
    setProgress(0);
    
    try {
      // Konvertuojame data URL į Blob
      const response = await fetch(preview);
      const blob = await response.blob();
      
      // Sukuriame unikalų failo pavadinimą
      const fileExt = file?.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      // Įkeliame į Supabase
      const { data, error } = await supabase.storage
        .from('location-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: file?.type || 'image/jpeg'
        });
      
      if (error) throw error;
      
      // Gauname viešą URL
      const { data: urlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);
      
      // Perduodame URL tėviniam komponentui
      onImageUploaded(urlData.publicUrl);
      
      // Išvalome būseną
      resetState();
    } catch (error) {
      console.error('Klaida įkeliant paveikslėlį:', error);
      alert('Nepavyko įkelti paveikslėlio. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funkcija būsenos atstatymui
  const resetState = () => {
    setFile(null);
    setPreview(null);
    setCropMode(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Paprastas apkarpymo komponentas
  const SimpleCropper = () => {
    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [cropWidth, setCropWidth] = useState(300);
    const [cropHeight, setCropHeight] = useState(300);
    const imgRef = useRef<HTMLImageElement>(null);
    
    useEffect(() => {
      // Automatiškai nustatome apkarpymo dydį pagal paveikslėlį
      if (imgRef.current && imgRef.current.complete) {
        initCropSize();
      }
    }, []);
    
    const initCropSize = () => {
      if (!imgRef.current) return;
      
      const img = imgRef.current;
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      let newWidth, newHeight;
      
      if (cropRatio) {
        // Naudojame pasirinktą santykį
        if (width / height > cropRatio) {
          newHeight = Math.min(height, 300);
          newWidth = newHeight * cropRatio;
        } else {
          newWidth = Math.min(width, 300);
          newHeight = newWidth / cropRatio;
        }
      } else {
        // Automatiškai renkamės geriausią santykį
        if (width > height) {
          newHeight = Math.min(height, 300);
          newWidth = Math.min(width, 300 * (width / height));
        } else {
          newWidth = Math.min(width, 300);
          newHeight = Math.min(height, 300 * (height / width));
        }
      }
      
      setCropWidth(newWidth);
      setCropHeight(newHeight);
      setCropX((width - newWidth) / 2);
      setCropY((height - newHeight) / 2);
    };
    
    const applyCrop = () => {
      if (!canvasRef.current || !imgRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Nustatome canvas dydį
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      // Piešiame apkarpytą vaizdą
      ctx.drawImage(
        imgRef.current,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      // Konvertuojame į duomenų URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      handleCropComplete(dataUrl);
    };
    
    return (
      <div className="relative bg-gray-100 rounded-md overflow-hidden my-4">
        <div className="relative">
          <img
            ref={imgRef}
            src={preview || ''}
            alt="Apkarpyti"
            className="max-w-full"
            onLoad={initCropSize}
          />
          
          <div 
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
            style={{
              left: `${cropX}px`,
              top: `${cropY}px`,
              width: `${cropWidth}px`,
              height: `${cropHeight}px`
            }}
          />
        </div>
        
        <div className="mt-3">
          <div className="mb-2">
            <label className="text-sm font-medium block mb-1">Proporcijos:</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCropRatio(1)}
                className={`px-2 py-1 text-xs rounded ${cropRatio === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                1:1 (Kvadratas)
              </button>
              <button 
                onClick={() => setCropRatio(4/3)}
                className={`px-2 py-1 text-xs rounded ${cropRatio === 4/3 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                4:3
              </button>
              <button 
                onClick={() => setCropRatio(16/9)}
                className={`px-2 py-1 text-xs rounded ${cropRatio === 16/9 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                16:9
              </button>
              <button 
                onClick={() => setCropRatio(null)}
                className={`px-2 py-1 text-xs rounded ${cropRatio === null ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                Laisvas
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCropMode(false)}
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
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  };
  
  return (
    <div className="smart-image-uploader">
      {!file ? (
        // Failo pasirinkimo vaizdas
        <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
          <Image size={48} className="text-gray-400 mb-4" />
          <p className="text-center text-gray-600 mb-4">
            Paspauskite, kad pasirinktumėte nuotrauką arba nutempkite failą čia
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <Upload size={18} className="mr-2" />
            Pasirinkti nuotrauką
          </button>
        </div>
      ) : cropMode ? (
        // Apkarpymo režimas
        <SimpleCropper />
      ) : (
        // Peržiūros režimas prieš įkėlimą
        <div className="flex flex-col">
          <div className="border rounded-md overflow-hidden my-2">
            <img 
              src={preview || ''} 
              alt="Pasirinkta nuotrauka" 
              className="max-w-full" 
            />
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center my-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 flex items-center">
                <Loader size={14} className="mr-2 animate-spin" />
                Įkeliama... {progress}%
              </p>
            </div>
          ) : (
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    resetState();
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <X size={16} className="mr-1 inline" />
                Atšaukti
              </button>
              <button
                onClick={() => setCropMode(true)}
                className="px-3 py-1 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
              >
                <Crop size={16} className="mr-1 inline" />
                Redaguoti
              </button>
              <button
                onClick={uploadImage}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <Check size={16} className="mr-1 inline" />
                Įkelti
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartImageUploader;
