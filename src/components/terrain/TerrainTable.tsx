
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
import { Check, Edit, MessageSquare, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface TerrainTableProps {
  terrains: TerrainData[];
  type?: 'validated' | 'pending';
  userRole?: string;
  onTerrainUpdate?: () => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  onEdit?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
}

const TerrainTable: React.FC<TerrainTableProps> = ({ 
  terrains, 
  type = 'pending', 
  userRole, 
  onTerrainUpdate,
  techniciens,
  onEdit,
  onContactTechnicien
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handleValidate = async (terrainId: number) => {
    try {
      if (!user) return;
      
      if (!['technicien', 'superviseur'].includes(userRole || '')) {
        toast.error("Vous n'avez pas les permissions nécessaires pour valider ce terrain");
        return;
      }

      if (userRole === 'technicien') {
        const terrain = terrains.find(t => t.id_terrain === terrainId);
        if (terrain?.id_technicien !== user?.id) {
          toast.error("Vous pouvez uniquement valider les terrains qui vous sont assignés");
          return;
        }
      }

      const { error } = await supabase
        .from('terrain')
        .update({ 
          statut: true,
          surface_validee: terrains.find(t => t.id_terrain === terrainId)?.surface_proposee
        })
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      // Notify the land owner
      const terrain = terrains.find(t => t.id_terrain === terrainId);
      if (terrain && terrain.id_tantsaha) {
        await supabase.from('notification').insert([{
          id_expediteur: user.id,
          id_destinataire: terrain.id_tantsaha,
          titre: "Terrain validé",
          message: `Votre terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été validé`,
          type: "info",
          entity_type: "terrain",
          entity_id: terrainId
        }]);
      }
      
      toast.success("Le terrain a été validé avec succès");
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error: any) {
      console.error('Erreur lors de la validation du terrain:', error);
      toast.error("Impossible de valider le terrain: " + error.message);
    }
  };

  const handleDeleteTerrain = async (terrainId: number) => {
    try {
      if (!user) return;
      
      if (userRole !== 'simple' && userRole !== 'technicien' && userRole !== 'superviseur') {
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
    } catch (error: any) {
      console.error('Erreur lors de la suppression du terrain:', error);
      toast.error("Impossible de supprimer le terrain: " + error.message);
    }
  };

  const handleAssignTechnician = async (terrainId: number, technicianId: string) => {
    try {
      if (!user) return;
      
      if (userRole !== 'superviseur') {
        toast.error("Seuls les superviseurs peuvent assigner des techniciens");
        return;
      }
      const { error } = await supabase
        .from('terrain')
        .update({ id_technicien: String(technicianId) })
        .eq('id_terrain', terrainId);
      if (error) throw error;
      
      // Notify the technician
      await supabase.from('notification').insert([{
        id_expediteur: String(user.id),
        id_destinataire: technicianId,
        titre: "Nouvelle affectation de terrain",
        message: `Vous avez été assigné au terrain #${terrainId}`,
        type: "info",
        entity_type: "terrain",
        entity_id: terrainId
      }]);
      
      toast.success("Technicien assigné avec succès!");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error: any) {
      console.error("Error assigning technician:", error);
      toast.error("Ersddsr lors de l'assignation du technicien: " + error.message + typeof user.id+' le type de'+ String(user.id));
    }
  };

  const canEdit = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    if (userRole === 'simple' && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    if (userRole === 'technicien' && terrain.id_technicien === user.id) {
      return true;
    }
    
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canDelete = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    if (userRole === 'simple' && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canContactTechnicien = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    if (userRole === 'simple' && terrain.id_tantsaha === user.id) {
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

  const filteredTerrains = terrains.filter(terrain => 
    type === 'validated' ? terrain.statut === true : terrain.statut === false
  );

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
