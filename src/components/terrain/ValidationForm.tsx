
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
import { Upload, X, Loader2, MapPin, Droplets, Route } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UseFormReturn } from "react-hook-form";
import { TerrainFormData, TerrainData } from "@/types/terrain";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ValidationFormProps {
  form: UseFormReturn<TerrainFormData>;
  photoValidationUrls: string[];
  setPhotoValidationUrls: React.Dispatch<React.SetStateAction<string[]>>;
  validationPhotos: File[];
  setValidationPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  terrain: TerrainData;
}

const ValidationForm: React.FC<ValidationFormProps> = ({
  form,
  photoValidationUrls,
  setPhotoValidationUrls,
  validationPhotos,
  setValidationPhotos,
  terrain
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

  // Convert photos string to array if needed
  const photoArray = React.useMemo(() => {
    if (!terrain.photos) return [];
    return typeof terrain.photos === 'string'
      ? terrain.photos.split(',').filter(url => url.trim() !== '')
      : terrain.photos.filter(url => url !== '');
  }, [terrain.photos]);
  
  // Prepare polygon coordinates for the map
  const polygonCoordinates = React.useMemo(() => {
    if (!terrain.geom) return [];
    
    try {
      const geomData = typeof terrain.geom === 'string' 
        ? JSON.parse(terrain.geom) 
        : terrain.geom;
        
      if (geomData && geomData.coordinates && geomData.coordinates[0]) {
        // Convert GeoJSON format to LatLngExpression[]
        return geomData.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      }
    } catch (error) {
      console.error("Error parsing polygon geometry:", error);
    }
    
    return [];
  }, [terrain.geom]);

  // Set surface_validee to surface_proposee initially if not set
  React.useEffect(() => {
    if (typeof form.getValues().surface_validee === 'undefined' && terrain.surface_proposee) {
      form.setValue('surface_validee', terrain.surface_proposee);
    }
  }, [form, terrain.surface_proposee]);
  
  return (
    <div className="space-y-6">
      {/* Terrain Summary Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{terrain.nom_terrain}</h3>
              <p className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                {terrain.region_name || 'N/A'}, {terrain.district_name || 'N/A'}, {terrain.commune_name || 'N/A'}
              </p>
              
              <div className="flex space-x-4 mt-2">
                <div className="flex items-center">
                  <Droplets className={`w-4 h-4 mr-1 ${terrain.acces_eau ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm">{terrain.acces_eau ? 'Accès à l\'eau' : 'Pas d\'accès à l\'eau'}</span>
                </div>
                <div className="flex items-center">
                  <Route className={`w-4 h-4 mr-1 ${terrain.acces_route ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm">{terrain.acces_route ? 'Accès routier' : 'Pas d\'accès routier'}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium">Surface proposée: {terrain.surface_proposee} ha</p>
                <div className="text-sm mt-1.5">
                  <span className="font-medium">Propriétaire:</span> {terrain.tantsahaNom || 'Non spécifié'}
                </div>
                {terrain.techniqueNom && (
                  <div className="text-sm mt-1">
                    <span className="font-medium">Technicien:</span> {terrain.techniqueNom}
                  </div>
                )}
              </div>
              
              {photoArray.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Photos existantes:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {photoArray.slice(0, 6).map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img 
                          src={url} 
                          alt={`Terrain ${index + 1}`} 
                          className="h-16 w-full object-cover rounded-md border border-border"
                        />
                      </a>
                    ))}
                    {photoArray.length > 6 && (
                      <div className="flex items-center justify-center h-16 w-full bg-muted rounded-md">
                        <span className="text-xs text-muted-foreground">+{photoArray.length - 6} photos</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-[200px]">
              {polygonCoordinates.length > 0 ? (
                <MapContainer
                  bounds={polygonCoordinates}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polygon 
                    positions={polygonCoordinates}
                    pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full w-full bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-sm text-gray-500">Aucune géométrie définie</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-lg font-medium">Formulaire de validation</h3>
      
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
                value={field.value || terrain.surface_proposee}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || terrain.surface_proposee)}
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
              <Input 
                type="date" 
                {...field}
                value={typeof field.value === 'string' ? field.value : 
                      field.value ? format(field.value, 'yyyy-MM-dd') : 
                      format(new Date(), 'yyyy-MM-dd')}
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
            title="Ajouter des photos"
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
                  title="Supprimer la photo"
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
