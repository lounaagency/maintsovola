
import React, { useRef } from 'react';
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, X } from 'lucide-react';

interface TerrainPhotoUploadProps {
  photoUrls: string[];
  onPhotoAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: (index: number) => void;
}

const TerrainPhotoUpload: React.FC<TerrainPhotoUploadProps> = ({
  photoUrls,
  onPhotoAdd,
  onPhotoRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FormLabel>Photos du terrain</FormLabel>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Ajouter des photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPhotoAdd}
        />
      </div>
      
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {photoUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url} 
                alt={`Terrain photo ${index + 1}`} 
                className="w-full h-32 object-cover rounded-md border border-border"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onPhotoRemove(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TerrainPhotoUpload;
