
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TerrainForm from "@/components/terrain/TerrainForm";
import { TerrainData } from "@/types/terrain";
import { supabase } from "@/integrations/supabase/client";

interface TerrainEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrain?: TerrainData;
  onSubmitSuccess: (updatedTerrain: TerrainData) => void; // Updated to return the terrain data
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  isValidationMode?: boolean;
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  isOpen,
  onClose,
  terrain,
  onSubmitSuccess,
  userId,
  userRole,
  agriculteurs = [],
  isValidationMode = false
}) => {
  const [techniciens, setTechniciens] = useState<{ id_utilisateur: string; nom: string; prenoms?: string }[]>([]);
  
  // Fetch techniciens when dialog opens if user is superviseur
  useEffect(() => {
    if (isOpen && userRole === 'superviseur') {
      const fetchTechniciens = async () => {
        try {
          // Using the correct role ID (4 for 'technicien')
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('id_utilisateur, nom, prenoms')
            .eq('id_role', 4); // 4 = technicien
          
          if (error) {
            console.error("Error fetching techniciens:", error);
            return;
          }
          
          setTechniciens(data || []);
        } catch (error) {
          console.error("Error in fetchTechniciens:", error);
        }
      };
      
      fetchTechniciens();
    }
  }, [isOpen, userRole]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain?.id_terrain 
              ? isValidationMode 
                ? "Validation du terrain" 
                : "Modifier le terrain" 
              : "Ajouter un terrain"
            }
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          initialData={terrain}
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onClose}
          userId={userId}
          userRole={userRole}
          agriculteurs={agriculteurs}
          techniciens={techniciens}
          isValidationMode={isValidationMode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TerrainEditDialog;
