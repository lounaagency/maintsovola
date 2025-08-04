import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ContractFileUploaderProps {
  signedContract: File | null;
  onContractChange: (file: File | null) => void;
  isSubmitting: boolean;
  required?: boolean;
}

const ContractFileUploader: React.FC<ContractFileUploaderProps> = ({
  signedContract,
  onContractChange,
  isSubmitting,
  required = false
}) => {
  const contractFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔒 ContractFileUploader: Changement de fichier détecté");
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files?.[0];
    if (!file) {
      console.log("🔒 ContractFileUploader: Aucun fichier sélectionné");
      onContractChange(null);
      return;
    }
    
    console.log("🔒 ContractFileUploader: Fichier sélectionné:", file.name, file.type, file.size);
    
    // Validation du type de fichier
    if (file.type !== 'application/pdf') {
      toast.error("Seuls les fichiers PDF sont acceptés pour le contrat");
      if (contractFileRef.current) {
        contractFileRef.current.value = '';
      }
      onContractChange(null);
      return;
    }
    
    // Validation de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10MB");
      if (contractFileRef.current) {
        contractFileRef.current.value = '';
      }
      onContractChange(null);
      return;
    }
    
    onContractChange(file);
    console.log("🔒 ContractFileUploader: Contrat ajouté avec succès");
    toast.success("Contrat signé ajouté avec succès");
  };

  const triggerFileSelect = (e: React.MouseEvent) => {
    console.log("🔒 ContractFileUploader: Déclenchement sélection fichier");
    e.preventDefault();
    e.stopPropagation();
    contractFileRef.current?.click();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    console.log("🔒 ContractFileUploader: Clic sur conteneur intercepté");
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="space-y-2" 
      onClick={handleContainerClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <Label>Contrat signé</Label>
      <input
        ref={contractFileRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />
      <Button
        type="button"
        variant="outline"
        onClick={triggerFileSelect}
        disabled={isSubmitting}
        className="w-full"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {signedContract ? "Modifier le contrat" : "Choisir un fichier PDF"}
      </Button>
      {signedContract && (
        <p className="text-xs text-muted-foreground">
          Fichier sélectionné: {signedContract.name}
        </p>
      )}
      {required && (
        <p className="text-xs text-muted-foreground">
          *Le contrat signé est requis pour valider le projet
        </p>
      )}
    </div>
  );
};

export default ContractFileUploader;