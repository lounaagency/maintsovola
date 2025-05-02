
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera } from "lucide-react";
import { cameraService } from "@/services/CameraService";
import { useToast } from "@/hooks/use-toast";
import { isMobile } from "@/utils/deviceDetection";

interface PhotoUploaderProps {
  photoUrls: string[];
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  label?: string;
  disabled?: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoUrls,
  onAddPhotos,
  onRemovePhoto,
  label = "Photos",
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (disabled) return;
    
    try {
      setIsCapturing(true);
      
      // Check if we're running on a mobile device with Capacitor
      if (isMobile()) {
        const permissions = await cameraService.checkPermissions();
        
        if (permissions.camera !== 'granted') {
          await cameraService.requestPermissions();
        }
        
        const photo = await cameraService.takePicture();
        
        if (photo && photo.webPath) {
          // Create a new File object from the photo
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          
          const file = new File([blob], `photo_${Date.now()}.jpeg`, {
            type: 'image/jpeg',
          });
          
          // Create a synthetic event to pass to onAddPhotos
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          const syntheticEvent = {
            target: {
              files: dataTransfer.files
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          
          onAddPhotos(syntheticEvent);
        }
      } else {
        // Fall back to regular file input on desktop
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de capturer une photo",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>{label}</Label>
        <div className="flex space-x-2">
          {isMobile() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCapture}
              disabled={disabled || isCapturing}
            >
              <Camera className="w-4 h-4 mr-2" /> Prendre une photo
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="w-4 h-4 mr-2" /> {isMobile() ? "Galerie" : "Ajouter des photos"}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={onAddPhotos}
          disabled={disabled}
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
    </div>
  );
};

export default PhotoUploader;
