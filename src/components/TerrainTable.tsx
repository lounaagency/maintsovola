
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
import { Check, Edit, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleValidate = async (terrainId: number) => {
    try {
      // Vérifier si le rôle est autorisé à valider
      if (!['technicien', 'superviseur'].includes(userRole || '')) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires pour valider ce terrain",
          variant: "destructive"
        });
        return;
      }

      // Si c'est un technicien, il faut vérifier qu'il est assigné à ce terrain
      if (userRole === 'technicien') {
        const terrain = terrains.find(t => t.id_terrain === terrainId);
        if (terrain?.id_technicien !== user?.id) {
          toast({
            title: "Accès refusé",
            description: "Vous pouvez uniquement valider les terrains qui vous sont assignés",
            variant: "destructive"
          });
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
      
      toast({
        title: "Succès",
        description: "Le terrain a été validé avec succès",
      });
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de la validation du terrain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le terrain",
        variant: "destructive"
      });
    }
  };

  const handleAssignTechnicien = async (terrainId: number, technicienId: string) => {
    try {
      // Vérifier que seul un superviseur peut assigner un technicien
      if (userRole !== 'superviseur') {
        toast({
          title: "Accès refusé",
          description: "Seuls les superviseurs peuvent assigner des techniciens",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .update({ id_technicien: technicienId })
        .eq('id_terrain', terrainId);

      if (error) throw error;

      // Créer une notification pour le technicien
      await supabase.from('notification').insert({
        id_destinataire: technicienId,
        titre: "Affectation terrain",
        message: `Vous avez été assigné à un nouveau terrain (ID: ${terrainId})`,
        type: 'info',
        entity_type: 'terrain',
        entity_id: terrainId.toString()
      });
      
      toast({
        title: "Succès",
        description: "Le technicien a été assigné avec succès",
      });
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du technicien:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le technicien",
        variant: "destructive"
      });
    }
  };

  const canEdit = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Les agriculteurs et investisseurs peuvent modifier leurs terrains non validés
    if (['agriculteur', 'investisseur'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    // Les techniciens peuvent modifier les terrains qui leur sont assignés
    if (userRole === 'technicien' && terrain.id_technicien === user.id) {
      return true;
    }
    
    // Les superviseurs peuvent modifier tous les terrains
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canContactTechnicien = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Les agriculteurs et investisseurs peuvent contacter le technicien pour leurs terrains validés
    if (['agriculteur', 'investisseur'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
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

  // Assurez-vous d'avoir des terrains à afficher du bon type
  const filteredTerrains = terrains.filter(terrain => 
    type === 'validated' ? terrain.statut === true : terrain.statut === false
  );

  // Rendu adaptatif selon le type d'appareil
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
                      onChange={(e) => handleAssignTechnicien(terrain.id_terrain || 0, e.target.value)}
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

  // Version desktop
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
                        onChange={(e) => handleAssignTechnicien(terrain.id_terrain || 0, e.target.value)}
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
