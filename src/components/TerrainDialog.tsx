
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerrainData } from "@/types/terrain";
import { TerrainForm } from "@/components/terrain/TerrainForm";
import { supabase } from "@/integrations/supabase/client";

interface TerrainDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onTerrainUpdate: () => void;
  terrain: TerrainData | null;
}

const TerrainDialog: React.FC<TerrainDialogProps> = ({
  open,
  setOpen,
  onTerrainUpdate,
  terrain
}) => {
  const [agriculteurs, setAgriculteurs] = React.useState<any[]>([]);
  const [techniciens, setTechniciens] = React.useState<any[]>([]);
  const { user } = { user: { id: '' } }; // This will be replaced by useAuth() in a complete implementation

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: agriculteurData } = await supabase
          .from('utilisateurs_par_role')
          .select('id_utilisateur, nom, prenoms')
          .eq('nom_role', 'simple');
          
        if (agriculteurData) {
          setAgriculteurs(agriculteurData);
        }

        const { data: technicienData } = await supabase
          .from('utilisateurs_par_role')
          .select('id_utilisateur, nom, prenoms')
          .eq('nom_role', 'technicien');
          
        if (technicienData) {
          setTechniciens(technicienData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain ? "Modifier le terrain" : "Ajouter un terrain"}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <TerrainForm
            initialData={terrain || undefined}
            onSubmitSuccess={() => {
              onTerrainUpdate();
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            userId={user?.id || ''}
            agriculteurs={agriculteurs}
            techniciens={techniciens}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerrainDialog;
