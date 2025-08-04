import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProjectData } from "./ProjectTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import ProjectSummary from "./ProjectSummary";
import PhotoUploader from "./PhotoUploader";
import ContractTemplate from './ContractTemplate';

interface ProjectValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSubmitSuccess: () => void;
  userId?: string;
  userRole?: string | null;
}

const ProjectValidationDialog: React.FC<ProjectValidationDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
  userId,
  userRole
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationDate, setValidationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validationReport, setValidationReport] = useState("");
  const [validationDecision, setValidationDecision] = useState<"valider" | "rejetter">("valider");
  const [validationPhotos, setValidationPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [signedContract, setSignedContract] = useState<File | null>(null);
  const contractFileRef = useRef<HTMLInputElement>(null);
  
  const resetForm = () => {
    setValidationDate(format(new Date(), 'yyyy-MM-dd'));
    setValidationReport("");
    setValidationDecision("valider");
    setValidationPhotos([]);
    setPhotoUrls([]);
    setSignedContract(null);
    if (contractFileRef.current) {
      contractFileRef.current.value = '';
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setValidationPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };
  
  const removePhoto = (index: number) => {
    setValidationPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    
    setPhotoUrls(prevUrls => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validation du type de fichier
    if (file.type !== 'application/pdf') {
      toast.error("Seuls les fichiers PDF sont acceptés pour le contrat");
      if (contractFileRef.current) {
        contractFileRef.current.value = '';
      }
      return;
    }
    
    // Validation de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10MB");
      if (contractFileRef.current) {
        contractFileRef.current.value = '';
      }
      return;
    }
    
    setSignedContract(file);
    toast.success("Contrat signé ajouté avec succès");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const triggerContractUpload = () => {
    contractFileRef.current?.click();
  };
  
  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Utilisateur non authentifié");
      return;
    }
    
    if (validationDecision === "valider" && !signedContract) {
      toast.error("Le contrat signé est requis pour valider le projet");
      return;
    }
    
    if (validationDecision === "rejetter" && !showRejectConfirmation) {
      setShowRejectConfirmation(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const uploadedPhotoUrls: string[] = [];
      let signedContractUrl = "";
      
      if (validationPhotos.length > 0) {
        for (const photo of validationPhotos) {
          const fileName = `${project.id_projet}_validation_${Date.now()}_${photo.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('projet-photos')
            .upload(`validation/${fileName}`, photo);
            
          if (uploadError) {
            console.error("Erreur lors de l'upload de la photo:", uploadError);
            continue;
          }
          
          const { data } = supabase.storage
            .from('projet-photos')
            .getPublicUrl(`validation/${fileName}`);
            
          if (data && data.publicUrl) {
            uploadedPhotoUrls.push(data.publicUrl);
          }
        }
      }
      
      if (signedContract && validationDecision === "valider") {
        const fileName = `${project.id_projet}_contrat_signe_${Date.now()}_${signedContract.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('projet-contracts')
          .upload(fileName, signedContract);
          
        if (uploadError) {
          console.error("Erreur lors de l'upload du contrat:", uploadError);
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('projet-contracts')
          .getPublicUrl(fileName);
          
        if (data) {
          signedContractUrl = data.publicUrl;
        }
      }
      
      const newStatus = validationDecision === "valider" ? "en financement" : "rejeté";
      
      console.log("Updating project with status:", newStatus);
      
      const { error: updateError } = await supabase
        .from('projet')
        .update({
          statut: newStatus,
          date_validation: validationDate,
          rapport_validation: validationReport || null,
          photos_validation: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls.join(',') : null,
          contrat_signe: signedContractUrl || null,
          id_validateur: userId
        })
        .eq('id_projet', project.id_projet);
        
      if (updateError) {
        console.error("Error updating project:", updateError);
        throw updateError;
      }
      
      const notificationTitle = validationDecision === "valider" 
        ? "Projet validé" 
        : "Projet rejeté";
        
      const notificationBody = validationDecision === "valider"
        ? `Votre projet "${project.titre || `Projet #${project.id_projet}`}" a été validé et est maintenant en phase de financement.`
        : `Votre projet "${project.titre || `Projet #${project.id_projet}`}" a été rejeté. ${validationReport ? `Raison: ${validationReport}` : ''}`;
      
      if (project.id_tantsaha) {
        await supabase.from('notification').insert({
          titre: notificationTitle,
          message: notificationBody,
          id_destinataire: project.id_tantsaha,
          type: "projet",
          entity_id: project.id_projet,
          lu: false
        });
      }
      
      if (userRole === 'technicien' && project.id_superviseur && project.id_superviseur !== userId) {
        await supabase.from('notification').insert({
          titre: `${notificationTitle} par un technicien`,
          message: `Le technicien a ${validationDecision === "valider" ? "validé" : "rejeté"} le projet "${project.titre || `Projet #${project.id_projet}`}"`,
          id_destinataire: project.id_superviseur,
          type: "projet",
          entity_id: project.id_projet,
          lu: false
        });
      }
      
      toast.success(validationDecision === "valider" 
        ? "Projet validé avec succès et en attente de financement" 
        : "Projet rejeté avec succès");
        
      onSubmitSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la validation du projet:", error);
      toast.error("Une erreur est survenue lors de la validation");
    } finally {
      setIsSubmitting(false);
      setShowRejectConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du projet</DialogTitle>
          </DialogHeader>
          
          <ProjectSummary project={project} />
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="validation-date">Date de validation</Label>
                <Input
                  id="validation-date"
                  type="date"
                  value={validationDate}
                  onChange={(e) => setValidationDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="validation-report">Rapport de validation (optionnel)</Label>
                <Textarea
                  id="validation-report"
                  placeholder="Saisissez les détails de votre évaluation..."
                  value={validationReport}
                  onChange={(e) => setValidationReport(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Décision</Label>
                <RadioGroup 
                  value={validationDecision} 
                  onValueChange={(value) => setValidationDecision(value as "valider" | "rejetter")}
                  className="flex space-x-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="valider" id="valider" />
                    <Label htmlFor="valider" className="cursor-pointer">Valider</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rejetter" id="rejetter" />
                    <Label htmlFor="rejetter" className="cursor-pointer">Rejeter</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <PhotoUploader
                photoUrls={photoUrls}
                onAddPhotos={handleFileChange}
                onRemovePhoto={removePhoto}
                label="Photos de validation (optionnel)"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <ContractTemplate project={project} />
              </div>
              <div className="space-y-2">
                <Label>Contrat signé</Label>
                <div className="space-y-2">
                  <input
                    ref={contractFileRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleContractFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerContractUpload}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {signedContract ? "Modifier le contrat" : "Choisir un fichier PDF"}
                  </Button>
                  {signedContract && (
                    <p className="text-xs text-muted-foreground">
                      Fichier sélectionné: {signedContract.name}
                    </p>
                  )}
                  {validationDecision === "valider" && (
                    <p className="text-xs text-muted-foreground">
                      *Le contrat signé est requis pour valider le projet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : validationDecision === "valider" ? (
                "Valider le projet"
              ) : (
                "Rejeter le projet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showRejectConfirmation} onOpenChange={setShowRejectConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le rejet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir rejeter ce projet ? Cette action ne peut pas être annulée.
              {!validationReport && (
                <p className="mt-2 text-amber-500">
                  Nous vous recommandons de fournir un rapport expliquant les raisons du rejet.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRejectConfirmation(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectValidationDialog;
