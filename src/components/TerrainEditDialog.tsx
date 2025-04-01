
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TerrainForm from "./terrain/TerrainForm";
import { TerrainData } from "@/types/terrain";

interface TerrainEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainData | null;
  onSubmitSuccess: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  isOpen,
  onClose,
  terrain,
  onSubmitSuccess,
  userId,
  userRole,
  agriculteurs
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain?.id_terrain ? 'Modifier le terrain' : 'Ajouter un terrain'}
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          id={terrain?.id_terrain?.toString()}
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onClose}
          initialData={terrain}
          userId={userId}
          userRole={userRole}
          agriculteurs={agriculteurs}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TerrainEditDialog;
