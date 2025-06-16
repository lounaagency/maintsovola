
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PhotoUploader from "./PhotoUploader";
import { sendGroupedNotification } from "@/lib/groupedNotifications";

interface JalonReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  jalonId: number;
  jalonName: string;
  datePrevue: string;
  onSubmitSuccess?: () => void;
  readOnly?: boolean;
  initialData?: {
    rapport?: string;
    dateReelle?: string;
    heureDebut?: string;
    heureFin?: string;
    photos?: string[];
  };
}

const JalonReportDialog: React.FC<JalonReportDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  jalonId,
  jalonName,
  datePrevue,
  onSubmitSuccess,
  readOnly = false,
  initialData = {}
}) => {
  const [rapport, setRapport] = useState(initialData.rapport || "");
  const [dateReelle, setDateReelle] = useState(initialData.dateReelle || datePrevue);
  const [heureDebut, setHeureDebut] = useState(initialData.heureDebut || "");
  const [heureFin, setHeureFin] = useState(initialData.heureFin || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialData.photos || []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rapport.trim()) {
      toast.error("Veuillez rédiger un rapport d'intervention");
      return;
    }

    // Validation des heures si les deux sont renseignées
    if (heureDebut && heureFin && heureDebut >= heureFin) {
      toast.error("L'heure de fin doit être postérieure à l'heure de début");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");
      
      // Convert photo URLs array to JSON string
      const photosString = photoUrls.length > 0 ? JSON.stringify(photoUrls) : null;
      
      // Update jalon with report, times and photos
      const { error: updateError } = await supabase
        .from('jalon_projet')
        .update({
          date_reelle: dateReelle,
          heure_debut: heureDebut || null,
          heure_fin: heureFin || null,
          rapport_jalon: rapport,
          photos_jalon: photosString
        })
        .eq('id_projet', projectId)
        .eq('id_jalon_agricole', jalonId);
      
      if (updateError) throw updateError;
      
      // Get project owner and investors for notifications
      const { data: projectData, error: projectError } = await supabase
        .from('projet')
        .select('id_tantsaha')
        .eq('id_projet', projectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching project data:', projectError);
      } else if (projectData) {
        // Notify project owner
        try {
          await sendGroupedNotification({
            senderId: user.id,
            recipientId: projectData.id_tantsaha,
            entityType: 'jalon',
            entityId: jalonId,
            action: 'comment',
            projetId: projectId
          });
        } catch (notifError) {
          console.error('Error sending notification to project owner:', notifError);
        }
      }
      
      // Get and notify investors
      try {
        const { data: investorsData, error: investorsError } = await supabase
          .from('investissement')
          .select('id_investisseur')
          .eq('id_projet', projectId);
          
        if (investorsError) {
          console.error('Error fetching investors:', investorsError);
        } else if (investorsData) {
          // Send notifications to all investors
          for (const investor of investorsData) {
            try {
              await sendGroupedNotification({
                senderId: user.id,
                recipientId: investor.id_investisseur,
                entityType: 'jalon',
                entityId: jalonId,
                action: 'comment',
                projetId: projectId
              });
            } catch (notifError) {
              console.error('Error sending notification to investor:', notifError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing investor notifications:', error);
      }
      
      toast.success("Rapport d'intervention enregistré avec succès");
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Impossible d'enregistrer le rapport");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    // Handle file uploads
    const handleFileUpload = async (file: File) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}-${jalonId}-${Date.now()}.${fileExt}`;
        const filePath = `project-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);
          
        if (publicData) {
          setPhotoUrls(prev => [...prev, publicData.publicUrl]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error("Erreur lors de l'upload d'une photo");
      }
    };
    
    // Process each file
    Array.from(e.target.files).forEach(file => {
      handleFileUpload(file);
    });
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? `Rapport - ${jalonName}` : `Rapport d'intervention - ${jalonName}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datePrevue">Date prévue</Label>
            <Input 
              id="datePrevue" 
              type="date" 
              value={datePrevue} 
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateReelle">Date d'intervention réelle</Label>
            <Input 
              id="dateReelle" 
              type="date" 
              value={dateReelle} 
              onChange={(e) => setDateReelle(e.target.value)}
              readOnly={readOnly}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heureDebut">Heure de début</Label>
              <Input 
                id="heureDebut" 
                type="time" 
                value={heureDebut} 
                onChange={(e) => setHeureDebut(e.target.value)}
                readOnly={readOnly}
                disabled={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="heureFin">Heure de fin</Label>
              <Input 
                id="heureFin" 
                type="time" 
                value={heureFin} 
                onChange={(e) => setHeureFin(e.target.value)}
                readOnly={readOnly}
                disabled={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rapport">Rapport d'intervention</Label>
            <Textarea 
              id="rapport" 
              value={rapport} 
              onChange={(e) => setRapport(e.target.value)}
              rows={5}
              placeholder="Décrivez les actions réalisées, les observations, etc."
              readOnly={readOnly}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <PhotoUploader
              photoUrls={photoUrls}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              label="Photos du terrain"
              disabled={readOnly}
            />
          </div>
          
          {!readOnly && (
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : "Enregistrer le rapport"}
              </Button>
            </div>
          )}
          
          {readOnly && (
            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JalonReportDialog;
