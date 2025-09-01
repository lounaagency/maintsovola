
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TerrainData } from "@/types/terrain";
import { toast } from "sonner";
import TerrainForm from "@/components/terrain/TerrainForm";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TerrainEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrain?: TerrainData;
  onSubmitSuccess: (terrain: TerrainData) => void;
  userId: string;
  userRole?: string;
  isValidationMode?: boolean;
  agriculteurs?: {id_utilisateur: string; nom: string; prenoms?: string}[];
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  isOpen,
  onClose,
  terrain,
  onSubmitSuccess,
  userId,
  userRole = 'simple',
  isValidationMode = false,
  agriculteurs = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TerrainData> | null>(null);
  
  const isNew = !terrain || !terrain.id_terrain;

  const handleSubmit = async (data: Partial<TerrainData>) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Handle image URLs (convert arrays to strings)
      const dataToSave = {...data};
      
      if (Array.isArray(dataToSave.photos)) {
        dataToSave.photos = dataToSave.photos.join(',');
      }
      
      if (Array.isArray(dataToSave.photos_validation)) {
        dataToSave.photos_validation = dataToSave.photos_validation.join(',');
      }
      
      let result;
      
      if (isNew) {
        // Create new terrain
        const newTerrain = {
          ...dataToSave,
          id_tantsaha: userRole === 'simple' ? userId : data.id_tantsaha,
          statut: false,
          archive: false,
          created_by: userId
        };
        
        const { data: insertedData, error } = await supabase
          .from('terrain')
          .insert(newTerrain as any)
          .select('*')
          .single();
          
        if (error) throw error;
        result = insertedData;
        
        toast.success("Terrain ajouté avec succès");
      } else if (isValidationMode && terrain) {
        // Update terrain and set as validated
        const updatedTerrain = {
          ...dataToSave,
          statut: true,
          surface_validee: data.surface_validee || terrain.surface_proposee,
          id_superviseur: userId,
          date_validation: new Date().toISOString().split('T')[0]
        };
        
        const { data: updatedData, error } = await supabase
          .from('terrain')
          .update(updatedTerrain as any)
          .eq('id_terrain', terrain.id_terrain)
          .select('*')
          .single();
          
        if (error) throw error;
        result = updatedData;
        
        // Send notification to owner
        if (terrain.id_tantsaha) {
          await supabase
            .from('notification')
            .insert({
              id_destinataire: terrain.id_tantsaha,
              id_expediteur: userId,
              titre: "Terrain validé",
              message: `Votre terrain ${terrain.nom_terrain} a été validé`,
              type: "success",
              entity_type: "terrain",
              entity_id: terrain.id_terrain
            });
        }
        
        // Send notification to technician if assigned
        if (terrain.id_technicien) {
          await supabase
            .from('notification')
            .insert({
              id_destinataire: terrain.id_technicien,
              id_expediteur: userId,
              titre: "Terrain validé",
              message: `Le terrain ${terrain.nom_terrain} a été validé`,
              type: "success",
              entity_type: "terrain",
              entity_id: terrain.id_terrain
            });
        }
        
        toast.success("Terrain validé avec succès");
      } else if (terrain) {
        // Update existing terrain
        const { data: updatedData, error } = await supabase
          .from('terrain')
          .update(dataToSave as any)
          .eq('id_terrain', terrain.id_terrain)
          .select('*')
          .single();
          
        if (error) throw error;
        result = updatedData;
        
        toast.success("Terrain mis à jour avec succès");
      }
      
      // Pour les nouveaux terrains, laisser le parent (Terrain.tsx) récupérer les données complètes via fetchTerrains()
      // Cela évite les problèmes de synchronisation et garantit que toutes les jointures sont correctes
      if (result) {
        console.log("Terrain sauvegardé, données de base disponibles:", {
          id_terrain: result.id_terrain,
          nom_terrain: result.nom_terrain,
          id_tantsaha: result.id_tantsaha,
          id_region: result.id_region,
          id_district: result.id_district,
          id_commune: result.id_commune
        });
        
        // Pour les nouveaux terrains, on envoie juste les données de base
        // Le parent fera un fetchTerrains() pour récupérer les données complètes avec jointures
        if (isNew) {
          onSubmitSuccess({
            ...result,
            // Valeurs par défaut pour éviter l'affichage "Non spécifié" temporairement
            region_name: result.region_name || 'Chargement...',
            district_name: result.district_name || 'Chargement...',
            commune_name: result.commune_name || 'Chargement...',
            tantsahaNom: result.tantsahaNom || 'Chargement...',
            techniqueNom: result.techniqueNom || 'Non assigné',
            superviseurNom: result.superviseurNom || 'Non assigné'
          } as TerrainData);
        } else {
          // Pour les mises à jour, récupérer les données complètes comme avant
          // Get region name
          if (result.id_region) {
            const { data: regionData } = await supabase
              .from('region')
              .select('nom_region')
              .eq('id_region', result.id_region)
              .maybeSingle();
              
            if (regionData) {
              result.region_name = regionData.nom_region;
            }
          }
          
          // Get district name
          if (result.id_district) {
            const { data: districtData } = await supabase
              .from('district')
              .select('nom_district')
              .eq('id_district', result.id_district)
              .maybeSingle();
              
            if (districtData) {
              result.district_name = districtData.nom_district;
            }
          }
          
          // Get commune name
          if (result.id_commune) {
            const { data: communeData } = await supabase
              .from('commune')
              .select('nom_commune')
              .eq('id_commune', result.id_commune)
              .maybeSingle();
              
            if (communeData) {
              result.commune_name = communeData.nom_commune;
            }
          }
          
          // Get farmer name
          if (result.id_tantsaha) {
            const { data: ownerData } = await supabase
              .from('utilisateur')
              .select('nom, prenoms')
              .eq('id_utilisateur', result.id_tantsaha)
              .maybeSingle();
              
            if (ownerData) {
              result.tantsahaNom = `${ownerData.nom} ${ownerData.prenoms || ''}`.trim();
            }
          }
          
          // Get technician name
          if (result.id_technicien) {
            const { data: techData } = await supabase
              .from('utilisateur')
              .select('nom, prenoms')
              .eq('id_utilisateur', result.id_technicien)
              .maybeSingle();
              
            if (techData) {
              result.techniqueNom = `${techData.nom} ${techData.prenoms || ''}`.trim();
            } else {
              result.techniqueNom = 'Non assigné';
            }
          } else {
            result.techniqueNom = 'Non assigné';
          }
          
          // Get supervisor name
          if (result.id_superviseur) {
            const { data: supervData } = await supabase
              .from('utilisateur')
              .select('nom, prenoms')
              .eq('id_utilisateur', result.id_superviseur)
              .maybeSingle();
              
            if (supervData) {
              result.superviseurNom = `${supervData.nom} ${supervData.prenoms || ''}`.trim();
            } else {
              result.superviseurNom = 'Non assigné';
            }
          } else {
            result.superviseurNom = 'Non assigné';
          }
          
          onSubmitSuccess(result as TerrainData);
        }
      }
      
      // Use setTimeout to handle modal close after state updates
      setTimeout(() => {
        onClose();
      }, 0);
    } catch (error: any) {
      console.error("Error saving terrain:", error);
      toast.error(`Erreur: ${error.message}`);
      setLoading(false);
    }
  };

  // Fixed onOpenChange handler to properly manage focus and prevent page becoming inaccessible
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Use setTimeout with 0ms delay to ensure proper focus management and DOM updates
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isValidationMode
              ? `Valider le terrain: ${terrain?.nom_terrain}`
              : isNew
                ? "Ajouter un terrain"
                : `Modifier le terrain: ${terrain?.nom_terrain}`}
          </DialogTitle>
          <DialogDescription>
            {isValidationMode 
              ? "Completez le formulaire pour valider ce terrain"
              : isNew 
                ? "Remplissez les informations du nouveau terrain"
                : "Modifiez les informations du terrain"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>{isNew ? "Création" : "Mise à jour"} du terrain en cours...</p>
          </div>
        ) : (
          <TerrainForm
            initialData={terrain}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isValidationMode={isValidationMode}
            userRole={userRole}
            userId={userId}
            agriculteurs={agriculteurs}
            onSubmitSuccess={onSubmitSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TerrainEditDialog;
