
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { TerrainFormData, convertFormDataToTerrainData } from "@/types/terrainForm";
import { TerrainData } from "@/types/terrain";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ValidationForm from "./ValidationForm";
import TerrainFormFields from "./TerrainFormFields";
import { sendNotification } from "@/types/notification";

interface TerrainFormProps {
  initialData?: TerrainData;
  onSubmitSuccess: (updatedTerrain: TerrainData) => void;
  onCancel: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  isValidationMode?: boolean;
}

// Create validation schemas for regular mode and validation mode
const terrainSchema = yup.object().shape({
  nom_terrain: yup.string().required("Le nom du terrain est obligatoire"),
  surface_proposee: yup.number().required("La surface est obligatoire").positive("La surface doit être positive"),
  id_region: yup.string().required("La région est obligatoire"),
  id_district: yup.string().required("Le district est obligatoire"),
  id_commune: yup.string().required("La commune est obligatoire"),
  acces_eau: yup.boolean().default(false),
  acces_route: yup.boolean().default(false),
  id_tantsaha: yup.string().optional(),
});

const validationSchema = yup.object().shape({
  surface_validee: yup.number().required("La surface validée est obligatoire").positive("La surface doit être positive"),
  date_validation: yup.string().required("La date de validation est obligatoire"),
  rapport_validation: yup.string().required("Le rapport de validation est obligatoire"),
  validation_decision: yup.string().required("Une décision est requise").oneOf(['valider', 'rejetter'], "Décision invalide"),
});

const TerrainForm: React.FC<TerrainFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  userId,
  userRole,
  agriculteurs = [],
  techniciens = [],
  isValidationMode = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
  const [validationPhotos, setValidationPhotos] = useState<File[]>([]);
  const [photoValidationUrls, setPhotoValidationUrls] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Choose the appropriate form schema
  const formSchema = isValidationMode ? validationSchema : terrainSchema;
  
  const form = useForm<TerrainFormData>({
    resolver: yupResolver(formSchema as any),
    defaultValues: {
      id_terrain: initialData?.id_terrain,
      nom_terrain: initialData?.nom_terrain || "",
      surface_proposee: initialData?.surface_proposee || 1,
      surface_validee: initialData?.surface_validee || initialData?.surface_proposee || 1,
      id_region: initialData?.id_region?.toString() || "",
      id_district: initialData?.id_district?.toString() || "",
      id_commune: initialData?.id_commune?.toString() || "",
      acces_eau: initialData?.acces_eau || false,
      acces_route: initialData?.acces_route || false,
      id_tantsaha: userRole === 'simple' ? userId : initialData?.id_tantsaha,
      photos: initialData?.photos || '',
      date_validation: initialData?.date_validation 
        ? typeof initialData.date_validation === 'string' 
          ? initialData.date_validation 
          : initialData.date_validation.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      rapport_validation: initialData?.rapport_validation || '',
      photos_validation: initialData?.photos_validation || '',
      validation_decision: initialData?.validation_decision || 'valider',
    }
  });

  // Initialize terrain data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      // Process geometry data if available
      if (initialData.geom) {
        try {
          // Handle both string and object geom formats
          const geomData = typeof initialData.geom === 'string' 
            ? JSON.parse(initialData.geom) 
            : initialData.geom;
                      
          if (geomData && geomData.type === 'Polygon' && geomData.coordinates && geomData.coordinates[0]) {
            setPolygonCoordinates(geomData.coordinates[0]);
          }
        } catch (error) {
          console.error("Error processing polygon geometry:", error);
        }
      }
      
      // Process photos if available
      if (initialData.photos) {
        try {
          const photosArray = typeof initialData.photos === 'string' 
            ? initialData.photos.split(',').filter(url => url.trim() !== '') 
            : Array.isArray(initialData.photos) ? initialData.photos.filter(url => url && url.trim() !== '') : [];
          
          setPhotoUrls(photosArray);
        } catch (error) {
          console.error("Error processing photos:", error);
        }
      }

      // Process validation photos if available
      if (initialData.photos_validation) {
        try {
          const photosArray = typeof initialData.photos_validation === 'string' 
            ? initialData.photos_validation.split(',').filter(url => url.trim() !== '') 
            : Array.isArray(initialData.photos_validation) ? initialData.photos_validation.filter(url => url && url.trim() !== '') : [];
          
          setPhotoValidationUrls(photosArray);
        } catch (error) {
          console.error("Error processing validation photos:", error);
        }
      }
    }
  }, [initialData]);

  // Upload photos to Supabase storage
  const uploadPhotos = async (photos: File[], folder: string = 'terrain-photos'): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `terrain-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
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

  // Form submission handler
  const onSubmit = async (data: TerrainFormData) => {
    setIsSubmitting(true);
    try {
      // Assign polygon coordinates to form data
      if (!isValidationMode) {
        data.geom = polygonCoordinates;
      }
      
      // Round surface to 2 decimal places
      data.surface_proposee = parseFloat(data.surface_proposee.toFixed(2));
      if (data.surface_validee) {
        data.surface_validee = parseFloat(data.surface_validee.toFixed(2));
      }
      
      // Determine the terrain owner based on user role
      const terrainOwnerId = userRole === 'simple' ? userId :
                             userRole === 'technicien' || userRole === 'superviseur' ?
                             (data.id_tantsaha || userId) : userId;
      
      // Convert form data to terrain data
      const terrainData = convertFormDataToTerrainData({...data});
      terrainData.id_tantsaha = terrainOwnerId;
      
      if (isValidationMode) {
        // Upload validation photos
        const uploadedValidationPhotos = await uploadPhotos(validationPhotos, 'terrain-validation-photos');
        
        // Filter out blob URLs which are just previews
        const existingValidationPhotoUrls = photoValidationUrls.filter(url => !url.startsWith('blob:'));
        const allValidationPhotoUrls = [...existingValidationPhotoUrls, ...uploadedValidationPhotos];
        
        // Update terrain with validation data
        terrainData.photos_validation = allValidationPhotoUrls.join(',');
        terrainData.statut = data.validation_decision === 'valider';
        
        // Ensure date_validation is a string for the API
        if (terrainData.date_validation && typeof terrainData.date_validation !== 'string') {
          terrainData.date_validation = terrainData.date_validation.toISOString();
        }
        
        const { error } = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', initialData?.id_terrain);
          
        if (error) throw error;
        
        // Send notification to terrain owner
        if (initialData?.id_tantsaha) {
          await sendNotification(
            supabase,
            userId,
            [{ id_utilisateur: initialData.id_tantsaha }],
            data.validation_decision === 'valider' ? "Terrain validé" : "Terrain rejeté",
            `Votre terrain ${initialData.nom_terrain} a été ${data.validation_decision === 'valider' ? 'validé' : 'rejeté'}`,
            data.validation_decision === 'valider' ? "success" : "warning",
            "terrain",
            initialData.id_terrain
          );
        }
        
        toast.success(`Terrain ${data.validation_decision === 'valider' ? 'validé' : 'rejeté'} avec succès`);
        
        // Return the updated terrain data for UI update
        onSubmitSuccess({
          ...initialData,
          ...terrainData
        });
      } else {
        // Regular terrain create/update mode
        // Upload new photos and combine with existing ones
        const uploadedPhotoUrls = await uploadPhotos(photos);
        
        // Filter out blob URLs which are just previews
        const existingPhotoUrls = photoUrls.filter(url => !url.startsWith('blob:'));
        const allPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];
        
        // Ensure photos is always a string when sending to API
        terrainData.photos = allPhotoUrls.join(',');
        
        console.log("Saving terrain data:", terrainData);
        
        // Update existing terrain or create new one
        if (initialData?.id_terrain) {
          terrainData.statut = initialData.statut;
          
          const { data: updatedTerrain, error } = await supabase
            .from('terrain')
            .update(terrainData)
            .eq('id_terrain', initialData.id_terrain)
            .select('*')
            .single();
            
          if (error) throw error;
          
          console.log("Terrain updated:", updatedTerrain);
          toast.success("Terrain modifié avec succès");
          
          // Return the updated terrain data for UI update
          onSubmitSuccess({
            ...initialData,
            ...terrainData,
            ...updatedTerrain
          });
        } else {
          terrainData.statut = false;
          // Remove id_terrain if creating a new terrain
          const { id_terrain, ...dataSansId } = terrainData;

          const { data: newTerrain, error } = await supabase
            .from('terrain')
            .insert(dataSansId)
            .select('*')
            .single();
            
          if (error) throw error;
          
          console.log("Terrain saved:", newTerrain);
          
          // Send notification to supervisors
          const { data: supervisors } = await supabase
            .from('utilisateur')
            .select('id_utilisateur')
            .eq('id_role', 3); // 3 = superviseur
            
          if (supervisors && supervisors.length > 0 && userId) {
            await sendNotification(
              supabase,
              userId,
              supervisors,
              "Nouveau terrain",
              `Un nouveau terrain '${data.nom_terrain}' a été ajouté en attente de validation`,
              "info",
              "terrain",
              newTerrain.id_terrain
            );
          }
          
          toast.success("Terrain ajouté avec succès");
          
          // Return the new terrain data for UI update
          onSubmitSuccess(newTerrain);
        }
      }
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
        {isValidationMode ? (
          // Validation mode - show summary and validation form
          <ValidationForm 
            form={form}
            photoValidationUrls={photoValidationUrls}
            setPhotoValidationUrls={setPhotoValidationUrls}
            validationPhotos={validationPhotos}
            setValidationPhotos={setValidationPhotos}
            terrain={initialData!}
          />
        ) : (
          // Regular mode - show full terrain form
          <TerrainFormFields 
            form={form}
            userRole={userRole}
            userId={userId}
            agriculteurs={agriculteurs}
            techniciens={techniciens}
            photoUrls={photoUrls}
            setPhotoUrls={setPhotoUrls}
            photos={photos}
            setPhotos={setPhotos}
            polygonCoordinates={polygonCoordinates}
            setPolygonCoordinates={setPolygonCoordinates}
          />
        )}
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isValidationMode ? "Valider le terrain" : 
              initialData?.id_terrain ? "Mettre à jour" : "Ajouter le terrain"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TerrainForm;
