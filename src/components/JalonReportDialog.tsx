
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
import { Loader2, Upload } from "lucide-react";

interface JalonReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  jalonId: number;
  jalonName: string;
  datePrevue: string;
  onSubmitSuccess: () => void;
}

const JalonReportDialog: React.FC<JalonReportDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  jalonId,
  jalonName,
  datePrevue,
  onSubmitSuccess
}) => {
  const [rapport, setRapport] = useState("");
  const [dateReelle, setDateReelle] = useState(datePrevue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rapport.trim()) {
      toast.error("Veuillez rédiger un rapport d'intervention");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Upload photos if selected
      let photoUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        setUploading(true);
        
        for (const file of selectedFiles) {
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
            photoUrls.push(publicData.publicUrl);
          }
        }
        
        setUploading(false);
      }
      
      // Update jalon with report and photos
      const { error } = await supabase
        .from('jalon_projet')
        .update({
          date_reelle: dateReelle,
          rapport_terrain: rapport,
          photos_sur_terrain: photoUrls.length > 0 ? photoUrls : null
        })
        .eq('id_projet', projectId)
        .eq('id_jalon', jalonId);
      
      if (error) throw error;
      
      toast.success("Rapport d'intervention enregistré avec succès");
      
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Impossible d'enregistrer le rapport");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files: File[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      files.push(e.target.files[i]);
    }
    
    setSelectedFiles(files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rapport d'intervention - {jalonName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateReelle">Date d'intervention réelle</Label>
            <Input 
              id="dateReelle" 
              type="date" 
              value={dateReelle} 
              onChange={(e) => setDateReelle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rapport">Rapport d'intervention</Label>
            <Textarea 
              id="rapport" 
              value={rapport} 
              onChange={(e) => setRapport(e.target.value)}
              rows={5}
              placeholder="Décrivez les actions réalisées, les observations, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photos">Photos (facultatif)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploading && <Loader2 className="animate-spin h-4 w-4" />}
            </div>
            {selectedFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} sélectionnée{selectedFiles.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : "Enregistrer le rapport"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JalonReportDialog;
