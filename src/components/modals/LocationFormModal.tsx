import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Location, LocationCategory } from '../../types';
import ImageUpload from '../ImageUpload';
import { supabase } from '../../lib/supabase';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: any) => void;
  currentPosition?: [number, number];
  location?: Location;
  isEditing: boolean;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPosition,
  location,
  isEditing
}) => {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(55.1694); // Default to Lithuania center
  const [longitude, setLongitude] = useState(23.8813);
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [userId, setUserId] = useState<string>('anonymous');

  // Initialize form with location data when editing
  useEffect(() => {
    if (isEditing && location) {
      setName(location.name);
      setDescription(location.description || '');
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setCategories(location.categories);
      setIsPublic(location.is_public);
      setIsPaid(location.is_paid);
      setImages(location.images || []);
      setMainImageIndex(location.main_image_index || 0);
    } else if (currentPosition) {
      setLatitude(currentPosition[0]);
      setLongitude(currentPosition[1]);
    }

    // Get current user ID
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };

    getUserId();
  }, [isEditing, location, currentPosition, isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!name.trim()) {
      alert('Prašome įvesti vietos pavadinimą');
      return;
    }

    try {
      // Create the location object
      const locationData = {
        name: name.trim(),
        description: description.trim(),
        latitude,
        longitude,
        categories,
        is_public: isPublic,
        is_paid: isPaid,
        images,
        main_image_index: mainImageIndex
      };

      // If editing, preserve the ID and other fields
      if (isEditing && location) {
        onSave({
          ...location,
          ...locationData
        });
      } else {
        onSave(locationData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving location:", error);
      alert('Nepavyko išsaugoti vietos. Bandykite dar kartą.');
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

  // Handle adding an image URL
  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    
    // Simple validation for image URL
    if (!imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      alert('Prašome įvesti teisingą nuotraukos URL');
      return;
    }
    
    setImages([...images, imageUrl]);
    setImageUrl('');
  };

  // Handle adding image from uploaded one
  const handleAddUploadedImage = (imageUrl: string) => {
    if (imageUrl) {
      setImages([...images, imageUrl]);
      setShowImageUpload(false);
    }
  };

  // Handle removing an image
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Update main image index if needed
    if (mainImageIndex >= newImages.length) {
      setMainImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  // Handle setting main image
  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Redaguoti vietą' : 'Pridėti naują vietą'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pavadinimas *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aprašymas
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          {/* Coordinates */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platuma *
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ilguma *
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategorijos
            </label>
            <div className="grid grid-cols-2 gap-2">
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

          {/* Status checkboxes */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="is_public"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
                className="mr-2"
              />
              <label htmlFor="is_public" className="text-sm">
                Vieša teritorija
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_paid"
                checked={isPaid}
                onChange={() => setIsPaid(!isPaid)}
                className="mr-2"
              />
              <label htmlFor="is_paid" className="text-sm">
                Mokama vieta
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuotraukos
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Įveskite nuotraukos URL"
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
              >
                Pridėti
              </button>
            </div>

            {/* Image gallery */}
            {images.length > 0 && (
              <div>
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-gray-500">
                    Nuotraukų: {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                    className="text-blue-500 flex items-center text-sm"
                  >
                    {imageDropdownOpen ? "Suskleisti" : "Rodyti visas"}
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform ${
                        imageDropdownOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {imageDropdownOpen && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Vietos nuotrauka ${index + 1}`}
                          className={`w-full h-24 object-cover rounded ${
                            mainImageIndex === index
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(index)}
                            className="bg-blue-500 text-white p-1 rounded-md text-xs mr-1"
                            title="Nustatyti kaip pagrindinę"
                          >
                            Pagrindinė
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="bg-red-500 text-white p-1 rounded-md text-xs"
                            title="Ištrinti nuotrauką"
                          >
                            Ištrinti
                          </button>
                        </div>
                        {mainImageIndex === index && (
                          <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs p-1">
                            Pagrindinė
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Advanced image upload */}
            <div className="mb-2">
              <button 
                type="button"
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="text-blue-500 flex items-center text-sm"
              >
                {showImageUpload ? "Slėpti nuotraukos įkėlimą" : "Įkelti / Fotografuoti"} 
                <ChevronDown
                  size={16}
                  className={`ml-1 transition-transform ${
                    showImageUpload ? "transform rotate-180" : ""
                  }`}
                />
              </button>
            </div>
            
            {showImageUpload && (
              <div className="mb-4 p-3 border rounded-md bg-gray-50">
                <ImageUpload 
                  onImageUploaded={handleAddUploadedImage} 
                  userId={userId}
                />
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Atšaukti
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {isEditing ? "Išsaugoti pakeitimus" : "Pridėti vietą"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationFormModal;
