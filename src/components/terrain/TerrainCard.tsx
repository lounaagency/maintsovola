
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Droplets, Route } from "lucide-react";
import { TerrainData } from "@/types/terrain";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/types/notification";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TerrainCardProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainData;
  onTerrainUpdate?: (deletedTerrain?: TerrainData, action?: 'delete') => void;
  isDeleteMode?: boolean;
}

const TerrainCard: React.FC<TerrainCardProps> = ({
  isOpen,
  onClose,
  terrain,
  onTerrainUpdate,
  isDeleteMode = false
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const photoArray = React.useMemo(() => {
    if (!terrain.photos) return [];
    return typeof terrain.photos === 'string'
      ? terrain.photos.split(',').filter(url => url.trim() !== '')
      : terrain.photos.filter(url => url !== '');
  }, [terrain.photos]);
  
  const validationPhotoArray = React.useMemo(() => {
    if (!terrain.photos_validation) return [];
    return typeof terrain.photos_validation === 'string'
      ? terrain.photos_validation.split(',').filter(url => url.trim() !== '')
      : terrain.photos_validation.filter(url => url !== '');
  }, [terrain.photos_validation]);
  
  const polygonCoordinates = React.useMemo(() => {
    if (!terrain.geom) return [];
    
    try {
      const geomData = typeof terrain.geom === 'string' 
        ? JSON.parse(terrain.geom) 
        : terrain.geom;
        
      if (geomData && geomData.coordinates && geomData.coordinates[0]) {
        // Convert GeoJSON format to LatLngExpression[]
        return geomData.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      }
    } catch (error) {
      console.error("Error parsing polygon geometry:", error);
    }
    
    return [];
  }, [terrain.geom]);

  const handleDeleteTerrain = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('terrain')
        .update({ archive: true })
        .eq('id_terrain', terrain.id_terrain);
        
      if (error) throw error;
      
      // Notifications
      if (terrain.id_technicien) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: terrain.id_technicien }],
          "Terrain supprimé",
          `Le terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été supprimé`,
          "warning",
          "terrain",
          terrain.id_terrain
        );
      }
      
      if (terrain.id_superviseur && terrain.id_superviseur !== terrain.id_technicien) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: terrain.id_superviseur }],
          "Terrain supprimé",
          `Le terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été supprimé`,
          "warning",
          "terrain",
          terrain.id_terrain
        );
      }
      
      if (terrain.id_tantsaha && terrain.id_tantsaha !== user.id) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: terrain.id_tantsaha }],
          "Terrain supprimé",
          `Le terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été supprimé`,
          "warning",
          "terrain",
          terrain.id_terrain
        );
      }
      
      toast.success("Le terrain a été supprimé avec succès");
      onClose();
      if (onTerrainUpdate) onTerrainUpdate(terrain, 'delete');
    } catch (error) {
      console.error("Erreur lors de la suppression du terrain:", error);
      toast.error("Impossible de supprimer le terrain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isDeleteMode ? "Supprimer le terrain" : "Détails du terrain"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{terrain.nom_terrain}</h3>
              <p className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                {terrain.region_name || 'N/A'}, {terrain.district_name || 'N/A'}, {terrain.commune_name || 'N/A'}
              </p>
              
              <div className="flex space-x-4 mt-2">
                <div className="flex items-center">
                  <Droplets className={`w-4 h-4 mr-1 ${terrain.acces_eau ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm">{terrain.acces_eau ? 'Accès à l\'eau' : 'Pas d\'accès à l\'eau'}</span>
                </div>
                <div className="flex items-center">
                  <Route className={`w-4 h-4 mr-1 ${terrain.acces_route ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm">{terrain.acces_route ? 'Accès routier' : 'Pas d\'accès routier'}</span>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-sm font-medium">Surface proposée: {terrain.surface_proposee} ha</p>
                {terrain.surface_validee && (
                  <p className="text-sm font-medium text-green-600">Surface validée: {terrain.surface_validee} ha</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Statut: <span className={terrain.statut ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                    {terrain.statut ? 'Validé' : 'En attente de validation'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="h-[200px]">
              {polygonCoordinates.length > 0 ? (
                <MapContainer
                  bounds={polygonCoordinates}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polygon 
                    positions={polygonCoordinates}
                    pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full w-full bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-sm text-gray-500">Aucune géométrie définie</p>
                </div>
              )}
            </div>
          </div>
          
          {photoArray.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Photos</h4>
              <div className="grid grid-cols-4 gap-2">
                {photoArray.map((url, index) => (
                  <a 
                    key={index} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={url} 
                      alt={`Terrain ${index + 1}`} 
                      className="h-20 w-full object-cover rounded-md"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {terrain.statut && (terrain.rapport_validation || validationPhotoArray.length > 0) && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium">Rapport de validation</h4>
              
              {terrain.date_validation && (
                <p className="text-sm text-muted-foreground mt-1">
                  Validé le: {
                    typeof terrain.date_validation === 'string' 
                      ? format(new Date(terrain.date_validation), 'dd MMMM yyyy', {locale: fr})
                      : format(terrain.date_validation, 'dd MMMM yyyy', {locale: fr})
                  }
                </p>
              )}
              
              {terrain.rapport_validation && (
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">{terrain.rapport_validation}</p>
                </div>
              )}
              
              {validationPhotoArray.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-2">Photos de validation</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {validationPhotoArray.map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img 
                          src={url} 
                          alt={`Validation ${index + 1}`} 
                          className="h-20 w-full object-cover rounded-md"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-1">Propriétaire</h4>
            <p className="text-sm">{terrain.tantsahaNom || 'Non spécifié'}</p>
            
            {terrain.id_technicien && (
              <>
                <h4 className="font-medium mb-1 mt-3">Technicien assigné</h4>
                <p className="text-sm">{terrain.techniqueNom || 'Non spécifié'}</p>
              </>
            )}
            
            {terrain.id_superviseur && (
              <>
                <h4 className="font-medium mb-1 mt-3">Superviseur</h4>
                <p className="text-sm">{terrain.superviseurNom || 'Non spécifié'}</p>
              </>
            )}
          </div>
        </div>
        
        {isDeleteMode ? (
          <DialogFooter className="flex justify-between">
            <Button 
              variant="secondary" 
              onClick={onClose}
            >
              Annuler
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteTerrain}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer le terrain
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmer la suppression du terrain</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Fermer</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TerrainCard;
