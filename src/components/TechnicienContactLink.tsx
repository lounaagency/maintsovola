
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MessageDialog from "@/components/MessageDialog";

interface TechnicienContactLinkProps {
  technicienId: string | null | undefined;
  projetId: number;
}

interface TechnicienInfo {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
  photo_profil?: string;
}

const TechnicienContactLink: React.FC<TechnicienContactLinkProps> = ({ 
  technicienId,
  projetId 
}) => {
  const { user } = useAuth();
  const [technicien, setTechnicien] = useState<TechnicienInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (technicienId) {
      fetchTechnicienInfo();
    } else {
      setIsLoading(false);
    }
  }, [technicienId]);

  const fetchTechnicienInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .eq('id_utilisateur', technicienId)
        .single();

      if (error) throw error;
      setTechnicien(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du technicien:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (!technicien) {
    return <div className="text-sm text-gray-500">Aucun technicien assigné</div>;
  }

  return (
    <div>
      <div className="flex items-center mb-2">
        <div className="mr-2">
          <span className="font-medium">Technicien:</span>{" "}
          <span>{technicien.nom} {technicien.prenoms || ''}</span>
        </div>
        
        {user && user.id !== technicienId && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            title="Contacter le technicien"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Contacter</span>
          </Button>
        )}
      </div>

      <MessageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        recipientId={technicien.id_utilisateur}
        recipientName={`${technicien.nom} ${technicien.prenoms || ''}`}
        recipientPhoto={technicien.photo_profil}
      />
    </div>
  );
};

export default TechnicienContactLink;
