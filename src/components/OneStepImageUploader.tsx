import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check, Loader, Move, Maximize2 } from 'lucide-react';

interface OneStepImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

const OneStepImageUploader: React.FC<OneStepImageUploaderProps> = ({ onImageUploaded, userId = 'anonymous' }) => {
  const [loading, setLoading] = useState(false);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 300, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Funkcija failo pasirinkimui ir apdorojimui
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Tikriname ar failas yra paveikslėlis
      if (!file.type.startsWith('image/')) {
        alert('Prašome pasirinkti paveikslėlį');
        return;
      }
      
      // Sukuriame peržiūrą ir iškart rodome nuotrauką
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCroppingImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Inicializuojame pradines apkarpymo reikšmes, kai nuotrauka užkraunama
  useEffect(() => {
    if (croppingImage && imageRef.current && imageRef.current.complete) {
      initCropRect();
    }
  }, [croppingImage]);
  
  // Nustatome pradinį apkarpymo stačiakampį
  const initCropRect = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Nustatome apkarpymo stačiakampio dydį - kvadratą, centruotą vaizde
    const size = Math.min(imgWidth, imgHeight) * 0.8;
    const x = (imgWidth - size) / 2;
    const y = (imgHeight - size) / 2;
    
    setCropRect({ x, y, width: size, height: size });
  };
  
  // Pradėti apkarpymo rėmelio tempimą
  const handleCropStart = (e: React.MouseEvent) => {
    if (!cropFrameRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Nustatome pradines tempimo koordinates
    const rect = cropFrameRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragStart({ x: offsetX, y: offsetY });
  };
  
  // Apkarpymo stačiakampio judinimas
  const handleCropMove = (e: React.MouseEvent) => {
    if (!imageRef.current || (!isDragging && !resizeDirection)) return;
    
    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();
    
    // Skaičiuojame mastelio koeficientą
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Skaičiuojame pelės poziciją paveikslėlio koordinačių sistemoje
    const mouseX = (e.clientX - imgRect.left) * scaleX;
    const mouseY = (e.clientY - imgRect.top) * scaleY;
    
    if (isDragging) {
      // Judinti visą stačiakampį
      const offsetX = dragStart.x * scaleX;
      const offsetY = dragStart.y * scaleY;
      
      const newX = mouseX - offsetX;
      const newY = mouseY - offsetY;
      
      // Ribos, kad neišeitume už vaizdo
      const x = Math.max(0, Math.min(newX, img.naturalWidth - cropRect.width));
      const y = Math.max(0, Math.min(newY, img.naturalHeight - cropRect.height));
      
      setCropRect({ ...cropRect, x, y });
    } else if (resizeDirection) {
      // Keisti stačiakampio dydį
      let newRect = { ...cropRect };
      const minSize = 50; // Minimalus dydis
      
      switch (resizeDirection) {
        case 'se': // pietryčiai (bottom-right)
          newRect.width = Math.max(minSize, Math.min(mouseX - cropRect.x, img.naturalWidth - cropRect.x));
          newRect.height = Math.max(minSize, Math.min(mouseY - cropRect.y, img.naturalHeight - cropRect.y));
          break;
        case 'sw': // pietvakariai (bottom-left)
          const newWidthSW = Math.max(minSize, cropRect.x + cropRect.width - mouseX);
          const newXSW = Math.max(0, Math.min(mouseX, cropRect.x + cropRect.width - minSize));
          newRect.width = newWidthSW;
          newRect.x = newXSW;
          newRect.height = Math.max(minSize, Math.min(mouseY - cropRect.y, img.naturalHeight - cropRect.y));
          break;
        case 'ne': // šiaurės rytai (top-right)
          newRect.width = Math.max(minSize, Math.min(mouseX - cropRect.x, img.naturalWidth - cropRect.x));
          const newHeightNE = Math.max(minSize, cropRect.y + cropRect.height - mouseY);
          const newYNE = Math.max(0, Math.min(mouseY, cropRect.y + cropRect.height - minSize));
          newRect.height = newHeightNE;
          newRect.y = newYNE;
          break;
        case 'nw': // šiaurės vakarai (top-left)
          const newWidthNW = Math.max(minSize, cropRect.x + cropRect.width - mouseX);
          const newXNW = Math.max(0, Math.min(mouseX, cropRect.x + cropRect.width - minSize));
          const newHeightNW = Math.max(minSize, cropRect.y + cropRect.height - mouseY);
          const newYNW = Math.max(0, Math.min(mouseY, cropRect.y + cropRect.height - minSize));
          newRect.width = newWidthNW;
          newRect.x = newXNW;
          newRect.height = newHeightNW;
          newRect.y = newYNW;
          break;
      }
      
      setCropRect(newRect);
    }
  };
  
  // Pradėti dydžio keitimą
  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeDirection(direction);
  };
  
  // Baigti tempiamą veiksmą
  const handleCropEnd = () => {
    setIsDragging(false);
    setResizeDirection(null);
  };
  
  // Funkcija nuotraukos įkėlimui į serverį
  const uploadImage = async (imageData: string) => {
    setLoading(true);
    
    try {
      // Konvertuojame data URL į Blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Sukuriame unikalų failo pavadinimą
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      // Įkeliame į Supabase
      const { error } = await supabase.storage
        .from('location-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (error) throw error;
      
      // Gauname viešą URL
      const { data: urlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);
      
      // Perduodame URL tėviniam komponentui
      onImageUploaded(urlData.publicUrl);
      
      // Išvalome būseną
      setCroppingImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Klaida įkeliant paveikslėlį:', error);
      alert('Nepavyko įkelti paveikslėlio. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funkcija apkarpymo patvirtinimui
  const handleCropConfirm = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Nustatome canvas dydį pagal apkarpymo stačiakampį
    // Maksimalus dydis - 800px
    const maxSize = 800;
    let targetWidth, targetHeight;
    
    if (cropRect.width > cropRect.height) {
      targetWidth = Math.min(cropRect.width, maxSize);
      targetHeight = (cropRect.height / cropRect.width) * targetWidth;
    } else {
      targetHeight = Math.min(cropRect.height, maxSize);
      targetWidth = (cropRect.width / cropRect.height) * targetHeight;
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Piešiame nuotrauką į canvas
    ctx.drawImage(
      img,
      cropRect.x, cropRect.y, cropRect.width, cropRect.height,
      0, 0, targetWidth, targetHeight
    );
    
    // Gauname sumaižintą ir optimizuotą paveikslėlį
    const optimizedImage = canvas.toDataURL('image/jpeg', 0.85);
    
    // Įkeliame į serverį
    uploadImage(optimizedImage);
  };
  
  // Pradėti įkėlimą
  const startUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Nuotraukos užkrovimo apdorojimas
  const handleImageLoad = () => {
    if (imageRef.current) {
      initCropRect();
      
      // Apskaičiuojame mastelio koeficientą
      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();
      setImageScale({
        x: img.naturalWidth / imgRect.width,
        y: img.naturalHeight / imgRect.height
      });
    }
  };
  
  // Atstatyti apkarpymo stačiakampį
  const resetCropRect = () => {
    initCropRect();
  };
  
  return (
    <div>
      {/* Paslėptas failo pasirinkimo input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      {/* Mygtukas nuotraukos pasirinkimui */}
      {!croppingImage && !loading && (
        <button
          onClick={startUpload}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          Pasirinkti ir įkelti nuotrauką
        </button>
      )}
      
      {/* Kraunasi */}
      {loading && (
        <div className="text-center py-6">
          <Loader className="mx-auto h-10 w-10 text-blue-500 animate-spin" />
          <p className="mt-2 text-gray-600">Įkeliama nuotrauka...</p>
        </div>
      )}
      
      {/* Nuotraukos redagavimas */}
      {croppingImage && !loading && (
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-2">
            Tempkite kvadratą, kad pasirinktumėte nuotraukos dalį. Kvadrato kampus galite tempti, kad keistumėte dydį.
          </p>
          
          <div 
            ref={containerRef}
            className="relative border rounded-md overflow-hidden mb-3"
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            <img
              ref={imageRef}
              src={croppingImage}
              alt="Nuotrauka"
              className="w-full"
              onLoad={handleImageLoad}
            />
            
            {/* Apkarpymo stačiakampis */}
            <div 
              ref={cropFrameRef}
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 cursor-move"
              style={{
                left: `${cropRect.x / imageScale.x}px`,
                top: `${cropRect.y / imageScale.y}px`,
                width: `${cropRect.width / imageScale.x}px`,
                height: `${cropRect.height / imageScale.y}px`,
              }}
              onMouseDown={handleCropStart}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Move size={24} className="text-white drop-shadow-lg opacity-50" />
              </div>
              
              {/* Kampų tempikliai */}
              <div 
                className="absolute w-6 h-6 -right-2 -bottom-2 cursor-se-resize bg-white bg-opacity-50 rounded-full border-2 border-blue-500" 
                onMouseDown={(e) => handleResizeStart('se', e)}
              ></div>
              <div 
                className="absolute w-6 h-6 -left-2 -bottom-2 cursor-sw-resize bg-white bg-opacity-50 rounded-full border-2 border-blue-500" 
                onMouseDown={(e) => handleResizeStart('sw', e)}
              ></div>
              <div 
                className="absolute w-6 h-6 -right-2 -top-2 cursor-ne-resize bg-white bg-opacity-50 rounded-full border-2 border-blue-500" 
                onMouseDown={(e) => handleResizeStart('ne', e)}
              ></div>
              <div 
                className="absolute w-6 h-6 -left-2 -top-2 cursor-nw-resize bg-white bg-opacity-50 rounded-full border-2 border-blue-500" 
                onMouseDown={(e) => handleResizeStart('nw', e)}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-500">
              Tempkite kampus, kad pakeistumėte dydį
            </p>
            
            <button 
              onClick={resetCropRect}
              className="text-xs text-blue-500 flex items-center"
            >
              <Maximize2 size={14} className="mr-1" />
              Atstatyti
            </button>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCroppingImage(null)}
              className="py-1 px-3 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              <X size={16} className="inline mr-1" />
              Atšaukti
            </button>
            <button
              onClick={handleCropConfirm}
              className="py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Check size={16} className="inline mr-1" />
              Įkelti nuotrauką
            </button>
          </div>
          
          {/* Paslėptas canvas optimizavimui */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default OneStepImageUploader;
