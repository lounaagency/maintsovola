import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { TerrainData } from "@/types/terrain";
import { toast } from "sonner";

interface ValidationFormProps {
  form: UseFormReturn<any>;
  validationPhotos: File[];
  setValidationPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  photoValidationUrls: string[];
  setPhotoValidationUrls: React.Dispatch<React.SetStateAction<string[]>>;
  terrain: TerrainData;
}

const ValidationForm: React.FC<ValidationFormProps> = ({
  form,
  validationPhotos,
  setValidationPhotos,
  photoValidationUrls,
  setPhotoValidationUrls,
  terrain
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputContractRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setValidationPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoValidationUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };

  const removePhoto = (index: number) => {
    setValidationPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });

    setPhotoValidationUrls(prevUrls => {
      const newUrls = [...prevUrls];
      
      if (newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }

    form.setValue('contrat_signe', file);
  };

  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-md bg-muted/50 mb-6">
        <h3 className="font-medium mb-2">Informations du terrain</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom du terrain:</p>
            <p className="font-medium">{terrain.nom_terrain}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Surface proposée:</p>
            <p className="font-medium">{terrain.surface_proposee} hectares</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Localisation:</p>
            <p className="font-medium">{terrain.commune_name}, {terrain.district_name}, {terrain.region_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Agriculteur:</p>
            <p className="font-medium">{terrain.tantsahaNom}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accès à l'eau:</p>
            <p className="font-medium">{terrain.acces_eau ? 'Oui' : 'Non'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accès à la route:</p>
            <p className="font-medium">{terrain.acces_route ? 'Oui' : 'Non'}</p>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="surface_validee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surface validée (hectares)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                value={field.value || 0}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date_validation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de validation</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
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
                placeholder="Entrez votre rapport de validation ici..."
                className="min-h-[120px]"
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
            <FormLabel>Décision de validation</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="valider" id="validation-valider" />
                  <Label htmlFor="validation-valider">Valider le terrain</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejetter" id="validation-rejetter" />
                  <Label htmlFor="validation-rejetter">Rejeter le terrain</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contrat_signe"
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel>Contrat signé (PDF uniquement)</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  ref={fileInputContractRef}
                  accept=".pdf"
                  onChange={handleContractFileChange}
                  className="hidden"
                  required
                  {...field}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputContractRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger le contrat signé
                </Button>
                {form.watch('contrat_signe') && (
                  <span className="text-sm text-muted-foreground">
                    {(form.watch('contrat_signe') as File).name}
                  </span>
                )}
              </div>
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
            onChange={handleFileChange}
          />
        </div>
        
        {photoValidationUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {photoValidationUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Validation photo ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
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
