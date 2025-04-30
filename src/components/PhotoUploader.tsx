
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera, Image } from "lucide-react";
import { useCamera } from "@/hooks/use-camera";
import { useIsMobile } from "@/hooks/use-mobile";

interface PhotoUploaderProps {
  photoUrls: string[];
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement> | string[]) => void;
  onRemovePhoto: (index: number) => void;
  label?: string;
  disabled?: boolean;
  bucketName?: string;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoUrls,
  onAddPhotos,
  onRemovePhoto,
  label = "Photos",
  disabled = false,
  bucketName = "photos"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { takeAndUploadPhoto, selectAndUploadPhoto, isUploading } = useCamera(bucketName);

  // Function to handle native camera capture
  const handleTakePhoto = async () => {
    if (disabled || isUploading) return;
    
    const photoUrl = await takeAndUploadPhoto();
    if (photoUrl) {
      if (typeof onAddPhotos === 'function') {
        // If the function accepts string arrays
        if (onAddPhotos.length === 1) {
          onAddPhotos([photoUrl]);
        } else {
          // Create a synthetic event
          const syntheticEvent = {
            target: {
              files: [
                new File([''], photoUrl, { type: 'image/jpeg' })
              ]
            },
            currentTarget: {
              files: [
                new File([''], photoUrl, { type: 'image/jpeg' })
              ]
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onAddPhotos(syntheticEvent);
        }
      }
    }
  };

  // Function to handle photo selection from gallery
  const handleSelectPhoto = async () => {
    if (disabled || isUploading) return;
    
    const photoUrl = await selectAndUploadPhoto();
    if (photoUrl) {
      if (typeof onAddPhotos === 'function') {
        // If the function accepts string arrays
        if (onAddPhotos.length === 1) {
          onAddPhotos([photoUrl]);
        } else {
          // Create a synthetic event
          const syntheticEvent = {
            target: {
              files: [
                new File([''], photoUrl, { type: 'image/jpeg' })
              ]
            },
            currentTarget: {
              files: [
                new File([''], photoUrl, { type: 'image/jpeg' })
              ]
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onAddPhotos(syntheticEvent);
        }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>{label}</Label>
        
        {isMobile ? (
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTakePhoto}
              disabled={disabled || isUploading}
            >
              <Camera className="w-4 h-4 mr-2" /> Prendre photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectPhoto}
              disabled={disabled || isUploading}
            >
              <Image className="w-4 h-4 mr-2" /> Gallerie
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Upload className="w-4 h-4 mr-2" /> Ajouter des photos
          </Button>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={onAddPhotos as (e: React.ChangeEvent<HTMLInputElement>) => void}
          disabled={disabled || isUploading}
        />
      </div>
      
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {photoUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url} 
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-md border border-border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {isUploading && <p className="text-sm text-gray-500 mt-2">Téléchargement en cours...</p>}
    </div>
  );
};

export default PhotoUploader;
