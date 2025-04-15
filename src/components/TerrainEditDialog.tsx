
import React, { useState } from "react";
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
import TerrainForm from "@/components/TerrainForm";
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
  
  const isNew = !terrain || !terrain.id_terrain;

  // Handle submission success from the TerrainForm component
  const handleSubmissionSuccess = async () => {
    if (terrain && terrain.id_terrain) {
      try {
        // Fetch the updated terrain data
        const { data: updatedTerrain, error } = await supabase
          .from('terrain')
          .select('*')
          .eq('id_terrain', terrain.id_terrain)
          .single();
          
        if (error) throw error;
        
        onSubmitSuccess(updatedTerrain as TerrainData);
      } catch (error) {
        console.error("Error fetching updated terrain:", error);
      }
    }
    
    // Close the dialog
    onClose();
  };

  // Improved focus management
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Allow proper focus return before closing
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
            onSubmitSuccess={handleSubmissionSuccess}
            onCancel={onClose}
            userRole={userRole}
            userId={userId}
            agriculteurs={agriculteurs}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TerrainEditDialog;
