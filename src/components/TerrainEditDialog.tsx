
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
  onSubmitSuccess: () => void;
  userId: string;
  userRole?: string;
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  isOpen,
  onClose,
  terrain,
  onSubmitSuccess,
  userId,
  userRole,
}) => {
  const [agriculteurs, setAgriculteurs] = useState<{ id_utilisateur: string; nom: string; prenoms?: string }[]>([]);
  
  // We no longer need processedTerrain as we'll pass terrain directly to the form
  // and handle any necessary processing in the TerrainForm component itself

  // Fetch agriculteurs when the dialog opens and userRole is technicien or superviseur
  useEffect(() => {
    if (isOpen && (userRole === 'technicien' || userRole === 'superviseur')) {
      const fetchAgriculteurs = async () => {
        try {
          // Using the correct role ID (1 for 'simple' which is agriculteur)
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('id_utilisateur, nom, prenoms')
            .eq('id_role', 1); // 1 = simple (agriculteur)
          
          if (error) {
            console.error("Error fetching agriculteurs:", error);
            return;
          }
          
          console.log("Fetched agriculteurs:", data);
          setAgriculteurs(data || []);
        } catch (error) {
          console.error("Error in fetchAgriculteurs:", error);
        }
      };
      
      fetchAgriculteurs();
    }
  }, [isOpen, userRole]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain?.id_terrain ? "Modifier le terrain" : "Ajouter un terrain"}
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          initialData={terrain}
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onClose}
          userId={userId}
          userRole={userRole}
          agriculteurs={agriculteurs}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TerrainEditDialog;
