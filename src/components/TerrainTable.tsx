
import React from "react";
import { TerrainData } from "@/types/terrain";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, Edit, MessageSquare, Trash, Eye, FileCheck, Route, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { sendNotification } from "@/types/notification";

interface TerrainTableProps {
  terrains: TerrainData[];
  type?: 'validated' | 'pending';
  userRole?: string;
  onTerrainUpdate?: () => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  onEdit?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  loading?: boolean;
}

const TerrainTable: React.FC<TerrainTableProps> = ({ 
  terrains, 
  type = 'pending', 
  userRole, 
  onTerrainUpdate,
  techniciens,
  onEdit,
  onContactTechnicien,
  loading = false
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handleValidate = async (terrainId: number) => {
    try {
      // Check if user is either technicien or superviseur (IDs 4, 3)
      if (!['technicien', 'superviseur'].includes(userRole || '')) {
        toast.error("Vous n'avez pas les permissions nécessaires pour valider ce terrain");
        return;
      }

      // If user is technicien, check if they are assigned to this terrain
      if (userRole === 'technicien') {
        const terrain = terrains.find(t => t.id_terrain === terrainId);
        if (terrain?.id_technicien !== user?.id) {
          toast.error("Vous pouvez uniquement valider les terrains qui vous sont assignés");
          return;
        }
      }

      const terrain = terrains.find(t => t.id_terrain === terrainId);
      const { error } = await supabase
        .from('terrain')
        .update({ 
          statut: true,
          surface_validee: terrain?.surface_proposee
        })
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      // Notify the land owner
      if (terrain && terrain.id_tantsaha && user) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: terrain.id_tantsaha }],
          "Terrain validé",
          `Votre terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été validé`,
          "info",
          "terrain",
          terrainId
        );
      }
      
      toast.success("Le terrain a été validé avec succès");
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de la validation du terrain:', error);
      toast.error("Impossible de valider le terrain");
    }
  };

  const handleDeleteTerrain = async (terrainId: number) => {
    try {
      if (!user) return;
      
      // Check if user has permission to delete
      const terrain = terrains.find(t => t.id_terrain === terrainId);
      if (userRole === 'simple' && terrain?.id_tantsaha !== user.id) {
        toast.error("Vous pouvez uniquement supprimer vos propres terrains");
        return;
      }

      // Only simple users and superviseurs can delete terrains
      if (userRole !== 'simple' && userRole !== 'superviseur') {
        toast.error("Vous n'avez pas les permissions nécessaires");
        return;
      }

      // Check if this terrain has existing projects
      const { data: projects, error: projectsError } = await supabase
        .from('projet')
        .select('id_projet')
        .eq('id_terrain', terrainId);
        
      if (projectsError) throw projectsError;
      
      if (projects && projects.length > 0) {
        toast.error("Impossible de supprimer ce terrain car il est associé à des projets");
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .delete()
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      toast.success("Le terrain a été supprimé avec succès");
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression du terrain:', error);
      toast.error("Impossible de supprimer le terrain");
    }
  };

  const handleAssignTechnician = async (terrainId: number, technicianId: string) => {
    try {
      // Check if user is supervisor
      if (userRole !== 'superviseur') {
        toast.error("Seuls les superviseurs peuvent assigner des techniciens");
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .update({ id_technicien: technicianId })
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      // Notify the technician
      if (user) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: technicianId }],
          "Nouvelle affectation de terrain",
          `Vous avez été assigné au terrain #${terrainId}`,
          "assignment",
          "terrain",
          terrainId
        );
      }
      
      toast.success("Technicien assigné avec succès!");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error("Erreur lors de l'assignation du technicien");
    }
  };

  const canEdit = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Simple users can edit their own non-validated terrains
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    // Technician can edit terrains assigned to them
    if (userRole === 'technicien' && terrain.id_technicien === user.id) {
      return true;
    }
    
    // Supervisor can edit any terrain
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canDelete = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Simple users can delete their own non-validated terrains
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    // Supervisor can delete any terrain
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canContactTechnicien = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Simple users can contact the technician assigned to their validated terrains
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === true && !!terrain.id_technicien;
    }
    
    return false;
  };

  const handleEdit = (terrain: TerrainData) => {
    if (onEdit) {
      onEdit(terrain);
    }
  };

  const handleContactTechnicien = (terrain: TerrainData) => {
    if (onContactTechnicien) {
      onContactTechnicien(terrain);
    }
  };

  // Filter terrains based on user role and terrain status
  const filterTerrainsByRole = () => {
    console.log('Filtering terrains by role:', { userRole, terrainCount: terrains.length, type });
    let filtered = [...terrains];
    
    // Filter by status (pending/validated)
    filtered = filtered.filter(terrain => 
      type === 'validated' ? terrain.statut === true : terrain.statut === false
    );
    
    // Additional filters based on user role
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '')) {
      // Simple user only sees their own terrains
      filtered = filtered.filter(terrain => terrain.id_tantsaha === user?.id);
    } else if (userRole === 'technicien') {
      // Technician only sees terrains assigned to them
      filtered = filtered.filter(terrain => terrain.id_technicien === user?.id);
    }
    // Supervisor sees all terrains, so no additional filtering for them
    
    console.log('Filtered terrains:', { count: filtered.length });
    return filtered;
  };

  const filteredTerrains = filterTerrainsByRole();

  // Afficher un message de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md">
        <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
        <p className="text-gray-600">Chargement des terrains en cours...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {filteredTerrains.length > 0 ? (
          filteredTerrains.map((terrain) => (
            <div key={terrain.id_terrain} className="border rounded-md p-3 bg-white">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-medium">{terrain.id_terrain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="text-sm font-medium">{terrain.nom_terrain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="text-sm font-medium">{terrain.surface_proposee} ha</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Région</p>
                  <p className="text-sm font-medium">{terrain.region_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accès eau</p>
                  <p className="text-sm font-medium">{terrain.acces_eau ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accès route</p>
                  <p className="text-sm font-medium">{terrain.acces_route ? "Oui" : "Non"}</p>
                </div>
              </div>

              {type === 'pending' && userRole === 'superviseur' && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Technicien</p>
                  {terrain.id_technicien ? (
                    <p className="text-sm">{terrain.techniqueNom || 'Non spécifié'}</p>
                  ) : (
                    <select
                      className="border p-1 rounded-md w-full text-sm"
                      onChange={(e) => handleAssignTechnician(terrain.id_terrain || 0, e.target.value)}
                    >
                      <option value="">Sélectionner un technicien</option>
                      {techniciens?.map((tech) => (
                        <option key={tech.id_utilisateur} value={tech.id_utilisateur}>
                          {tech.nom} {tech.prenoms || ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              {type === 'validated' && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground">Surface validée</p>
                  <p className="text-sm font-medium">{terrain.surface_validee || terrain.surface_proposee} ha</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-2">
                {type === 'pending' && (userRole === 'technicien' || userRole === 'superviseur') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleValidate(terrain.id_terrain || 0)}
                    disabled={userRole === 'technicien' && terrain.id_technicien !== user?.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Valider
                  </Button>
                )}
                {canEdit(terrain) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(terrain)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                )}
                {canDelete(terrain) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteTerrain(terrain.id_terrain || 0)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
                {canContactTechnicien(terrain) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleContactTechnicien(terrain)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Contacter
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 border rounded-md">
            Aucun terrain {type === 'validated' ? 'validé' : 'en attente'} disponible
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Surface</TableHead>
            <TableHead>Zone géographique</TableHead>
            <TableHead>Accès eau</TableHead>
            <TableHead>Accès route</TableHead>
            {type === 'pending' && userRole === 'superviseur' && (
              <TableHead>Technicien</TableHead>
            )}
            {type === 'validated' && (
              <TableHead>Surface validée</TableHead>
            )}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTerrains.length > 0 ? (
            filteredTerrains.map((terrain) => (
              <TableRow key={terrain.id_terrain}>
                <TableCell>{terrain.id_terrain}</TableCell>
                <TableCell>{terrain.nom_terrain}</TableCell>
                <TableCell>{terrain.surface_proposee} ha</TableCell>
                <TableCell>
                  {terrain.region_name || 'N/A'}, 
                  {terrain.district_name || 'N/A'}, 
                  {terrain.commune_name || 'N/A'}
                </TableCell>
                <TableCell>{terrain.acces_eau ? "Oui" : "Non"}</TableCell>
                <TableCell>{terrain.acces_route ? "Oui" : "Non"}</TableCell>
                {type === 'pending' && userRole === 'superviseur' && (
                  <TableCell>
                    {terrain.id_technicien ? (
                      `${terrain.techniqueNom || 'Non spécifié'}`
                    ) : (
                      <select
                        className="border p-1 rounded-md w-full"
                        onChange={(e) => handleAssignTechnician(terrain.id_terrain || 0, e.target.value)}
                      >
                        <option value="">Sélectionner un technicien</option>
                        {techniciens?.map((tech) => (
                          <option key={tech.id_utilisateur} value={tech.id_utilisateur}>
                            {tech.nom} {tech.prenoms || ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                )}
                {type === 'validated' && (
                  <TableCell>{terrain.surface_validee || terrain.surface_proposee} ha</TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {type === 'pending' && (userRole === 'technicien' || userRole === 'superviseur') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(terrain.id_terrain || 0)}
                        disabled={userRole === 'technicien' && terrain.id_technicien !== user?.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Valider
                      </Button>
                    )}
                    {canEdit(terrain) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(terrain)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                    {canDelete(terrain) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteTerrain(terrain.id_terrain || 0)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                    {canContactTechnicien(terrain) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleContactTechnicien(terrain)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contacter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={type === 'pending' && userRole === 'superviseur' ? 9 : 8} className="text-center py-4">
                Aucun terrain {type === 'validated' ? 'validé' : 'en attente'} disponible
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TerrainTable;
