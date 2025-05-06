
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TerrainData } from "@/types/terrain";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Pencil, Trash2, Mail, User, MapPin, Calendar, Check, X } from 'lucide-react';
import ProjectPhotosGallery from '@/components/ProjectPhotosGallery';
import UserAvatar from '@/components/terrain/UserAvatar';

interface TerrainCardProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainData;
  onTerrainUpdate?: (terrain: TerrainData, action?: 'update' | 'delete') => void;
  userRole?: string;
  isDeleteMode?: boolean;
}

const TerrainCard: React.FC<TerrainCardProps> = ({
  isOpen,
  onClose,
  terrain,
  onTerrainUpdate,
  userRole = 'simple',
  isDeleteMode = false,
}) => {
  const { user } = useAuth();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [validationPhotoGalleryOpen, setValidationPhotoGalleryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const canModify = userRole === 'admin' || 
                   (userRole === 'technicien' && terrain.id_technicien === user?.id) ||
                   (userRole === 'superviseur') ||
                   (userRole === 'simple' && terrain.id_tantsaha === user?.id);
  const canDelete = userRole === 'admin' || 
                   (userRole === 'superviseur') ||
                   (userRole === 'simple' && terrain.id_tantsaha === user?.id && !terrain.statut);
  
  // Convert polygon coordinates from GeoJSON to Leaflet format
  const getPolygonCoordinates = () => {
    if (!terrain.geom) return [];
    
    try {
      // Handle string or object geom
      const geomData = typeof terrain.geom === 'string' 
        ? JSON.parse(terrain.geom) 
        : terrain.geom;
        
      if (geomData && geomData.coordinates && geomData.coordinates[0]) {
        // Swap coordinates for Leaflet (from [lng, lat] to [lat, lng])
        return geomData.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      }
    } catch (error) {
      console.error("Error parsing polygon geometry:", error);
    }
    
    return [];
  };
  
  const polygonCoordinates = getPolygonCoordinates();

  // Get photo arrays
  const getPhotos = () => {
    if (!terrain.photos) return [];
    
    return typeof terrain.photos === 'string'
      ? terrain.photos.split(',').filter((p: string) => p.trim() !== '')
      : Array.isArray(terrain.photos) ? terrain.photos.filter(p => p) : [];
  };
  
  const getValidationPhotos = () => {
    if (!terrain.photos_validation) return [];
    
    return typeof terrain.photos_validation === 'string'
      ? terrain.photos_validation.split(',').filter((p: string) => p.trim() !== '')
      : Array.isArray(terrain.photos_validation) ? terrain.photos_validation.filter(p => p) : [];
  };
  
  const photos = getPhotos();
  const validationPhotos = getValidationPhotos();
  
  const handleDelete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('terrain')
        .update({ archive: true })
        .eq('id_terrain', terrain.id_terrain);
        
      if (error) throw error;
      
      toast.success("Terrain supprimé avec succès");
      if (onTerrainUpdate) {
        onTerrainUpdate({...terrain, archive: true}, 'delete');
      }
      
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error: any) {
      console.error("Error deleting terrain:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDeleteMode) {
    return (
      <AlertDialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Fix focus management with proper unmount timing
            setTimeout(() => onClose(), 0);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le terrain</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le terrain "{terrain.nom_terrain}"? 
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => onClose()}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Fix focus management with proper unmount timing
            setTimeout(() => onClose(), 0);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600">
              {terrain.nom_terrain}
            </DialogTitle>
            <DialogDescription>
              Détails du terrain #{terrain.id_terrain}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">
                Détails du terrain
              </TabsTrigger>
              <TabsTrigger value="validation" disabled={!terrain.statut}>
                Rapport de validation
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Proposé par
                        </div>
                        <div className="font-medium flex items-center">
                          <UserAvatar 
                            name={terrain.tantsahaNom || 'Utilisateur'} 
                            size="sm"
                            photoUrl={undefined}
                          />
                          <span className="ml-2">{terrain.tantsahaNom || 'Non spécifié'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Surface proposée
                        </div>
                        <div className="font-medium">
                          {terrain.surface_proposee} hectares
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Localisation
                        </div>
                        <div className="font-medium text-right">
                          {terrain.commune_name}, {terrain.district_name}, {terrain.region_name}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Accès à l'eau
                        </div>
                        <div className="font-medium">
                          {terrain.acces_eau ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Accès à la route
                        </div>
                        <div className="font-medium">
                          {terrain.acces_route ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Statut
                        </div>
                        <div className={`font-medium ${terrain.statut ? 'text-green-600' : 'text-amber-600'}`}>
                          {terrain.statut ? 'Validé' : 'En attente de validation'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Technicien assigné
                        </div>
                        <div className="font-medium flex items-center">
                          <UserAvatar 
                            name={terrain.techniqueNom || 'Non assigné'} 
                            size="sm"
                            photoUrl={undefined}
                          />
                          <span className="ml-2">{terrain.techniqueNom || 'Non assigné'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  {/* Map */}
                  <div className="h-[200px] rounded-lg overflow-hidden border">
                    {polygonCoordinates.length > 0 ? (
                      <MapContainer
                        bounds={polygonCoordinates}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                        attributionControl={true}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Polygon 
                          positions={polygonCoordinates}
                          pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
                        />
                      </MapContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground">Aucune donnée de carte disponible</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Photos */}
                  {photos.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between mb-3">
                            <div className="font-medium">Photos</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setPhotoGalleryOpen(true)}
                            >
                              Voir toutes
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {photos.slice(0, 3).map((photo, index) => (
                              <div key={index} className="aspect-square rounded-md overflow-hidden">
                                <img 
                                  src={photo} 
                                  alt={`Terrain photo ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {photos.length > 3 && (
                              <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center text-muted-foreground">
                                +{photos.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="validation" className="space-y-4">
              {terrain.statut ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Surface validée
                          </div>
                          <div className="font-medium">
                            {terrain.surface_validee || terrain.surface_proposee} hectares
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Date de validation
                          </div>
                          <div className="font-medium">
                            {terrain.date_validation ? new Date(terrain.date_validation).toLocaleDateString() : 'Non spécifiée'}
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Validé par
                          </div>
                          <div className="font-medium flex items-center">
                            <UserAvatar 
                              name={terrain.superviseurNom || 'Non spécifié'} 
                              size="sm"
                              photoUrl={undefined}
                            />
                            <span className="ml-2">{terrain.superviseurNom || 'Non spécifié'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {validationPhotos.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between mb-3">
                            <div className="font-medium">Photos de validation</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setValidationPhotoGalleryOpen(true)}
                            >
                              Voir toutes
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {validationPhotos.slice(0, 3).map((photo, index) => (
                              <div key={index} className="aspect-square rounded-md overflow-hidden">
                                <img 
                                  src={photo} 
                                  alt={`Validation photo ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {validationPhotos.length > 3 && (
                              <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center text-muted-foreground">
                                +{validationPhotos.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {terrain.rapport_validation && (
                    <Card className="md:col-span-2">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="font-medium mb-2">Rapport de validation</div>
                          <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                            {terrain.rapport_validation}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-muted-foreground">Ce terrain n'a pas encore été validé</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {canDelete && (
                <Button 
                  variant="destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={onClose}
                >
                  Fermer
                </Button>
                
                {canModify && !terrain.statut && (
                  <Button
                    variant="default"
                    onClick={() => {
                      onClose();
                      // Navigation logic or edit modal would go here
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Photo Gallery Modal */}
      {photoGalleryOpen && (
        <ProjectPhotosGallery
          isOpen={photoGalleryOpen}
          onClose={() => setPhotoGalleryOpen(false)}
          photos={photos}
          title={`Photos du terrain ${terrain.nom_terrain}`}
        />
      )}
      
      {/* Validation Photo Gallery Modal */}
      {validationPhotoGalleryOpen && (
        <ProjectPhotosGallery
          isOpen={validationPhotoGalleryOpen}
          onClose={() => setValidationPhotoGalleryOpen(false)}
          photos={validationPhotos}
          title={`Photos de validation du terrain ${terrain.nom_terrain}`}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le terrain</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le terrain "{terrain.nom_terrain}"? 
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TerrainCard;
