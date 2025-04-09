
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerrainData } from "@/types/terrain";
import { MapPin, Water, Road, Calendar, CheckCircle, AlertTriangle, Trash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";

interface TerrainCardProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainData;
  onTerrainUpdate?: (terrain?: TerrainData, action?: 'add' | 'update' | 'delete') => void;
  isDeleteMode?: boolean;
}

const TerrainCard: React.FC<TerrainCardProps> = ({
  isOpen,
  onClose,
  terrain,
  onTerrainUpdate,
  isDeleteMode = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!terrain.id_terrain) return;
    
    try {
      setIsDeleting(true);
      
      // Check if terrain is used in any projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projet')
        .select('id_projet')
        .eq('id_terrain', terrain.id_terrain);
        
      if (projectsError) throw projectsError;
      
      if (projectsData && projectsData.length > 0) {
        toast.error("Ce terrain est utilisé dans des projets et ne peut pas être supprimé.");
        return;
      }
      
      // Mark terrain as archived instead of deleting
      const { error } = await supabase
        .from('terrain')
        .update({ archive: true })
        .eq('id_terrain', terrain.id_terrain);
        
      if (error) throw error;
      
      toast.success("Terrain supprimé avec succès");
      
      if (onTerrainUpdate) {
        onTerrainUpdate(terrain, 'delete');
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error deleting terrain:", error);
      toast.error("Erreur lors de la suppression: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format validation date if available
  const validationDate = terrain.date_validation
    ? format(new Date(terrain.date_validation), 'dd MMMM yyyy', { locale: fr })
    : null;
    
  // Check if we have photos
  const photos = typeof terrain.photos === 'string' 
    ? terrain.photos.split(',').filter(p => p.trim() !== '') 
    : Array.isArray(terrain.photos) 
      ? terrain.photos 
      : [];
      
  // Check if we have validation photos  
  const validationPhotos = typeof terrain.photos_validation === 'string' 
    ? terrain.photos_validation.split(',').filter(p => p.trim() !== '') 
    : Array.isArray(terrain.photos_validation) 
      ? terrain.photos_validation 
      : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isDeleteMode ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center">
                <Trash className="h-5 w-5 mr-2" /> 
                Confirmer la suppression
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="mb-4">
                Êtes-vous sûr de vouloir supprimer ce terrain ? Cette action ne peut pas être annulée.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium">{terrain.nom_terrain}</h3>
                <p className="text-sm text-muted-foreground">
                  {terrain.surface_proposee} ha · {terrain.region_name}, {terrain.district_name}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{terrain.nom_terrain}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="validation" disabled={!terrain.statut}>
                  Rapport de validation
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Surface</h3>
                    <p className="text-lg font-semibold">{terrain.surface_proposee} hectares</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Statut</h3>
                    <div>
                      {terrain.statut ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Validé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          En attente de validation
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Localisation</h3>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <p>{terrain.region_name}, {terrain.district_name}, {terrain.commune_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Accès</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Water className={`h-4 w-4 mr-2 ${terrain.acces_eau ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <span>{terrain.acces_eau ? 'Accès à l\'eau' : 'Pas d\'accès à l\'eau'}</span>
                      </div>
                      <div className="flex items-center">
                        <Road className={`h-4 w-4 mr-2 ${terrain.acces_route ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        <span>{terrain.acces_route ? 'Accès à la route' : 'Pas d\'accès à la route'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {terrain.statut && terrain.surface_validee && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Surface validée</h3>
                      <p className="text-lg font-semibold">{terrain.surface_validee} hectares</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Personnes impliquées</h3>
                  
                  <div className="space-y-3">
                    {terrain.tantsahaNom && terrain.tantsahaNom !== 'Non spécifié' && (
                      <div className="flex items-center">
                        <UserAvatar name={terrain.tantsahaNom} size="sm" />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{terrain.tantsahaNom}</p>
                          <p className="text-xs text-muted-foreground">Propriétaire</p>
                        </div>
                      </div>
                    )}
                    
                    {terrain.techniqueNom && terrain.techniqueNom !== 'Non assigné' && (
                      <div className="flex items-center">
                        <UserAvatar name={terrain.techniqueNom} size="sm" />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{terrain.techniqueNom}</p>
                          <p className="text-xs text-muted-foreground">Technicien</p>
                        </div>
                      </div>
                    )}
                    
                    {terrain.superviseurNom && terrain.superviseurNom !== 'Non assigné' && (
                      <div className="flex items-center">
                        <UserAvatar name={terrain.superviseurNom} size="sm" />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{terrain.superviseurNom}</p>
                          <p className="text-xs text-muted-foreground">Superviseur</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {photos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {photos.map((photo, index) => (
                        <img 
                          key={index}
                          src={photo}
                          alt={`Terrain ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="validation" className="space-y-4 py-4">
                {validationDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Date de validation</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{validationDate}</p>
                    </div>
                  </div>
                )}
                
                {terrain.rapport_validation && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Rapport de validation</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="whitespace-pre-line">{terrain.rapport_validation}</p>
                    </div>
                  </div>
                )}
                
                {validationPhotos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Photos de validation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {validationPhotos.map((photo, index) => (
                        <img 
                          key={index}
                          src={photo}
                          alt={`Validation ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {terrain.id_superviseur && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Validé par</h3>
                    <div className="flex items-center">
                      <UserAvatar name={terrain.superviseurNom || 'Superviseur'} size="sm" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">{terrain.superviseurNom}</p>
                        <p className="text-xs text-muted-foreground">Superviseur</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TerrainCard;
