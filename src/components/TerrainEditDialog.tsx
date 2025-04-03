
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
  const [processedTerrain, setProcessedTerrain] = useState<TerrainData | undefined>(terrain);
  
  // Process terrain data when it changes
  useEffect(() => {
    if (terrain) {
      const processed = { ...terrain };
      
      // Make sure photos is properly formatted
      if (typeof processed.photos === 'string') {
        processed.photos = processed.photos.split(',').filter(p => p.trim() !== '');
      }
      
      // Process the geometry for proper display
      if (processed.geom && typeof processed.geom === 'string') {
        try {
          processed.geom = JSON.parse(processed.geom);
        } catch (e) {
          console.error('Error parsing geometry:', e);
        }
      }
      
      setProcessedTerrain(processed);
    } else {
      setProcessedTerrain(undefined);
    }
  }, [terrain]);

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
            {processedTerrain?.id_terrain ? "Modifier le terrain" : "Ajouter un terrain"}
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          initialData={processedTerrain}
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
