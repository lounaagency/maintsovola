
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, MapPin, Calendar, User, Users, FileText, Droplets, Route } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TerrainData } from "@/types/terrain";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TechnicienContactLink from "@/components/TechnicienContactLink";

interface TerrainCardProps {
  terrain: TerrainData;
  isOpen: boolean;
  onClose: () => void;
  onTerrainUpdate?: (terrainId?: number, isNew?: boolean) => void;
  isDeleteMode?: boolean;
}

const TerrainCard: React.FC<TerrainCardProps> = ({
  terrain,
  isOpen,
  onClose,
  onTerrainUpdate,
  isDeleteMode = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(isDeleteMode);

  // Convert photos string to array if needed
  const photoArray = React.useMemo(() => {
    if (!terrain.photos) return [];
    return typeof terrain.photos === 'string'
      ? terrain.photos.split(',').filter(url => url.trim() !== '')
      : terrain.photos.filter(url => url !== '');
  }, [terrain.photos]);

  // Convert validation photos string to array if needed
  const validationPhotoArray = React.useMemo(() => {
    if (!terrain.photos_validation) return [];
    return typeof terrain.photos_validation === 'string'
      ? terrain.photos_validation.split(',').filter(url => url.trim() !== '')
      : terrain.photos_validation.filter(url => url !== '');
  }, [terrain.photos_validation]);
  
  // Prepare polygon coordinates for the map
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
    if (!terrain.id_terrain) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('terrain')
        .update({ archive: true })
        .eq('id_terrain', terrain.id_terrain);
        
      if (error) throw error;
      
      toast.success("Terrain supprimé avec succès");
      if (onTerrainUpdate) {
        onTerrainUpdate(terrain.id_terrain);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting terrain:", error);
      toast.error("Erreur lors de la suppression du terrain");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !isDeleteConfirmOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{terrain.nom_terrain}</CardTitle>
                <Badge 
                  variant={terrain.statut ? "success" : "outline"}
                  className={terrain.statut ? "bg-green-100 text-green-800" : ""}
                >
                  {terrain.statut ? "Validé" : "En attente"}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                {terrain.region_name}, {terrain.district_name}, {terrain.commune_name}
              </div>
            </CardHeader>
            
            <CardContent className="grid gap-6">
              {polygonCoordinates.length > 0 && (
                <div className="h-64 rounded-md overflow-hidden">
                  <MapContainer
                    bounds={polygonCoordinates}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polygon 
                      positions={polygonCoordinates}
                      pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
                    />
                  </MapContainer>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm mb-2">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Droplets className={`w-4 h-4 ${terrain.acces_eau ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span>{terrain.acces_eau ? 'Accès à l\'eau' : 'Pas d\'accès à l\'eau'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Route className={`w-4 h-4 ${terrain.acces_route ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span>{terrain.acces_route ? 'Accès routier' : 'Pas d\'accès routier'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Surface proposée: {terrain.surface_proposee} ha</span>
                    </div>
                    {terrain.surface_validee && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>Surface validée: {terrain.surface_validee} ha</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm mb-2">Intervenants</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Propriétaire: {terrain.tantsahaNom || 'Non spécifié'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>
                        Technicien: {terrain.techniqueNom !== 'Non assigné' ? (
                          <TechnicienContactLink 
                            technicien={{
                              id: terrain.id_technicien || '',
                              name: terrain.techniqueNom || 'Non assigné'
                            }} 
                            terrainName={terrain.nom_terrain}
                          />
                        ) : 'Non assigné'}
                      </span>
                    </div>
                    {terrain.id_superviseur && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Superviseur: {terrain.superviseurNom}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {terrain.date_validation && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Validation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Date de validation: {format(new Date(terrain.date_validation), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Décision: {terrain.validation_decision === 'valider' ? 'Validé' : 'Rejeté'}</span>
                    </div>
                  </div>
                  
                  {terrain.rapport_validation && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium">Rapport de validation:</h4>
                      <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">{terrain.rapport_validation}</p>
                    </div>
                  )}
                </div>
              )}
              
              {photoArray.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Photos du terrain</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          className="h-24 w-full object-cover rounded-md border"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {validationPhotoArray.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Photos de validation</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          className="h-24 w-full object-cover rounded-md border"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={onClose}
                title="Fermer la fenêtre"
              >
                Fermer
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le terrain '{terrain.nom_terrain}' ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteConfirmOpen(false);
              if (isDeleteMode) onClose();
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTerrain} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TerrainCard;
