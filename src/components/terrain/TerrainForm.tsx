
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { TerrainData, TerrainFormData, RegionData, DistrictData, CommuneData } from "@/types/terrain";
import { Loader2, MapPin, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, useMapEvents, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Import the type for agriculteurs
interface Agriculteur {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
}

interface TerrainFormProps {
  initialData?: TerrainData;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: Agriculteur[];
}

// Define the validation schema
const schema = yup.object({
  nom_terrain: yup.string().required("Le nom du terrain est obligatoire"),
  surface_proposee: yup.number().required("La surface est obligatoire").positive("La surface doit être positive"),
  id_region: yup.string().required("La région est obligatoire"),
  id_district: yup.string().required("Le district est obligatoire"),
  id_commune: yup.string().required("La commune est obligatoire"),
  acces_eau: yup.boolean().default(false),
  acces_route: yup.boolean().default(false),
}).required();

const TerrainForm: React.FC<TerrainFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  userId,
  userRole,
  agriculteurs
}) => {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictData[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<CommuneData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [polygonPositions, setPolygonPositions] = useState<L.LatLngExpression[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-18.8792, 47.5079]); // Antananarivo
  const [mapZoom, setMapZoom] = useState(8);
  const [drawEnabled, setDrawEnabled] = useState(true);
  const [calculatedSurface, setCalculatedSurface] = useState<number | null>(null);
  
  const form = useForm<TerrainFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData ? {
      id_terrain: initialData.id_terrain,
      nom_terrain: initialData.nom_terrain || "",
      surface_proposee: initialData.surface_proposee,
      id_region: initialData.id_region?.toString() || "",
      id_district: initialData.id_district?.toString() || "",
      id_commune: initialData.id_commune?.toString() || "",
      acces_eau: initialData.acces_eau || false,
      acces_route: initialData.acces_route || false,
      geom: initialData.geom,
    } : {
      nom_terrain: "",
      surface_proposee: 1,
      id_region: "",
      id_district: "",
      id_commune: "",
      acces_eau: false,
      acces_route: false,
      geom: null,
    }
  });
  
  const watchRegion = form.watch("id_region");
  const watchDistrict = form.watch("id_district");

  useEffect(() => {
    // Initialize photos from initialData if available
    if (initialData?.photos) {
      const initialPhotos = Array.isArray(initialData.photos) 
        ? initialData.photos 
        : initialData.photos.split(',').filter(url => url);
      
      setPhotoUrls(initialPhotos);
    }
    
    // Initialize geom data if available
    if (initialData?.geom) {
      try {
        // Parse GeoJSON if it's a string
        const geomData = typeof initialData.geom === 'string' 
          ? JSON.parse(initialData.geom) 
          : initialData.geom;
          
        if (geomData.coordinates && geomData.coordinates.length > 0) {
          // Extract polygon coordinates
          const coords = geomData.coordinates[0] || [];
          // Convert from [lng, lat] to [lat, lng] for Leaflet
          const positions = coords.map((coord: number[]) => [coord[1], coord[0]]);
          
          if (positions.length > 0) {
            setPolygonPositions(positions);
            
            // Set map center and zoom based on polygon bounds
            const bounds = L.latLngBounds(positions as L.LatLngTuple[]);
            if (bounds.isValid()) {
              const center = bounds.getCenter();
              setMapCenter([center.lat, center.lng]);
              setMapZoom(14); // Zoom level to show the polygon
            }
          }
        }
      } catch (error) {
        console.error("Error parsing geom data:", error);
      }
    }
  }, [initialData]);

  // Fetch regions, districts and communes
  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from("region").select("*").order("nom_region");
      if (error) {
        console.error("Error fetching regions:", error);
        return;
      }
      setRegions(data || []);
    };

    const fetchDistricts = async () => {
      const { data, error } = await supabase.from("district").select("*").order("nom_district");
      if (error) {
        console.error("Error fetching districts:", error);
        return;
      }
      setDistricts(data || []);
    };

    const fetchCommunes = async () => {
      const { data, error } = await supabase.from("commune").select("*").order("nom_commune");
      if (error) {
        console.error("Error fetching communes:", error);
        return;
      }
      setCommunes(data || []);
    };

    fetchRegions();
    fetchDistricts();
    fetchCommunes();
  }, []);

  // Filter districts by region
  useEffect(() => {
    if (watchRegion) {
      const regionId = parseInt(watchRegion);
      const filtered = districts.filter(d => d.id_region === regionId);
      setFilteredDistricts(filtered);
      
      if (filtered.length > 0 && !filtered.find(d => d.id_district === parseInt(watchDistrict))) {
        form.setValue("id_district", filtered[0].id_district.toString());
      }
    } else {
      setFilteredDistricts([]);
      form.setValue("id_district", "");
    }
  }, [watchRegion, districts, watchDistrict, form]);

  // Filter communes by district
  useEffect(() => {
    if (watchDistrict) {
      const districtId = parseInt(watchDistrict);
      const filtered = communes.filter(c => c.id_district === districtId);
      setFilteredCommunes(filtered);
      
      if (filtered.length > 0 && !filtered.find(c => c.id_commune === parseInt(form.getValues("id_commune")))) {
        form.setValue("id_commune", filtered[0].id_commune.toString());
      }
    } else {
      setFilteredCommunes([]);
      form.setValue("id_commune", "");
    }
  }, [watchDistrict, communes, form]);

  // Calculate area from polygon in hectares
  const calculateAreaInHectares = (positions: L.LatLngExpression[]) => {
    if (positions.length < 3) return 0;
    
    const latLngs = positions.map(pos => {
      if (Array.isArray(pos)) return L.latLng(pos[0], pos[1]);
      return pos as L.LatLng;
    });
    
    // Create a polygon and calculate area in square meters
    const areaInSquareMeters = L.GeometryUtil.geodesicArea(latLngs);
    
    // Convert to hectares (1 hectare = 10,000 square meters)
    const areaInHectares = areaInSquareMeters / 10000;
    
    return areaInHectares;
  };

  // Update form value when polygon is drawn
  useEffect(() => {
    if (polygonPositions.length >= 3) {
      const area = calculateAreaInHectares(polygonPositions);
      setCalculatedSurface(area);
      form.setValue("surface_proposee", parseFloat(area.toFixed(2)));
    }
  }, [polygonPositions, form]);

  // Map drawing component
  const DrawControl = () => {
    const map = useMap();
    const drawnItems = useRef(new L.FeatureGroup()).current;

    useEffect(() => {
      mapRef.current = map;
      map.addLayer(drawnItems);
      
      // Initialize draw control
      const drawControl = new (L.Control as any).Draw({
        draw: {
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      
      map.addControl(drawControl);
      
      // If we have existing polygon positions, add them to the map
      if (polygonPositions.length >= 3) {
        const polygon = L.polygon(polygonPositions, { color: 'red' });
        drawnItems.addLayer(polygon);
        
        // Fit map to polygon
        map.fitBounds(polygon.getBounds());
      }
      
      // Event handling for draw/edit/delete
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.clearLayers(); // Remove existing polygon
        drawnItems.addLayer(layer);
        
        // Get coordinates from the drawn polygon
        if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          setPolygonPositions(latlngs.map(latlng => [latlng.lat, latlng.lng]));
        }
      });
      
      map.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs()[0] as L.LatLng[];
            setPolygonPositions(latlngs.map(latlng => [latlng.lat, latlng.lng]));
          }
        });
      });
      
      map.on(L.Draw.Event.DELETED, () => {
        setPolygonPositions([]);
        setCalculatedSurface(null);
      });
      
      return () => {
        map.removeLayer(drawnItems);
        map.removeControl(drawControl);
      };
    }, [map, drawnItems]);
    
    return null;
  };

  // File management functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...selectedFiles]);
    
    // Create object URLs for preview
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrls(prev => [...prev, previewUrl]);
    });
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };
  
  const removePhoto = (index: number) => {
    // Check if the photo is a new upload or an existing URL
    const photoUrl = photoUrls[index];
    
    // If it doesn't start with blob: it's an existing photo
    const isExistingPhoto = !photoUrl.startsWith('blob:');
    
    if (!isExistingPhoto) {
      // Revoke object URL to avoid memory leaks
      URL.revokeObjectURL(photoUrl);
      
      // Find the file in photos array and remove it
      const newPhotos = [...photos];
      // Find the corresponding file index
      const fileIndex = photos.findIndex((_, i) => {
        const startIndex = photoUrls.findIndex(url => url.startsWith('blob:'));
        return i === (index - startIndex);
      });
      
      if (fileIndex >= 0) {
        newPhotos.splice(fileIndex, 1);
        setPhotos(newPhotos);
      }
    }
    
    // Remove from photoUrls array
    const newPhotoUrls = [...photoUrls];
    newPhotoUrls.splice(index, 1);
    setPhotoUrls(newPhotoUrls);
  };
  
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `terrain-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `terrain-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, photo);
          
        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);
          
        if (publicUrlData) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error in photo upload process:", error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Convert polygon coordinates to GeoJSON format for database
  const createGeoJSONPolygon = (positions: L.LatLngExpression[]): any => {
    if (positions.length < 3) return null;
    
    // Convert from Leaflet [lat, lng] to GeoJSON [lng, lat]
    const coordinates = positions.map(pos => {
      if (Array.isArray(pos)) return [pos[1], pos[0]];
      const latLng = pos as L.LatLng;
      return [latLng.lng, latLng.lat];
    });
    
    // Close the polygon by repeating the first point as the last point
    if (
      coordinates[0][0] !== coordinates[coordinates.length-1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length-1][1]
    ) {
      coordinates.push([...coordinates[0]]);
    }
    
    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  };

  const onSubmit = async (formData: TerrainFormData) => {
    setIsSubmitting(true);
    try {
      // Determine the owner of the terrain
      const terrainOwnerId = userRole === 'simple' ? userId :
                             userRole === 'technicien' || userRole === 'superviseur' ?
                             (formData.id_tantsaha || userId) : userId;
      
      // Upload new photos
      const uploadedPhotoUrls = await uploadPhotos();
      
      // Combine existing photo URLs (excluding blob URLs) with new uploaded URLs
      const existingPhotoUrls = photoUrls.filter(url => !url.startsWith('blob:'));
      const allPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];
      
      // Create GeoJSON from polygon positions
      const geom = polygonPositions.length >= 3 ? createGeoJSONPolygon(polygonPositions) : null;
      
      const terrainData: Partial<TerrainData> = {
        nom_terrain: formData.nom_terrain,
        surface_proposee: formData.surface_proposee,
        id_tantsaha: terrainOwnerId,
        id_region: parseInt(formData.id_region),
        id_district: parseInt(formData.id_district),
        id_commune: parseInt(formData.id_commune),
        acces_eau: formData.acces_eau,
        acces_route: formData.acces_route,
        statut: false, // New terrains are always unvalidated
        photos: allPhotoUrls.length > 0 ? allPhotoUrls.join(',') : undefined,
        geom: geom
      };
      
      if (initialData?.id_terrain) {
        // Update existing terrain
        const { error } = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', initialData.id_terrain);
          
        if (error) throw error;
        
        toast.success("Terrain modifié avec succès");
      } else {
        // Create new terrain
        const { error } = await supabase
          .from('terrain')
          .insert([terrainData]);
          
        if (error) throw error;
        
        // Fetch supervisors for the region
        const { data: supervisors } = await supabase
          .from('utilisateur')
          .select('id_utilisateur')
          .eq('id_role', 4) // 4 = superviseur
          .eq('role', 'superviseur');
          
        if (supervisors && supervisors.length > 0) {
          // Notify supervisors
          const notifications = supervisors.map(supervisor => ({
            id_expediteur: userId,
            id_destinataire: supervisor.id_utilisateur,
            titre: "Nouveau terrain",
            message: `Un nouveau terrain '${formData.nom_terrain}' a été ajouté en attente de validation`,
            type: "info",
            entity_type: "terrain"
          }));
          
          await supabase.from('notification').insert(notifications);
        }
        
        toast.success("Terrain ajouté avec succès");
      }
      
      onSubmitSuccess();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
      console.error("Error submitting terrain form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {userRole === 'technicien' || userRole === 'superviseur' ? (
          <FormField
            control={form.control}
            name="id_tantsaha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Propriétaire du terrain</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agriculteur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agriculteurs?.map((agriculteur) => (
                      <SelectItem 
                        key={agriculteur.id_utilisateur} 
                        value={agriculteur.id_utilisateur}
                      >
                        {agriculteur.nom} {agriculteur.prenoms || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      
        <FormField
          control={form.control}
          name="nom_terrain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du terrain</FormLabel>
              <FormControl>
                <Input placeholder="Nom du terrain" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Définir la zone sur la carte</FormLabel>
          <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-md border"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {polygonPositions.length >= 3 && (
                <Polygon
                  positions={polygonPositions}
                  pathOptions={{ color: 'red' }}
                />
              )}
              <DrawControl />
            </MapContainer>
          </div>
          {calculatedSurface !== null && (
            <div className="text-sm text-muted-foreground">
              Surface calculée: {calculatedSurface.toFixed(2)} hectares
            </div>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="surface_proposee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surface estimée (hectares)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Surface en hectares" 
                  min="0.1" 
                  step="0.1" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                />
              </FormControl>
              <FormDescription>
                Surface en hectares (1 ha = 10 000 m²)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="id_region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Région</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem 
                        key={region.id_region} 
                        value={region.id_region.toString()}
                      >
                        {region.nom_region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="id_district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!watchRegion}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un district" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredDistricts.map((district) => (
                      <SelectItem 
                        key={district.id_district} 
                        value={district.id_district.toString()}
                      >
                        {district.nom_district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="id_commune"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commune</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!watchDistrict}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commune" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCommunes.map((commune) => (
                      <SelectItem 
                        key={commune.id_commune} 
                        value={commune.id_commune.toString()}
                      >
                        {commune.nom_commune}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="acces_eau"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Accès à l'eau</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="acces_route"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Accès aux routes</FormLabel>
              </FormItem>
            )}
          />
        </div>
        
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
              onChange={handleFileChange}
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
                    onClick={() => removePhoto(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id_terrain ? "Mettre à jour" : "Ajouter le terrain"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TerrainForm;
