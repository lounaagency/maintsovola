
import React, { useState, useRef } from "react";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { TerrainFormData } from "@/types/terrainForm";

interface ValidationFormProps {
  form: UseFormReturn<TerrainFormData>;
  photoValidationUrls: string[];
  setPhotoValidationUrls: React.Dispatch<React.SetStateAction<string[]>>;
  validationPhotos: File[];
  setValidationPhotos: React.Dispatch<React.SetStateAction<File[]>>;
}

const ValidationForm: React.FC<ValidationFormProps> = ({
  form,
  photoValidationUrls,
  setPhotoValidationUrls,
  validationPhotos,
  setValidationPhotos
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const validationFileInputRef = useRef<HTMLInputElement>(null);
  
  const handleValidationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setValidationPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoValidationUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };
  
  const removeValidationPhoto = (index: number) => {
    setValidationPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    
    setPhotoValidationUrls(prevUrls => {
      const newUrls = [...prevUrls];
      
      // Only revoke if it's a blob URL (newly added photo)
      if (newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      
      newUrls.splice(index, 1);
      return newUrls;
    });
  };
  
  return (
    <div className="space-y-6 border-t pt-6 mt-6">
      <h3 className="text-lg font-medium">Rapport de validation</h3>
      
      <FormField
        control={form.control}
        name="date_validation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de validation</FormLabel>
            <FormControl>
              <Input 
                type="date" 
                {...field}
                value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : field.value || format(new Date(), 'yyyy-MM-dd')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="rapport_validation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rapport de validation</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Saisissez votre rapport de validation ici..." 
                className="h-32"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="validation_decision"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Décision</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                defaultValue="valider"
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="valider" id="valider" />
                  <Label htmlFor="valider" className="font-normal">Valider</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejetter" id="rejetter" />
                  <Label htmlFor="rejetter" className="font-normal">Rejeter</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <FormLabel>Photos de validation</FormLabel>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => validationFileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter des photos
          </Button>
          <input
            ref={validationFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleValidationFileChange}
          />
        </div>
        
        {photoValidationUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {photoValidationUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Validation photo ${index + 1}`} 
                  className="w-full h-24 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeValidationPhoto(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationForm;
