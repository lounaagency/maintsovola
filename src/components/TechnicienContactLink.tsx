
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserAvatar from "./UserAvatar";
import MessageDialog from "./MessageDialog";

interface TechnicienContactLinkProps {
  technicienId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  variant?: "icon" | "button" | "avatar";
}

const TechnicienContactLink: React.FC<TechnicienContactLinkProps> = ({
  technicienId,
  className = "",
  size = "sm",
  showName = false,
  variant = "icon"
}) => {
  const { user } = useAuth();
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [technicien, setTechnicien] = useState<{
    id: string;
    name: string;
    photo?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch technicien details when component mounts or when technicienId changes
  useEffect(() => {
    if (technicienId && !technicien) {
      fetchTechnicienDetails();
    }
  }, [technicienId]);

  // Fetch technicien details from Supabase
  const fetchTechnicienDetails = async () => {
    if (!technicienId || technicien) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .eq('id_utilisateur', technicienId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setTechnicien({
          id: data.id_utilisateur,
          name: `${data.nom} ${data.prenoms || ''}`.trim(),
          photo: data.photo_profil
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du technicien:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    setIsMessageDialogOpen(true);
  };

  // Don't render anything if the user is not logged in or if the user is the technician
  if (!user || user.id === technicienId) {
    return null;
  }

  const buttonSize = {
    sm: "h-8 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4"
  }[size];

  // Render avatar variant
  if (variant === "avatar") {
    return (
      <>
        <div 
          className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md ${className}`}
          onClick={handleClick}
        >
          <UserAvatar 
            src={technicien?.photo} 
            alt={technicien?.name || "Technicien"} 
            size="sm"
          />
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{technicien?.name || "Technicien"}</span>
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
        </div>

        {isMessageDialogOpen && technicien && (
          <MessageDialog
            isOpen={isMessageDialogOpen}
            onClose={() => setIsMessageDialogOpen(false)}
            recipient={{
              id: technicien.id,
              name: technicien.name
            }}
          />
        )}
      </>
    );
  }

  // Render default button variant
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        className={`${buttonSize} flex items-center gap-1 hover:bg-muted/50 ${className}`}
        onClick={handleClick}
      >
        <MessageSquare className="h-4 w-4" />
        {showName && <span>Contacter</span>}
      </Button>

      {isMessageDialogOpen && technicien && (
        <MessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
          recipient={{
            id: technicien.id,
            name: technicien.name
          }}
        />
      )}
    </>
  );
};

export default TechnicienContactLink;
