
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

interface ProjectEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
  onSubmitSuccess: () => void;
  userId?: string;
  userRole?: string;
  isEdit?: boolean;
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
  userId,
  userRole,
  isEdit = false
}) => {
  const handleSubmit = async (data: any) => {
    try {
      if (isEdit) {
        console.log("Updating project with data:", data);
        
        // Update the project
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
          // Find the corresponding culture data
          const cultureInfo = culturesData.find((c) => c.id_culture === cultureId);
          
          // Calculate financials based on terrain surface
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
        
        console.log("Inserting project cultures:", projetCultures);
        
        const { error: insertError } = await supabase
          .from('projet_culture')
          .insert(projetCultures);
          
        if (insertError) {
          console.error("Error inserting project cultures:", insertError);
          throw insertError;
        }
        
        toast.success("Projet mis à jour avec succès");
      } else {
        // Create new project
        console.log("Creating new project with data:", data);
        
        // Insert the new project
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
            id_tantsaha: data.id_tantsaha,
            id_technicien: data.id_technicien,
            id_superviseur: data.id_superviseur
          })
          .select()
          .single();

        if (projectError || !newProject) {
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

        // Create project cultures entries
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

        const { error: culturesError } = await supabase
          .from('projet_culture')
          .insert(projetCultures);

        if (culturesError) {
          console.error("Error creating project cultures:", culturesError);
          throw culturesError;
        }

        toast.success("Projet créé avec succès");

        // Envoyer des notifications pour la création du projet
        try {
          const recipients: { id_utilisateur: string }[] = [];
          
          if (data.id_superviseur) {
            recipients.push({ id_utilisateur: data.id_superviseur });
          }
          if (data.id_technicien) {
            recipients.push({ id_utilisateur: data.id_technicien });
          }

          if (recipients.length > 0) {
            const { sendNotification } = await import('@/types/notification');
            await sendNotification(
              supabase,
              data.id_tantsaha,
              recipients,
              "Nouveau projet créé",
              `Un nouveau projet "${data.titre}" a été créé et vous a été assigné`,
              'info',
              'projet',
              newProject.id_projet,
              newProject.id_projet
            );
          }
        } catch (error) {
          console.error("Erreur lors de l'envoi des notifications:", error);
        }
      }

      if (isEdit) {
        // Envoyer des notifications pour la modification du projet
        try {
          const recipients: { id_utilisateur: string }[] = [];
          
          if (data.id_superviseur && data.id_superviseur !== userId) {
            recipients.push({ id_utilisateur: data.id_superviseur });
          }
          if (data.id_technicien && data.id_technicien !== userId) {
            recipients.push({ id_utilisateur: data.id_technicien });
          }
          if (project.id_tantsaha && project.id_tantsaha !== userId) {
            recipients.push({ id_utilisateur: project.id_tantsaha });
          }

          if (recipients.length > 0 && userId) {
            const { sendNotification } = await import('@/types/notification');
            await sendNotification(
              supabase,
              userId,
              recipients,
              "Projet modifié",
              `Le projet "${data.titre}" a été mis à jour`,
              'info',
              'projet',
              project.id_projet,
              project.id_projet
            );
          }
        } catch (error) {
          console.error("Erreur lors de l'envoi des notifications:", error);
        }
      }
      
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Error handling project:", error);
      toast.error(isEdit ? "Erreur lors de la mise à jour du projet" : "Erreur lors de la création du projet");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le projet" : "Créer un nouveau projet"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={project}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isEditing={isEdit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
