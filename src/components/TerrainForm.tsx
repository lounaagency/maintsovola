import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { Upload, X, Loader2, MapPin } from 'lucide-react';

const formSchema = yup.object({
  nom_terrain: yup.string().required('Le nom du terrain est obligatoire'),
  surface_proposee: yup.number().required('La surface proposée est obligatoire').positive('La surface doit être positive'),
  id_region: yup.string().required('La région est obligatoire'),
  id_district: yup.string().required('Le district est obligatoire'),
  id_commune: yup.string().required('La commune est obligatoire'),
  acces_eau: yup.boolean().default(false),
  acces_route: yup.boolean().default(false),
}).required();

type FormData = yup.InferType<typeof formSchema>;

interface TerrainFormProps {
  id?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const TerrainForm: React.FC<TerrainFormProps> = ({ 
  id, 
  onSubmitSuccess, 
  onCancel
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [terrain, setTerrain] = useState<TerrainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<L.LatLngExpression[]>([]);
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

  const form = useForm<FormData>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      nom_terrain: '',
      surface_proposee: 0,
      id_region: '',
      id_district: '',
      id_commune: '',
      acces_eau: false,
      acces_route: false,
    }
  });

  const { handleSubmit, setValue, control, formState: { errors } } = form;

  useEffect(() => {
    fetchRegions();

    if (id) {
      setIsEditMode(true);
      fetchTerrainData(id);
    }
  }, [id]);

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

  const fetchTerrainData = async (terrainId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('terrain')
        .select('*')
        .eq('id_terrain', terrainId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTerrain(data);
        setValue('nom_terrain', data.nom_terrain || '');
        setValue('surface_proposee', data.surface_proposee);
        setValue('id_region', data.id_region?.toString() || '');
        setSelectedRegion(data.id_region);
        setValue('id_district', data.id_district?.toString() || '');
        setSelectedDistrict(data.id_district);
        setValue('id_commune', data.id_commune?.toString() || '');
        setValue('acces_eau', data.acces_eau || false);
        setValue('acces_route', data.acces_route || false);
        
        if (data.photos) {
          setPhotoUrls(typeof data.photos === 'string' ? data.photos.split(',') : data.photos);
        }
      }
    } catch (error) {
      console.error("Error fetching terrain data:", error);
      toast("Failed to load terrain data.");
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast("Failed to load regions.");
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
      toast("Failed to load districts.");
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
      toast("Failed to load communes.");
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (!isDrawingMode) {
      setDrawPoints([]);
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
      URL.revokeObjectURL(newUrls[index]);
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
      if (!user || !user.id) {
        throw new Error("User not authenticated.");
      }

      const uploadedPhotoUrls = await uploadPhotos();
      
      const allPhotoUrls = [...photoUrls.filter(url => url.includes('supabase.co')), ...uploadedPhotoUrls];
      
      let geomData = null;
      if (drawPoints.length >= 3) {
        const closedPoints = [...drawPoints];
        if (closedPoints[0] !== closedPoints[closedPoints.length - 1]) {
          closedPoints.push(closedPoints[0]);
        }
        
        const geoJsonCoords = closedPoints.map(point => {
          const latLng = Array.isArray(point) ? point : [point.lat, point.lng];
          return [latLng[1], latLng[0]];
        });
        
        geomData = {
          type: 'Polygon',
          coordinates: [geoJsonCoords]
        };
      }
      
      const terrainData = {
        id_region: parseInt(formData.id_region),
        id_district: parseInt(formData.id_district),
        id_commune: parseInt(formData.id_commune),
        nom_terrain: formData.nom_terrain,
        surface_proposee: formData.surface_proposee,
        acces_eau: formData.acces_eau,
        acces_route: formData.acces_route,
        photos: allPhotoUrls.join(','),
        id_tantsaha: user.id,
        geom: geomData ? JSON.stringify(geomData) : null
      };

      let response;
      if (isEditMode && id) {
        response = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', parseInt(id));
      } else {
        response = await supabase
          .from('terrain')
          .insert([terrainData]);
      }

      if (response.error) {
        throw response.error;
      }

      toast(`Terrain ${isEditMode ? 'updated' : 'created'} successfully!`);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        navigate('/terrain');
      }
    } catch (error: any) {
      console.error("Error during form submission:", error);
      toast(error.message || "An error occurred during submission.");
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
      if (map) {
        mapRef.current = map;
        setMapInitialized(true);
      }
    }, [map]);

    return null;
  };

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-4">{isEditMode ? 'Modifier un Terrain' : 'Ajouter un Terrain'}</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <div className="flex justify-between items-center mb-2">
              <Button
                type="button"
                variant={isDrawingMode ? "default" : "outline"}
                size="sm"
                onClick={toggleDrawingMode}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isDrawingMode ? 'Terminer le tracé' : 'Tracer le contour'}
              </Button>
              
              {isDrawingMode && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDrawPoints([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              )}
            </div>
            
            <MapContainer
              center={[-18.913684, 47.536131]}
              zoom={13}
              style={{ height: '400px', width: '100%' }}
              className="rounded-md"
              whenReady={() => setMapInitialized(true)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
