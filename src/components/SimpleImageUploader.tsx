import React from 'react';
import SimpleCropUploader from './SimpleCropUploader';

interface SimpleImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  userId?: string;
}

// Šis komponentas yra tik wrapper aplink naują SimpleCropUploader
// kad išlaikytume atgalinį suderinamumą
const SimpleImageUploader: React.FC<SimpleImageUploaderProps> = ({ onImageUploaded, userId }) => {
  return (
    <SimpleCropUploader 
      onImageUploaded={onImageUploaded} 
      userId={userId} 
    />
  );
};

export default SimpleImageUploader;
