
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TerrainFormData } from '@/types/terrainForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, X, Loader2, MapPin } from 'lucide-react';

// Override TerrainFormData with more relaxed type for yup resolver
interface FormData {
  nom_terrain: string;
  surface_proposee: number;
  id_region: string;
  id_district: string;
  id_commune: string;
  acces_eau: boolean;
  acces_route: boolean;
}

const formSchema = yup.object().shape({
  nom_terrain: yup.string().required('Le nom du terrain est obligatoire'),
  surface_proposee: yup.number().required('La surface proposée est obligatoire').positive('La surface doit être positive'),
  id_region: yup.string().required('La région est obligatoire'),
  id_district: yup.string().required('Le district est obligatoire'),
  id_commune: yup.string().required('La commune est obligatoire'),
  acces_eau: yup.boolean().nullable(),
  acces_route: yup.boolean().nullable(),
});

interface TerrainFormProps {
  initialData?: TerrainData;
  onSubmitSuccess: () => void;
  onCancel: () => void;
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
  agriculteurs
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedAgriculteur, setSelectedAgriculteur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<L.LatLngExpression[]>([]);

  const form = useForm<FormData>({
    resolver: yupResolver<FormData>(formSchema),
    defaultValues: {
      nom_terrain: initialData?.nom_terrain || '',
      surface_proposee: initialData?.surface_proposee || 0,
      id_region: initialData?.id_region?.toString() || '',
      id_district: initialData?.id_district?.toString() || '',
      id_commune: initialData?.id_commune?.toString() || '',
      acces_eau: initialData?.acces_eau || false,
      acces_route: initialData?.acces_route || false,
    }
  });

  const { control, handleSubmit, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    fetchRegions();

    if (initialData) {
      setIsEditMode(true);
      
      // Initialize polygon coordinates if available
      if (initialData.geom) {
        try {
          // Parse GeoJSON from the database
          const geom = JSON.parse(initialData.geom);
          if (geom && geom.coordinates && geom.coordinates[0]) {
            // Convert from [lng, lat] to [lat, lng] format for LeafletJS
            const coords = geom.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
            setPolygonCoordinates(coords);
            setDrawPoints(coords);
          }
        } catch (error) {
          console.error("Error parsing geometry data:", error);
        }
      }
      
      // Initialize photos if available
      if (initialData.photos) {
        if (typeof initialData.photos === 'string') {
          // Split the comma-separated string
          setPhotoUrls(initialData.photos.split(',').filter(url => url.trim()));
        } else if (Array.isArray(initialData.photos)) {
          setPhotoUrls(initialData.photos.filter(url => url.trim()));
        }
      }
      
      // Set selected region and district for cascading dropdowns
      if (initialData.id_region) {
        setSelectedRegion(initialData.id_region);
        fetchDistricts(initialData.id_region);
      }
      
      if (initialData.id_district) {
        setSelectedDistrict(initialData.id_district);
        fetchCommunes(initialData.id_district);
      }
      
      // If technician or supervisor is creating/editing for a farmer
      if (initialData.id_tantsaha && (userRole === 'technicien' || userRole === 'superviseur')) {
        setSelectedAgriculteur(initialData.id_tantsaha);
      }
    }
  }, [initialData, userRole]);

  useEffect(() => {
    if (selectedRegion) {
      fetchDistricts(selectedRegion);
      setValue('id_district', '');
      setCommunes([]);
      setValue('id_commune', '');
    }
  }, [selectedRegion, setValue]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchCommunes(selectedDistrict);
      setValue('id_commune', '');
    }
  }, [selectedDistrict, setValue]);

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
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast.error("Impossible de charger les régions");
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
    } catch (error) {
      console.error("Error fetching districts:", error);
      toast.error("Impossible de charger les districts");
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
    } catch (error) {
      console.error("Error fetching communes:", error);
      toast.error("Impossible de charger les communes");
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
      // Only revoke if it's a local blob URL
      if (newUrls[index] && newUrls[index].startsWith('blob:')) {
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

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (!user && !userId) {
        throw new Error("Utilisateur non authentifié");
      }

      // Upload new photos and get their URLs
      const uploadedPhotoUrls = await uploadPhotos();
      
      // Combine existing remote photo URLs with newly uploaded ones
      const existingRemoteUrls = photoUrls.filter(url => 
        url.includes('supabase.co') || url.includes('http')
      );
      const allPhotoUrls = [...existingRemoteUrls, ...uploadedPhotoUrls];
      
      // Prepare geometry data
      let geomData = null;
      if (drawPoints.length >= 3) {
        // Close the polygon by adding the first point again at the end if needed
        const closedPoints = [...drawPoints];
        if (closedPoints[0] !== closedPoints[closedPoints.length - 1]) {
          closedPoints.push(closedPoints[0]);
        }
        
        // Convert from [lat, lng] to [lng, lat] for GeoJSON
        const geoJsonCoords = closedPoints.map(point => {
          const latLng = Array.isArray(point) ? point : [point.lat, point.lng];
          return [latLng[1], latLng[0]]; // Switch to [lng, lat]
        });
        
        geomData = {
          type: 'Polygon',
          coordinates: [geoJsonCoords]
        };
      }
      
      // Determine who is the terrain owner
      const terrainOwner = (userRole === 'technicien' || userRole === 'superviseur') ? 
        selectedAgriculteur || userId :
        userId;
      
      const terrainData: Partial<TerrainData> = {
        id_region: parseInt(formData.id_region),
        id_district: parseInt(formData.id_district),
        id_commune: parseInt(formData.id_commune),
        nom_terrain: formData.nom_terrain,
        surface_proposee: formData.surface_proposee,
        acces_eau: formData.acces_eau,
        acces_route: formData.acces_route,
        photos: allPhotoUrls.join(','),
        id_tantsaha: terrainOwner,
        geom: geomData ? JSON.stringify(geomData) : null
      };
      
      let response;
      if (isEditMode && initialData?.id_terrain) {
        // Update existing terrain
        response = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', initialData.id_terrain);
          
        if (response.error) {
          throw response.error;
        }
        
        toast.success("Terrain mis à jour avec succès");
      } else {
        // Create new terrain
        response = await supabase
          .from('terrain')
          .insert([terrainData]);
          
        if (response.error) {
          throw response.error;
        }
        
        toast.success("Terrain créé avec succès");
      }

      onSubmitSuccess();
    } catch (error: any) {
      console.error("Error during form submission:", error);
      toast.error(error.message || "Une erreur est survenue lors de l'enregistrement du terrain");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (selectedValue: string) => {
    setSelectedRegion(Number(selectedValue));
  };

  const handleDistrictChange = (selectedValue: string) => {
    setSelectedDistrict(Number(selectedValue));
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (!isDrawingMode) {
      // Start drawing mode
      setDrawPoints([]);
    }
  };

  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        if (isDrawingMode) {
          const { lat, lng } = e.latlng;
          setDrawPoints(prev => [...prev, [lat, lng]]);
        }
      },
    });

    useEffect(() => {
      // Set map reference when map is available
      if (map) {
        mapRef.current = map;
        setMapInitialized(true);
        
        // Center on Madagascar
        map.setView([-18.9, 47.5], 6);
      }
    }, [map]);

    return null;
  };
  
  // Update polygon when drawing points change
  useEffect(() => {
    if (drawPoints.length >= 3 && mapInitialized) {
      setPolygonCoordinates(drawPoints);
      
      // Center map on polygon
      if (mapRef.current) {
        const latLngs = drawPoints.map(point => 
          Array.isArray(point) ? L.latLng(point[0], point[1]) : point
        );
        const bounds = L.latLngBounds(latLngs);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [drawPoints, mapInitialized]);

  return (
    <div className="container max-w-4xl py-4">
      <h1 className="text-2xl font-bold mb-4">{isEditMode ? 'Modifier un Terrain' : 'Ajouter un Terrain'}</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
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
              
              {/* Only show agricultor select for techniciens and superviseurs */}
              {(userRole === 'technicien' || userRole === 'superviseur') && agriculteurs && (
                <div className="space-y-2">
                  <FormLabel>Propriétaire du terrain</FormLabel>
                  <Select 
                    value={selectedAgriculteur || undefined} 
                    onValueChange={setSelectedAgriculteur}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un propriétaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {agriculteurs.map((agriculteur) => (
                        <SelectItem 
                          key={agriculteur.id_utilisateur} 
                          value={agriculteur.id_utilisateur}
                        >
                          {agriculteur.nom} {agriculteur.prenoms || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Sélectionnez le propriétaire du terrain
                  </FormDescription>
                </div>
              )}

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
              
              <div className="flex gap-4">
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
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Contour du terrain sur la carte</FormLabel>
                <Button
                  type="button"
                  variant={isDrawingMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleDrawingMode}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isDrawingMode ? 'Terminer le tracé' : 'Tracer le contour'}
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-md border p-2 mb-2 text-sm">
                {isDrawingMode ? (
                  <p className="text-blue-600">Mode tracé: Cliquez sur la carte pour ajouter des points au contour</p>
                ) : (
                  <p>Cliquez sur "Tracer le contour" pour délimiter votre terrain sur la carte</p>
                )}
              </div>
              
              <div className="h-[400px] relative">
                <MapContainer
                  center={[-18.9, 47.5]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-md"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {polygonCoordinates.length >= 3 && (
                    <Polygon
                      positions={polygonCoordinates}
                      pathOptions={{ color: '#16a34a', weight: 2, fillOpacity: 0.2, fillColor: '#16a34a' }}
                    />
                  )}
                  
                  {drawPoints.map((point, index) => (
                    <Marker 
                      key={index}
                      position={point}
                    />
                  ))}
                  
                  <MapEvents />
                </MapContainer>
                
                {isDrawingMode && (
                  <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-md shadow">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDrawPoints([])}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading || isUploading}
            >
              Annuler
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading || isUploading} 
              className="flex items-center"
            >
              {(loading || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Upload en cours...' : 'Enregistrement...'}
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TerrainForm;
