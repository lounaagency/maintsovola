
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
import { X, Upload, Loader2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const resetForm = () => {
    setValidationDate(format(new Date(), 'yyyy-MM-dd'));
    setValidationReport("");
    setValidationDecision("valider");
    setValidationPhotos([]);
    setPhotoUrls([]);
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
      // Upload photos if any
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
      
      // Update project status
      const { error: updateError } = await supabase
        .from('projet')
        .update({
          statut: validationDecision === "valider" ? "en cours de financement" : "rejeté",
          date_validation: validationDate,
          rapport_validation: validationReport || null,
          photos_validation: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls.join(',') : null,
          id_validateur: userId
        })
        .eq('id_projet', project.id_projet);
        
      if (updateError) throw updateError;
      
      // Create notification for project owner
      const notificationTitle = validationDecision === "valider" 
        ? "Projet validé" 
        : "Projet rejeté";
        
      const notificationBody = validationDecision === "valider"
        ? `Votre projet "${project.titre || `Projet #${project.id_projet}`}" a été validé.`
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
      
      // Notify supervisor if current user is not the supervisor
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
        ? "Projet validé avec succès" 
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
          
          {/* Project Summary */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2">{project.titre || `Projet #${project.id_projet}`}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="flex items-center text-sm mb-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {project.region?.nom_region}, {project.district?.nom_district}, {project.commune?.nom_commune}
                  </p>
                  <p className="text-sm mb-1"><span className="font-medium">Surface:</span> {project.surface_ha} ha</p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Statut actuel:</span> {renderStatusBadge(project.statut)}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Culture(s):</span> {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Propriétaire:</span> {project.tantsaha ? `${project.tantsaha.nom} ${project.tantsaha.prenoms || ''}` : 'N/A'}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Terrain:</span> {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Date de création:</span> {project.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              {project.description && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Description:</p>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
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
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Photos de validation (optionnel)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Ajouter des photos
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Validation photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

// Helper function to render status badge
const renderStatusBadge = (status: string) => {
  let variant: "outline" | "secondary" | "destructive" | "default" = "outline";
  
  switch (status) {
    case 'en attente':
      variant = "outline";
      break;
    case 'validé':
    case 'en financement':
      variant = "secondary";
      break;
    case 'en cours':
      variant = "default";
      break;
    case 'terminé':
      variant = "secondary";
      break;
    case 'rejeté':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return <Badge variant={variant}>{status}</Badge>;
};

export default ProjectValidationDialog;
