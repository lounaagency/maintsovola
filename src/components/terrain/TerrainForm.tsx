
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { TerrainData } from '@/types/terrain';
import { TerrainFormData, convertFormDataToTerrainData, convertTerrainDataToFormData } from '@/types/terrainForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Import our new components
import TerrainBasicInfo from './TerrainBasicInfo';
import TerrainLocationSelector from './TerrainLocationSelector';
import TerrainPhotoUpload from './TerrainPhotoUpload';
import TerrainMapSelector from './TerrainMapSelector';

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
  id?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  initialData?: TerrainData | null;
  userId?: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainForm: React.FC<TerrainFormProps> = ({ 
  id, 
  onSubmitSuccess, 
  onCancel,
  initialData,
  userId,
  userRole,
  agriculteurs
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<{ id_region: number; nom_region: string }[]>([]);
  const [districts, setDistricts] = useState<{ id_district: number; nom_district: string; id_region: number }[]>([]);
  const [communes, setCommunes] = useState<{ id_commune: number; nom_commune: string; id_district: number }[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<L.LatLngExpression[]>([
    [-18.913684, 47.536131],
    [-18.913684, 47.546131],
    [-18.903684, 47.546131],
    [-18.903684, 47.536131],
  ]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize the form with default values or data from the provided terrain
  const initialFormData: TerrainFormData = initialData ? 
    convertTerrainDataToFormData(initialData) : 
    {
      nom_terrain: '',
      surface_proposee: 0,
      id_region: '',
      id_district: '',
      id_commune: '',
      acces_eau: false,
      acces_route: false,
    };

  const form = useForm<TerrainFormData>({
    resolver: yupResolver(formSchema),
    defaultValues: initialFormData
  });

  const { control, handleSubmit, setValue, formState: { errors } } = form;

  useEffect(() => {
    fetchRegions();

    if (id) {
      setIsEditMode(true);
      if (!initialData) {
        fetchTerrainData(id);
      } else {
        setSelectedRegion(Number(initialData.id_region));
        setSelectedDistrict(Number(initialData.id_district));
        
        if (initialData.photos) {
          setPhotoUrls(typeof initialData.photos === 'string' ? 
            initialData.photos.split(',') : 
            initialData.photos as string[]
          );
        }
      }
    }
  }, [id, initialData]);

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
        const formData = convertTerrainDataToFormData(data);
        
        // Set form fields
        Object.entries(formData).forEach(([key, value]) => {
          setValue(key as keyof TerrainFormData, value);
        });
        
        setSelectedRegion(data.id_region);
        setSelectedDistrict(data.id_district);
        
        if (data.photos) {
          setPhotoUrls(typeof data.photos === 'string' ? data.photos.split(',') : data.photos as string[]);
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

  const onSubmit = async (formData: TerrainFormData) => {
    setLoading(true);
    try {
      if (!user && !userId) {
        throw new Error("User not authenticated.");
      }

      const uploadedPhotoUrls = await uploadPhotos();
      
      // Get existing photo URLs that are from supabase (they contain 'supabase.co')
      const existingPhotoUrls = photoUrls.filter(url => url.includes('supabase.co'));
      
      // Combine existing and newly uploaded photos
      const allPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];
      
      // Convert form data to the correct types
      const terrainData = convertFormDataToTerrainData(formData);
      terrainData.id_tantsaha = userId || user?.id;
      terrainData.photos = allPhotoUrls.join(',');

      let response;
      if (isEditMode && id) {
        response = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', id);
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

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-4">
        {isEditMode ? 'Modifier un Terrain' : 'Ajouter un Terrain'}
      </h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TerrainBasicInfo control={control} errors={errors} />
          
          <TerrainLocationSelector 
            control={control}
            regions={regions}
            districts={districts}
            communes={communes}
            onRegionChange={handleRegionChange}
            onDistrictChange={handleDistrictChange}
            errors={errors}
          />
          
          <TerrainPhotoUpload 
            photoUrls={photoUrls}
            onPhotoAdd={handleFileChange}
            onPhotoRemove={removePhoto}
          />
          
          <div>
            <TerrainMapSelector 
              polygonCoordinates={polygonCoordinates}
              setPolygonCoordinates={setPolygonCoordinates}
            />
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
