
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import MessageDialog from "@/components/MessageDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TechnicienContactLinkProps {
  projetId: number;
}

const TechnicienContactLink: React.FC<TechnicienContactLinkProps> = ({ projetId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [technicien, setTechnicien] = useState<{
    id: string;
    nom: string;
    prenoms?: string;
    photo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTechnicien = async () => {
    if (technicien) {
      setIsDialogOpen(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projet')
        .select(`
          id_technicien,
          technicien:id_technicien(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .eq('id_projet', projetId)
        .single();

      if (error) throw error;
      
      if (data?.technicien) {
        setTechnicien({
          id: data.technicien.id_utilisateur,
          nom: data.technicien.nom,
          prenoms: data.technicien.prenoms,
          photo: data.technicien.photo_profil
        });
        setIsDialogOpen(true);
      } else {
        toast({
          title: "Information",
          description: "Aucun technicien n'est assigné à ce projet pour le moment."
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du technicien:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations du technicien",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!technicien && loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary rounded-full border-t-transparent"></div>
        Chargement...
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchTechnicien}
        className="flex items-center gap-1"
      >
        <MessageSquare className="h-4 w-4" />
        Contacter le technicien
      </Button>

      {technicien && (
        <MessageDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          recipientId={technicien.id}
          recipientName={`${technicien.nom} ${technicien.prenoms || ""}`}
          recipientPhoto={technicien.photo}
        />
      )}
    </>
  );
};

export default TechnicienContactLink;
