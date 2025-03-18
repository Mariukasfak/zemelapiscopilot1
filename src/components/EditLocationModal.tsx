import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import { Location, LocationCategory } from '../types';
import { supabase } from '../lib/supabase';
import SimpleImageUploader from './SimpleImageUploader';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Location) => void;
  location: Location;
}

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  location
}) => {
  // Form state
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description || '');
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [categories, setCategories] = useState<LocationCategory[]>(location.categories);
  const [isPublic, setIsPublic] = useState(location.is_public);
  const [isPaid, setIsPaid] = useState(location.is_paid);
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(location.main_image_index || 0);
  
  // Pridedame forceRenderKey, kad priverstume perpiešti kai kurių komponentų atvaizdavimą
  const [forceRenderKey, setForceRenderKey] = useState<number>(Date.now());
  const forceUpdate = useCallback(() => setForceRenderKey(Date.now()), []);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Reset form and images when location changes
  useEffect(() => {
    if (location) {
      setName(location.name);
      setDescription(location.description || '');
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setCategories(location.categories);
      setIsPublic(location.is_public);
      setIsPaid(location.is_paid);
      
      // Saugiai kopijuojame nuotraukų masyvą
      const locationImages = Array.isArray(location.images) ? [...location.images] : [];
      setImages(locationImages);
      
      setMainImageIndex(location.main_image_index || 0);

      // Forsuojame perpiešimą
      setTimeout(() => {
        forceUpdate();
      }, 100);
    }
  }, [location, forceUpdate]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
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
    { value: 'extreme', label: 'Ekstremalaus sporto vieta' },
    { value: 'ad', label: 'Reklama' }
  ];
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Užtikriname, kad images yra saugus masyvas
    const safeImages = [...images];
    
    console.log("Submitting images:", safeImages);
    
    if (!name || !latitude || !longitude) {
      alert('Prašome užpildyti visus privalomus laukus');
      return;
    }
    
    try {
      onSave({
        ...location,
        name,
        description,
        latitude,
        longitude,
        categories,
        is_public: isPublic,
        is_paid: isPaid,
        images: safeImages,
        main_image_index: mainImageIndex < 0 || mainImageIndex >= safeImages.length ? 0 : mainImageIndex
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Nepavyko išsaugoti pakeitimų");
    }
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
    
    // Sukuriame naują masyvą su pridėta nuotrauka
    const updatedImages = [...images, imageUrl];
    setImages(updatedImages);
    setImageUrl('');
    
    // Priverstinai atnaujiname UI
    forceUpdate();
    
    console.log("URL added to images:", updatedImages);
  };
  
  // Handle image upload completion - supaprastinta
  const handleImageUploaded = useCallback((imageUrl: string) => {
    console.log("Gauta nuotrauka:", imageUrl);
    
    setImages(prevImages => {
      const newImages = [...prevImages, imageUrl];
      console.log("Images state updated:", newImages);
      return newImages;
    });
    
    setShowImageUploader(false);
    
    // Priverstinai atnaujiname UI po trumpo delsimo
    setTimeout(() => {
      forceUpdate();
    }, 50);
  }, [forceUpdate]);
  
  // Handle removing image
  const handleRemoveImage = useCallback((urlToRemove: string) => {
    console.log("Removing image:", urlToRemove);
    
    setImages(prevImages => {
      const filteredImages = prevImages.filter(url => url !== urlToRemove);
      
      // Atnaujiname pagrindinės nuotraukos indeksą, jei reikia
      if (mainImageIndex >= filteredImages.length) {
        setMainImageIndex(Math.max(0, filteredImages.length - 1));
      }
      
      console.log("Images after removal:", filteredImages);
      return filteredImages;
    });
    
    // Priverstinai atnaujiname UI
    forceUpdate();
  }, [mainImageIndex, forceUpdate]);
  
  // Handle setting main image
  const handleSetMainImage = useCallback((index: number) => {
    console.log("Setting main image index:", index);
    setMainImageIndex(index);
  }, []);
  
  // Pridedame debuginimo useEffect
  useEffect(() => {
    console.log("Images state updated:", images);
  }, [images]);

  // Logging for render key
  useEffect(() => {
    console.log("Component re-rendered with key:", forceRenderKey);
  }, [forceRenderKey]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Redaguoti vietą</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

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
            
            {/* Nuotraukos įkėlimo mygtukas */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowImageUploader(!showImageUploader)}
                className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md w-full"
              >
                <Upload size={16} className="mr-2" />
                {showImageUploader ? 'Uždaryti įkėlimą' : 'Pridėti naują nuotrauką'}
              </button>
            </div>

            {/* Image uploader */}
            {showImageUploader && (
              <div className="mb-4">
                <SimpleImageUploader
                  onImageUploaded={handleImageUploaded}
                  userId={user?.id}
                />
              </div>
            )}
            
            {/* Image gallery - patobulinta versija */}
            <div className="image-gallery" key={`gallery-${forceRenderKey}`}>
              {Array.isArray(images) && images.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Pasirinkite pagrindinę nuotrauką. Viso: {images.length}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {images.map((url, index) => {
                      // Patikriname, ar URL yra galiojantis
                      const safeUrl = typeof url === 'string' ? url : '';
                      
                      // Sukuriame unikalų raktą iš URL galo arba indekso
                      const uniqueKey = safeUrl 
                        ? `img-${index}-${safeUrl.substring(Math.max(0, safeUrl.length - 20))}`
                        : `img-${index}-${forceRenderKey}`;
                      
                      return (
                        <div 
                          key={uniqueKey} 
                          className="relative border rounded-md overflow-hidden"
                        >
                          <img
                            src={safeUrl}
                            alt={`Nuotrauka ${index + 1}`}
                            className={`w-full h-24 object-cover ${mainImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => handleSetMainImage(index)}
                          />
                          <div className="absolute top-1 right-1 flex space-x-1">
                            {mainImageIndex === index && (
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <span aria-hidden="true">★</span>
                                <span className="sr-only">Pagrindinė nuotrauka</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(safeUrl)}
                              className="bg-red-500 text-white rounded-full p-1"
                              aria-label="Pašalinti nuotrauką"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nėra pridėtų nuotraukų</p>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default EditLocationModal;