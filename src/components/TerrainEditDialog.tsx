
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
  initialData?: TerrainData | null;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string; photo_profil?: string }[];
  isValidationMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  terrain?: TerrainData;
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  userId,
  userRole,
  agriculteurs = [],
  techniciens = [],
  isValidationMode = false,
  isOpen,
  onClose,
  terrain
}) => {
  // Handle both the old and new prop patterns
  const effectiveClose = onClose || onCancel;
  const effectiveOpen = isOpen !== undefined ? isOpen : true;
  const effectiveTerrain = terrain || initialData;
  
  return (
    <Dialog open={effectiveOpen} onOpenChange={effectiveClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {effectiveTerrain?.id_terrain 
              ? isValidationMode 
                ? "Validation du terrain" 
                : "Modifier le terrain" 
              : "Ajouter un terrain"
            }
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          initialData={effectiveTerrain}
          onSubmitSuccess={onSubmitSuccess}
          onCancel={effectiveClose}
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
