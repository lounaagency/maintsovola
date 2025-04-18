
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectData } from "./ProjectTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProjectValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: number;
}

const ProjectValidationDialog: React.FC<ProjectValidationDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      fetchProjectDetails();
    }
  }, [isOpen, project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms),
          terrain:id_terrain(*),
          projet_culture:projet_culture(
            id_projet_culture,
            cout_exploitation_previsionnel,
            culture:id_culture(nom_culture)
          )
        `)
        .eq('id_projet', project)
        .single();
      
      if (error) throw error;
      
      setProjectData(data);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!projectData || !user) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('projet')
        .update({
          statut: 'validé',
          id_validateur: user.id,
          date_validation: new Date().toISOString()
        })
        .eq('id_projet', projectData.id_projet);
      
      if (error) throw error;
      
      toast.success('Projet validé avec succès');
      onClose();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valider le projet</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : projectData ? (
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir valider le projet{" "}
              <span className="font-semibold">
                {projectData.titre || projectData.nom_projet || `Projet #${projectData.id_projet}`}
              </span>
              ?
            </p>
            
            <p className="text-sm text-muted-foreground">
              Une fois validé, le projet sera ouvert pour la levée de fonds.
            </p>
          </div>
        ) : (
          <p className="text-red-500">Impossible de charger les détails du projet</p>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleValidate} 
            disabled={isSubmitting || !projectData}
          >
            {isSubmitting ? 'Validation...' : 'Valider le projet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectValidationDialog;
