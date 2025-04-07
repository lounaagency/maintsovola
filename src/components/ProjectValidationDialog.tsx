
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
  
  const resetForm = () => {
    setValidationDate(format(new Date(), 'yyyy-MM-dd'));
    setValidationReport("");
    setValidationDecision("valider");
    setValidationPhotos([]);
    setPhotoUrls([]);
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
  
  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Utilisateur non authentifié");
      return;
    }
    
    if (validationDecision === "rejetter" && !showRejectConfirmation) {
      setShowRejectConfirmation(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const uploadedPhotoUrls: string[] = [];
      
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
      
      const newStatus = validationDecision === "valider" ? "en financement" : "rejeté";
      
      console.log("Updating project status to:", newStatus);
      
      const { error: updateError } = await supabase
        .from('projet')
        .update({
          statut: newStatus,
          date_validation: validationDate,
          rapport_validation: validationReport || null,
          photos_validation: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls.join(',') : null,
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
          
          <div className="space-y-4">
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
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
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
