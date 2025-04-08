import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TerrainData, TerrainFormData } from "@/types/terrain";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X, Upload, ImageIcon } from "lucide-react";

interface ValidationFormProps {
  form: UseFormReturn<any>;
  photoValidationUrls: string[];
  setPhotoValidationUrls: (urls: string[]) => void;
  validationPhotos: File[];
  setValidationPhotos: (photos: File[]) => void;
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
  const [mapInitialized, setMapInitialized] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Extract polygon coordinates from terrain data
  const getPolygonCoordinates = () => {
    if (!terrain.geom) return [];
    
    try {
      let coordinates = [];
      if (typeof terrain.geom === 'string') {
        const geomObj = JSON.parse(terrain.geom);
        if (geomObj && geomObj.coordinates && geomObj.coordinates[0]) {
          coordinates = geomObj.coordinates[0];
        }
      } else if (terrain.geom.coordinates && terrain.geom.coordinates[0]) {
        coordinates = terrain.geom.coordinates[0];
      }
      
      // Convert to Leaflet's [lat, lng] format from GeoJSON's [lng, lat]
      return coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    } catch (error) {
      console.error("Error parsing polygon geometry:", error);
      return [];
    }
  };
  
  const polygonCoordinates = getPolygonCoordinates();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setValidationPhotos([...validationPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoValidationUrls([...photoValidationUrls, previewUrl]);
    });
  };
  
  const removePhoto = (index: number) => {
    const newPhotos = [...validationPhotos];
    newPhotos.splice(index, 1);
    setValidationPhotos(newPhotos);

    const newUrls = [...photoValidationUrls];
    // Only revoke if it's a blob URL (newly added photo)
    if (newUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(newUrls[index]);
    }
    newUrls.splice(index, 1);
    setPhotoValidationUrls(newUrls);
  };
  
  // Parse photos for display
  const getTerrainPhotos = () => {
    if (!terrain.photos) return [];
    
    if (typeof terrain.photos === 'string') {
      return terrain.photos.split(',').filter(url => url.trim() !== '');
    }
    
    return Array.isArray(terrain.photos) ? terrain.photos.filter(url => url && url.trim() !== '') : [];
  };
  
  const terrainPhotos = getTerrainPhotos();

  return (
    <div>
      <div className="space-y-8">
        <div className="bg-muted/30 rounded-lg p-4 border">
          <h3 className="font-semibold mb-2">Détails du terrain</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Nom du terrain</p>
              <p className="text-base">{terrain.nom_terrain}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Surface proposée</p>
              <p className="text-base">{terrain.surface_proposee} hectares</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Localisation</p>
              <p className="text-base">{terrain.region_name}, {terrain.district_name}, {terrain.commune_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Accès</p>
              <div className="flex gap-2">
                {terrain.acces_eau && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Eau</span>
                )}
                {terrain.acces_route && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">Route</span>
                )}
                {!terrain.acces_eau && !terrain.acces_route && (
                  <span className="text-muted-foreground text-sm">Aucun accès spécifié</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Propriétaire</p>
              <p className="text-base">{terrain.tantsahaNom || 'Non spécifié'}</p>
            </div>
            {terrain.id_technicien && (
              <div>
                <p className="text-sm font-medium mb-1">Technicien</p>
                <p className="text-base">{terrain.techniqueNom}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Carte du terrain */}
        <div>
          <h3 className="font-semibold mb-2">Emplacement du terrain</h3>
          {polygonCoordinates.length > 0 ? (
            <div className="border rounded-md overflow-hidden" style={{ height: '300px' }}>
              <MapContainer
                center={polygonCoordinates[0] as [number, number]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                whenReady={() => setMapInitialized(true)}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {polygonCoordinates.length >= 3 && (
                  <Polygon
                    positions={polygonCoordinates as [number, number][]}
                    pathOptions={{ color: '#ff4444', weight: 2, fillOpacity: 0.5, fillColor: '#ff4444' }}
                  />
                )}
              </MapContainer>
            </div>
          ) : (
            <div className="text-muted-foreground italic">
              Aucune géométrie de terrain disponible
            </div>
          )}
        </div>
        
        {/* Photos du terrain */}
        <div>
          <h3 className="font-semibold mb-2">Photos du terrain</h3>
          {terrainPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {terrainPhotos.map((url, i) => (
                <div key={i} className="relative overflow-hidden rounded-md border h-40">
                  <img
                    src={url}
                    alt={`Photo ${i+1} du terrain`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Handle image loading error
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground italic">
              Aucune photo de terrain disponible
            </div>
          )}
        </div>
        
        <hr className="my-6" />
        
        <div>
          <h3 className="font-semibold mb-4">Rapport de validation</h3>
          
          <div className="space-y-4">
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
                      value={typeof field.value === 'string' ? field.value : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="surface_validee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surface validée (ha)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      placeholder="Rédigez votre rapport de validation en détaillant vos observations..."
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
                <FormItem>
                  <FormLabel>Décision</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une décision" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="valider" className="text-green-600 font-medium">Valider le terrain</SelectItem>
                      <SelectItem value="rejetter" className="text-red-600 font-medium">Rejeter le terrain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="mb-0">Photos de validation</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
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
              
              {photoValidationUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {photoValidationUrls.map((url, index) => (
                    <div key={index} className="relative group h-40 border rounded-md overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Photo de validation ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Handle image loading error
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-12",
                  "bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors"
                )}
                onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">Aucune photo ajoutée</p>
                  <p className="text-muted-foreground text-xs">Cliquez pour ajouter des photos de validation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationForm;
