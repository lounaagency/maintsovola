
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectForm from "./ProjectForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgriculturalProject } from "@/types/agriculturalProject";

interface ProjectEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
  onSubmitSuccess: () => void;
  userId?: string;
  userRole?: string;
  mode?: 'create' | 'edit';
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
  userId,
  userRole,
  mode = 'create'
}) => {
  const handleSubmit = async (data: any) => {
    try {
      console.log("Submitting project data:", data);
      
      if (mode === 'edit') {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projet')
          .update({
            titre: data.titre,
            description: data.description,
            photos: data.photos,
            statut: data.statut,
            surface_ha: data.surface_ha,
            id_terrain: data.id_terrain,
            id_region: data.id_region,
            id_district: data.id_district,
            id_commune: data.id_commune
          })
          .eq('id_projet', project.id_projet);
          
        if (projectError) {
          console.error("Error updating project:", projectError);
          throw projectError;
        }
        
        // Delete existing project cultures and add new ones
        const { error: deleteError } = await supabase
          .from('projet_culture')
          .delete()
          .eq('id_projet', project.id_projet);
          
        if (deleteError) {
          console.error("Error deleting existing cultures:", deleteError);
          throw deleteError;
        }
        
        // Get culture details for financial calculations
        const { data: culturesData, error: cultureError } = await supabase
          .from('culture')
          .select('*')
          .in('id_culture', data.cultures);
        
        if (cultureError) {
          console.error("Error fetching culture data:", cultureError);
          throw cultureError;
        }
        
        // Calculate terrain surface area
        const terrainSurface = data.surface_ha || 0;
        
        // Insert new project cultures with calculated financial values
        const projetCultures = data.cultures.map((cultureId: number) => {
          const cultureInfo = culturesData.find((c) => c.id_culture === cultureId);
          
          const coutExploitation = cultureInfo?.cout_exploitation_ha 
            ? cultureInfo.cout_exploitation_ha * terrainSurface 
            : 0;
          
          const rendementTonne = cultureInfo?.rendement_ha 
            ? cultureInfo.rendement_ha * terrainSurface 
            : 0;
            
          const rendementFinancier = cultureInfo?.prix_tonne && rendementTonne
            ? cultureInfo.prix_tonne * rendementTonne
            : 0;
            
          return {
            id_projet: project.id_projet,
            id_culture: cultureId,
            cout_exploitation_previsionnel: coutExploitation,
            rendement_previsionnel: rendementTonne,
            rendement_financier_previsionnel: rendementFinancier,
            date_debut_previsionnelle: new Date().toISOString().split('T')[0]
          };
        });
        
        const { error: insertError } = await supabase
          .from('projet_culture')
          .insert(projetCultures);
          
        if (insertError) {
          console.error("Error inserting project cultures:", insertError);
          throw insertError;
        }
      } else {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from('projet')
          .insert({
            titre: data.titre,
            description: data.description,
            photos: data.photos,
            statut: 'en attente',
            surface_ha: data.surface_ha,
            id_terrain: data.id_terrain,
            id_region: data.id_region,
            id_district: data.id_district,
            id_commune: data.id_commune,
            id_tantsaha: data.id_tantsaha || userId,
            id_technicien: data.id_technicien,
            id_superviseur: data.id_superviseur
          })
          .select()
          .single();
          
        if (projectError) {
          console.error("Error creating project:", projectError);
          throw projectError;
        }

        // Get culture details for financial calculations
        const { data: culturesData, error: cultureError } = await supabase
          .from('culture')
          .select('*')
          .in('id_culture', data.cultures);
        
        if (cultureError) {
          console.error("Error fetching culture data:", cultureError);
          throw cultureError;
        }
        
        // Calculate terrain surface area
        const terrainSurface = data.surface_ha || 0;
        
        // Insert project cultures with calculated financial values
        const projetCultures = data.cultures.map((cultureId: number) => {
          const cultureInfo = culturesData.find((c) => c.id_culture === cultureId);
          
          const coutExploitation = cultureInfo?.cout_exploitation_ha 
            ? cultureInfo.cout_exploitation_ha * terrainSurface 
            : 0;
          
          const rendementTonne = cultureInfo?.rendement_ha 
            ? cultureInfo.rendement_ha * terrainSurface 
            : 0;
            
          const rendementFinancier = cultureInfo?.prix_tonne && rendementTonne
            ? cultureInfo.prix_tonne * rendementTonne
            : 0;
            
          return {
            id_projet: newProject.id_projet,
            id_culture: cultureId,
            cout_exploitation_previsionnel: coutExploitation,
            rendement_previsionnel: rendementTonne,
            rendement_financier_previsionnel: rendementFinancier,
            date_debut_previsionnelle: new Date().toISOString().split('T')[0]
          };
        });
        
        const { error: culturesInsertError } = await supabase
          .from('projet_culture')
          .insert(projetCultures);
          
        if (culturesInsertError) {
          console.error("Error inserting project cultures:", culturesInsertError);
          throw culturesInsertError;
        }
      }
      
      toast.success(mode === 'edit' ? "Projet mis à jour avec succès" : "Projet créé avec succès");
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Error in project submission:", error);
      toast.error(mode === 'edit' ? "Erreur lors de la mise à jour du projet" : "Erreur lors de la création du projet");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifier le projet' : 'Créer un nouveau projet'}
          </DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={project}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isEditing={mode === 'edit'}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
