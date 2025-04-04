
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
import UserAvatar from "@/components/UserAvatar";

interface TerrainEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrain?: TerrainData;
  onSubmitSuccess: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string; photo_profil?: string }[];
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
  const [techniciens, setTechniciens] = useState<{ id_utilisateur: string; nom: string; prenoms?: string; photo_profil?: string }[]>([]);
  
  // Fetch techniciens when dialog opens if user is superviseur
  useEffect(() => {
    if (isOpen && userRole === 'superviseur') {
      const fetchTechniciens = async () => {
        try {
          // Using the correct role ID (4 for 'technicien')
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('id_utilisateur, nom, prenoms, photo_profil')
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

  // Détermine le titre du dialogue en fonction du mode et de l'existence du terrain
  const getDialogTitle = () => {
    if (terrain?.id_terrain) {
      if (isValidationMode) {
        return (
          <div className="flex items-center gap-2">
            <span>Validation du terrain</span>
            {terrain.tantsahaNom && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                <span>Propriétaire:</span>
                <UserAvatar 
                  src={terrain.tantsahaPhotoProfile} 
                  alt={terrain.tantsahaNom || 'Propriétaire'} 
                  size="sm" 
                />
                <span>{terrain.tantsahaNom}</span>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <span>Modifier le terrain</span>
            {terrain.tantsahaNom && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                <span>Propriétaire:</span>
                <UserAvatar 
                  src={terrain.tantsahaPhotoProfile} 
                  alt={terrain.tantsahaNom || 'Propriétaire'} 
                  size="sm" 
                />
                <span>{terrain.tantsahaNom}</span>
              </div>
            )}
          </div>
        );
      }
    } else {
      return "Ajouter un terrain";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
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
