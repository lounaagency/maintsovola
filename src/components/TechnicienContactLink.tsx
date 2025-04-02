
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import MessageDialog from "@/components/MessageDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TechnicienContactLinkProps {
  technicienId?: string;
  technicienNom?: string;
  technicienPrenoms?: string;
  terrainId?: number;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  actionType?: "modify" | "delete" | "contact";
  children?: React.ReactNode;
}

const TechnicienContactLink: React.FC<TechnicienContactLinkProps> = ({
  technicienId,
  technicienNom,
  technicienPrenoms,
  terrainId,
  buttonVariant = "default",
  className,
  actionType = "contact",
  children
}) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const { user } = useAuth();

  const handleContactClick = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour contacter un technicien");
      return;
    }

    if (!technicienId) {
      toast.error("Aucun technicien assigné à ce terrain");
      return;
    }

    setMessageDialogOpen(true);
  };

  const getSubject = () => {
    switch (actionType) {
      case "modify":
        return `Demande de modification du terrain #${terrainId}`;
      case "delete":
        return `Demande de suppression du terrain #${terrainId}`;
      default:
        return `Concernant le terrain #${terrainId}`;
    }
  };

  const getMessage = () => {
    switch (actionType) {
      case "modify":
        return `Bonjour,\nJ'aimerais demander la modification de mon terrain #${terrainId}. Pouvez-vous m'aider dans cette démarche ?\nMerci.`;
      case "delete":
        return `Bonjour,\nJ'aimerais demander la suppression de mon terrain #${terrainId}. Pouvez-vous m'aider dans cette démarche ?\nMerci.`;
      default:
        return "";
    }
  };

  const technicienName = technicienPrenoms && technicienNom 
    ? `${technicienPrenoms} ${technicienNom}` 
    : "Technicien";

  return (
    <>
      <Button 
        variant={buttonVariant} 
        size="sm" 
        className={className}
        onClick={handleContactClick}
        disabled={!technicienId}
      >
        {children || (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Contacter le technicien
          </>
        )}
      </Button>

      {messageDialogOpen && (
        <MessageDialog
          isOpen={messageDialogOpen}
          onClose={() => setMessageDialogOpen(false)}
          recipient={{
            id: technicienId as string,
            name: technicienName
          }}
          subject={getSubject()}
          initialMessage={getMessage()}
        />
      )}
    </>
  );
};

export default TechnicienContactLink;
