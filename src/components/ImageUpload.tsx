import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, Camera } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, userId }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result as string);
        setError(null);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(() => {
    // Negalime tiesiogiai priskirti į imgRef.current, jis jau nustatytas per ref atributą
    // Tik patikrinti, kad paveikslas užsikrovė teisingai
  }, []);

  const getCroppedImg = () => {
    if (!imgRef.current || !canvasRef.current) return null;
    
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Nustatome canvas dydį pagal paveikslėlį (arba pageidaujamą dydį)
    const maxSize = 1200; // maksimalus dydis pikseliais
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    
    // Jei paveiksliukas per didelis, sumažiname jį
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Piešiame paveikslėlį
    ctx.drawImage(image, 0, 0, width, height);
    
    // Konvertuojame į Blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Nepavyko sukurti vaizdo"));
      }, 'image/jpeg', 0.85); // 85% kokybė
    });
  };

  const handleImageUpload = async () => {
    if (!imgRef.current) return;

    setLoading(true);
    setError(null);
    
    try {
      const blob = await getCroppedImg();
      if (!blob) throw new Error("Nepavyko sukurti vaizdo");
      
      const uniqueId = userId || 'anonymous';
      const fileName = `${uniqueId}/${Date.now()}.jpeg`;
      
      // Įkeliame nuotrauką į Supabase Storage
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

      // Gauname viešą nuotraukos URL
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
  };

  return (
    <div className="image-upload-container">
      {!imgSrc ? (
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }
            }}
            className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-md w-full"
            disabled={loading}
          >
            <Upload size={16} className="mr-2" />
            Įkelti nuotrauką
          </button>
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }
            }}
            className="flex items-center justify-center p-2 bg-green-500 text-white rounded-md w-full"
            disabled={loading}
          >
            <Camera size={16} className="mr-2" />
            Fotografuoti
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
            <span className="text-sm font-medium">Nuotrauka</span>
            <button 
              onClick={cancelUpload} 
              className="text-red-500 hover:text-red-700"
              title="Atšaukti"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="mb-3 border rounded-md overflow-hidden">
            <div className="relative">
              <img
                ref={imgRef}
                alt="Pasirinktas vaizdas"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

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
