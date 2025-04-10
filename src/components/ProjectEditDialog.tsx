
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
  project: any;
  onSubmitSuccess: () => void;
  userId?: string;
  userRole?: string;
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
  userId,
  userRole
}) => {
  const handleSubmit = async (data: any) => {
    try {
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
        
      if (projectError) throw projectError;
      
      // Delete existing project cultures and add new ones
      const { error: deleteError } = await supabase
        .from('projet_culture')
        .delete()
        .eq('id_projet', project.id_projet);
        
      if (deleteError) throw deleteError;
      
      // Insert new project cultures
      const projetCultures = data.cultures.map((cultureId: number) => {
        return {
          id_projet: project.id_projet,
          id_culture: cultureId,
          cout_exploitation_previsionnel: data.financialSummary?.totalCost / data.cultures.length || 0,
          rendement_previsionnel: 0,
          date_debut_previsionnelle: new Date().toISOString().split('T')[0]
        };
      });
      
      const { error: insertError } = await supabase
        .from('projet_culture')
        .insert(projetCultures);
        
      if (insertError) throw insertError;
      
      toast.success("Projet mis à jour avec succès");
      onSubmitSuccess();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Erreur lors de la mise à jour du projet");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={project}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
