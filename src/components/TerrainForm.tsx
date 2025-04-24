
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner';
import {
  TerrainData,
  RegionData,
  DistrictData,
  CommuneData
} from '@/types/terrain';
import { TerrainFormData, convertFormDataToTerrainData } from '@/types/terrainForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, X, Loader2 } from 'lucide-react';

const formSchema = yup.object().shape({
  nom_terrain: yup.string().required('Le nom du terrain est obligatoire'),
  surface_proposee: yup.number().required('La surface proposée est obligatoire').positive('La surface doit être positive'),
  id_region: yup.string().required('La région est obligatoire'),
  id_district: yup.string().required('Le district est obligatoire'),
  id_commune: yup.string().required('La commune est obligatoire'),
  acces_eau: yup.boolean().nullable(),
  acces_route: yup.boolean().nullable(),
  id_tantsaha: yup.string().nullable(),
});

interface TerrainFormProps {
  initialData?: TerrainData | null;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainForm: React.FC<TerrainFormProps> = ({ 
  initialData, 
  onSubmitSuccess, 
  onCancel,
  userId,
  userRole,
  agriculteurs = []
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [terrain, setTerrain] = useState<TerrainData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!initialData);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<L.LatLngExpression[]>([
    [-18.913684, 47.536131],
    [-18.913684, 47.546131],
    [-18.903684, 47.546131],
    [-18.903684, 47.536131],
  ]);
  const mapRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const form = useForm<TerrainFormData>({
    resolver: yupResolver(formSchema) as any,
    defaultValues: {
      nom_terrain: initialData?.nom_terrain || '',
      surface_proposee: initialData?.surface_proposee || 0,
      id_region: initialData?.id_region?.toString() || '',
      id_district: initialData?.id_district?.toString() || '',
      id_commune: initialData?.id_commune?.toString() || '',
      acces_eau: initialData?.acces_eau || false,
      acces_route: initialData?.acces_route || false,
      id_tantsaha: initialData?.id_tantsaha || userId,
    }
  });

  const { control, handleSubmit, setValue, formState: { errors }, watch } = form;
  const selectedTantsaha = watch('id_tantsaha');

  // Load initial data only once
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRegions();
      
      if (initialData) {
        setIsEditMode(true);
        await loadTerrainData(initialData);
      } else {
        // Initialize with default values for new terrain
        if (userRole && (userRole === 'technicien' || userRole === 'superviseur')) {
          setValue('id_tantsaha', ''); // Clear default value for technicians/supervisors
        }
      }
      
      setIsInitialized(true);
    };
    
    loadInitialData();
  }, [initialData, userRole]);

  // Handle region change
  useEffect(() => {
    if (selectedRegion) {
      fetchDistricts(selectedRegion);
    }
  }, [selectedRegion]);

  // Handle district change
  useEffect(() => {
    if (selectedDistrict) {
      fetchCommunes(selectedDistrict);
    }
  }, [selectedDistrict]);

  const loadTerrainData = async (data: TerrainData) => {
    console.log('Loading terrain for edit data:', data);
    setTerrain(data);
    setValue('nom_terrain', data.nom_terrain || '');
    setValue('surface_proposee', data.surface_proposee);
    
    // First set the region and fetch districts
    if (data.id_region) {
      const regionId = data.id_region;
      setValue('id_region', regionId.toString());
      setSelectedRegion(regionId);
      
      // Wait for districts to load
      await fetchDistricts(regionId);
      
      // Then set the district and fetch communes
      if (data.id_district) {
        const districtId = data.id_district;
        setValue('id_district', districtId.toString());
        setSelectedDistrict(districtId);
        
        // Wait for communes to load
        await fetchCommunes(districtId);
        
        // Finally set the commune
        if (data.id_commune) {
          setValue('id_commune', data.id_commune.toString());
        }
      }
    }
    
    setValue('acces_eau', data.acces_eau || false);
    setValue('acces_route', data.acces_route || false);
    setValue('id_tantsaha', data.id_tantsaha || userId);
    
    // Load polygon coordinates if available
    if (data.geom) {
      try {
        const geomData = typeof data.geom === 'string' 
          ? JSON.parse(data.geom) 
          : data.geom;
          
        if (geomData && geomData.coordinates && geomData.coordinates[0]) {
          // Convert GeoJSON format to LatLngExpression[]
          const coords = geomData.coordinates[0].map((coord: number[]) => 
            [coord[1], coord[0]] as L.LatLngExpression
          );
          setPolygonCoordinates(coords);
        }
      } catch (error) {
        console.error("Error parsing polygon geometry:", error);
      }
    }
    
    // Load photos
    if (data.photos) {
      const photoArray = typeof data.photos === 'string' 
        ? data.photos.split(',') 
        : data.photos;
      setPhotoUrls(photoArray.filter(Boolean));
    }
  };

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('region')
        .select('*')
        .order('nom_region', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setRegions(data);
      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast("Failed to load regions.");
      return [];
    }
  };

  const fetchDistricts = async (regionId: number) => {
    try {
      const { data, error } = await supabase
        .from('district')
        .select('*')
        .eq('id_region', regionId)
        .order('nom_district', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setDistricts(data);
      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      toast("Failed to load districts.");
      return [];
    }
  };

  const fetchCommunes = async (districtId: number) => {
    try {
      const { data, error } = await supabase
        .from('commune')
        .select('*')
        .eq('id_district', districtId)
        .order('nom_commune', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setCommunes(data);
      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching communes:", error);
      toast("Failed to load communes.");
      return [];
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });

    setPhotoUrls(prevUrls => {
      const newUrls = [...prevUrls];
      
      // Only revoke if it's a blob URL (newly added photo)
      if (newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      
      newUrls.splice(index, 1);
      return newUrls;
    });
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

  const onSubmit = async (formData: TerrainFormData) => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }

      // Make sure we have a valid id_tantsaha
      const tantsahaId = userRole && (userRole === 'technicien' || userRole === 'superviseur') 
        ? formData.id_tantsaha 
        : userId;
        
      if (!tantsahaId) {
        throw new Error("Un agriculteur doit être sélectionné.");
      }

      // Upload new photos
      const uploadedPhotoUrls = await uploadPhotos();
      
      // Combine existing urls (that aren't blob URLs) with newly uploaded ones
      const existingUrls = photoUrls.filter(url => !url.startsWith('blob:'));
      const allPhotoUrls = [...existingUrls, ...uploadedPhotoUrls];
      
      // Convert polygon coordinates to GeoJSON format
      const geojson = {
        type: "Polygon",
        coordinates: [
          polygonCoordinates.map(coord => 
            Array.isArray(coord) ? [coord[1], coord[0]] : [0, 0]
          )
        ]
      };
      
      // Convert form data to the correct types
      const terrainData = convertFormDataToTerrainData(formData);
      terrainData.id_tantsaha = tantsahaId;
      terrainData.photos = allPhotoUrls.join(',');
      terrainData.geom = geojson;

      console.log("Submitting terrain data:", terrainData);

      let response;
      if (isEditMode && initialData?.id_terrain) {
        response = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', initialData.id_terrain);
      } else {
        const { id_terrain, ...newTerrainData } = terrainData;
        response = await supabase
          .from('terrain')
          .insert([newTerrainData]);
      }

      if (response.error) {
        console.error("Supabase error:", response.error);
        throw response.error;
      }

      toast(`Terrain ${isEditMode ? 'modifié' : 'créé'} avec succès !`);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        navigate('/terrain');
      }
    } catch (error: any) {
      console.error("Error during form submission:", error);
      toast.error(error.message || "Une erreur s'est produite lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (selectedValue: string) => {
    setSelectedRegion(Number(selectedValue));
    // Clear dependent fields
    setValue('id_district', '');
    setValue('id_commune', '');
    setSelectedDistrict(null);
    setCommunes([]);
  };

  const handleDistrictChange = (selectedValue: string) => {
    setSelectedDistrict(Number(selectedValue));
    // Clear commune field
    setValue('id_commune', '');
  };

  // Custom map component to handle events and polygon editing
  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (!mapRef.current) {
        mapRef.current = map;
        setMapInitialized(true);
        
        // Center map on polygon if it exists
        if (polygonCoordinates.length > 0) {
          const bounds = L.latLngBounds(polygonCoordinates as L.LatLngExpression[]);
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    }, [map]);

    // Handle map clicks to create/edit polygon
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPolygonCoordinates(prev => [...prev, [lat, lng]]);
      },
      dblclick: (e) => {
        // Prevent default double-click zoom
        e.originalEvent.stopPropagation();
        
        // Close the polygon if we have at least 3 points
        if (polygonCoordinates.length >= 3) {
          setPolygonCoordinates(prev => {
            if (prev[0] !== prev[prev.length - 1]) {
              return [...prev, prev[0]]; // Close the polygon
            }
            return prev;
          });
        }
      }
    });

    return null;
  };

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-4">{isEditMode ? 'Modifier un Terrain' : 'Ajouter un Terrain'}</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Show agriculteur select for technicien/superviseur */}
          {userRole && (userRole === 'technicien' || userRole === 'superviseur') && (
            <FormField
              control={control}
              name="id_tantsaha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agriculteur</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value?.toString() || ''}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un agriculteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {agriculteurs && agriculteurs.map((agriculteur) => (
                        <SelectItem
                          key={agriculteur.id_utilisateur}
                          value={agriculteur.id_utilisateur}
                        >
                          {agriculteur.nom} {agriculteur.prenoms || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage>{errors.id_tantsaha?.message}</FormMessage>
                </FormItem>
              )}
            />
          )}
        
          <FormField
            control={control}
            name="nom_terrain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du terrain</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du terrain" {...field} />
                </FormControl>
                <FormMessage>{errors.nom_terrain?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="surface_proposee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surface proposée (en hectares)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Surface proposée en hectares"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage>{errors.surface_proposee?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="id_region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Région</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  handleRegionChange(value);
                }} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id_region} value={region.id_region.toString()}>
                        {region.nom_region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.id_region?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="id_district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  handleDistrictChange(value);
                }} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id_district} value={district.id_district.toString()}>
                        {district.nom_district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.id_district?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="id_commune"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commune</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une commune" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune.id_commune} value={commune.id_commune.toString()}>
                        {commune.nom_commune}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.id_commune?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div className="flex items-center space-x-2">
            <FormField
              control={control}
              name="acces_eau"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Accès à l'eau
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="acces_route"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Accès à la route
                  </FormLabel>
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
          <div>
            <FormLabel>Définir la zone sur la carte</FormLabel>
            <MapContainer
              center={[-18.913684, 47.536131]}
              zoom={13}
              style={{ height: '400px', width: '100%' }}
              className="rounded-md"
              whenReady={() => setMapInitialized(true)}
              doubleClickZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polygon
                positions={polygonCoordinates}
                pathOptions={{ color: '#ff4444', weight: 2, fillOpacity: 0.5, fillColor: '#ff4444' }}
              />
              <MapEvents />
            </MapContainer>
            <div className="text-sm text-muted-foreground mt-2">
              Cliquez sur la carte pour ajouter des points au polygone. Double-cliquez pour terminer le polygone.
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading || isUploading} className="flex items-center">
              {(loading || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Upload en cours...' : 'Enregistrement...'}
                </>
              ) : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TerrainForm;
