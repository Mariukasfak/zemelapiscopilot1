import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Loader, X, Check } from 'lucide-react';

interface SimpleCropUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

const SimpleCropUploader: React.FC<SimpleCropUploaderProps> = ({ onImageUploaded, userId = 'anonymous' }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Funkcija failo pasirinkimui
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Sukuriame peržiūrą
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Patobulinkime uploadImage funkciją
  const uploadImage = async () => {
    if (!preview || !file) return;
    
    setLoading(true);
    
    try {
      // Generuojame tikrai unikalų ID su timestamp ir random skaičiumi
      const randomId = Math.floor(Math.random() * 1000000);
      const timestamp = Date.now();
      const uniqueId = `${timestamp}-${randomId}`;
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${uniqueId}.${fileExt}`;
      
      // Konvertuojame Data URL į Blob
      let blob: Blob;
      try {
        const response = await fetch(preview);
        blob = await response.blob();
      } catch (error) {
        console.error('Klaida konvertuojant nuotrauką:', error);
        blob = file; // Fallback to original file
      }
      
      // Įkeliame į Supabase
      const { error } = await supabase.storage
        .from('location-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true, // Čia pakeitėme į true, kad perrašytų, jei toks failas jau yra
          contentType: file.type || 'image/jpeg'
        });
      
      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }
      
      // Gauname viešą URL
      const { data: urlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      const finalUrl = urlData.publicUrl;
      console.log("Returning image URL:", finalUrl);
      
      // Išvalome būseną prieš iškvietimą callback
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Perduodame URL tėviniam komponentui - be timeout
      onImageUploaded(finalUrl);
      
    } catch (error) {
      console.error('Klaida įkeliant nuotrauką:', error);
      alert('Nepavyko įkelti nuotraukos. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };
  
  // Atšaukti įkėlimą
  const cancelUpload = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      {!preview ? (
        // Nuotraukos pasirinkimo mygtukas
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          <Upload size={18} className="mr-2" />
          Pasirinkti nuotrauką
        </button>
      ) : loading ? (
        // Įkėlimo indikatorius
        <div className="text-center py-4">
          <Loader size={24} className="mx-auto animate-spin text-blue-500" />
          <p className="mt-2 text-sm text-gray-600">Įkeliama nuotrauka...</p>
        </div>
      ) : (
        // Nuotraukos peržiūra ir patvirtinimo mygtukai
        <div>
          <div className="border rounded-md overflow-hidden mb-3">
            <img
              src={preview}
              alt="Pasirinkta nuotrauka"
              className="w-full object-contain max-h-48"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={cancelUpload}
              className="py-1 px-3 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              <X size={16} className="inline mr-1" />
              Atšaukti
            </button>
            <button
              type="button"
              onClick={uploadImage}
              className="py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Check size={16} className="inline mr-1" />
              Įkelti nuotrauką
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCropUploader;
