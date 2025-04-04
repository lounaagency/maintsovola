
import React, { useState, useMemo } from "react";
import { TerrainData, TerrainSortOptions, TerrainFilters } from "@/types/terrain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, Edit, MessageSquare, Trash, Eye, FileCheck, Route } from "lucide-react";
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
  onValidate?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  onViewDetails?: (terrain: TerrainData) => void;
  onDelete?: (terrain: TerrainData) => void;
}

const TerrainTable: React.FC<TerrainTableProps> = ({ 
  terrains, 
  type = 'pending', 
  userRole, 
  onTerrainUpdate,
  techniciens,
  onEdit,
  onValidate,
  onContactTechnicien,
  onViewDetails,
  onDelete
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sortOption, setSortOption] = useState<TerrainSortOptions>({ field: 'id_terrain', direction: 'desc' });
  const [filters, setFilters] = useState<TerrainFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort terrains
  const filteredTerrains = useMemo(() => {
    console.log('TerrainTable processing data:', { 
      count: terrains?.length || 0, 
      type, 
      userRole
    });
    
    if (!terrains || terrains.length === 0) {
      return [];
    }
    
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
    // Supervisors see all terrains, so no additional filtering for them
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(terrain => 
        (terrain.nom_terrain && terrain.nom_terrain.toLowerCase().includes(query)) ||
        (terrain.region_name && terrain.region_name.toLowerCase().includes(query)) ||
        (terrain.district_name && terrain.district_name.toLowerCase().includes(query)) ||
        (terrain.commune_name && terrain.commune_name.toLowerCase().includes(query)) ||
        terrain.id_terrain?.toString().includes(query)
      );
    }
    
    // Apply other filters
    if (filters.region) {
      filtered = filtered.filter(terrain => terrain.id_region === filters.region);
    }
    if (filters.district) {
      filtered = filtered.filter(terrain => terrain.id_district === filters.district);
    }
    if (filters.commune) {
      filtered = filtered.filter(terrain => terrain.id_commune === filters.commune);
    }
    if (filters.hasWater !== undefined) {
      filtered = filtered.filter(terrain => terrain.acces_eau === filters.hasWater);
    }
    if (filters.hasRoad !== undefined) {
      filtered = filtered.filter(terrain => terrain.acces_route === filters.hasRoad);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortOption.field] as any;
      const bValue = b[sortOption.field] as any;
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = typeof aValue === 'string' 
        ? aValue.localeCompare(bValue)
        : aValue - bValue;
        
      return sortOption.direction === 'asc' ? comparison : -comparison;
    });
    
    console.log('TerrainTable filtered results:', { count: filtered.length });
    return filtered;
  }, [terrains, type, userRole, user, filters, searchQuery, sortOption]);

  const handleAssignTechnician = async (terrainId: number, technicianId: string) => {
    try {
      if (userRole !== 'superviseur') {
        toast.error("Seuls les superviseurs peuvent assigner des techniciens");
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .update({ 
          id_technicien: technicianId,
          id_superviseur: user?.id
        })
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
        
        // Notify the terrain owner
        const terrain = terrains.find(t => t.id_terrain === terrainId);
        if (terrain && terrain.id_tantsaha) {
          await sendNotification(
            supabase,
            user.id,
            [{ id_utilisateur: terrain.id_tantsaha }],
            "Technicien assigné à votre terrain",
            `Un technicien a été assigné à votre terrain ${terrain.nom_terrain || `#${terrainId}`}`,
            "info",
            "terrain",
            terrainId
          );
        }
      }
      
      toast.success("Technicien assigné avec succès!");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error("Erreur lors de l'assignation du technicien");
    }
  };

  const handleValidate = async (terrain: TerrainData) => {
    if (onValidate) {
      onValidate(terrain);
    }
  };

  const canEdit = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    // Simple user can edit their own non-validated terrains
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
    
    // Simple user can delete their own non-validated terrains
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === false;
    }
    
    // Supervisor can delete any terrain
    if (userRole === 'superviseur') return true;
    
    return false;
  };

  const canValidate = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    if (userRole === 'technicien') {
      return terrain.id_technicien === user.id && terrain.statut === false;
    }
    
    if (userRole === 'superviseur') {
      return terrain.statut === false && !!terrain.id_technicien;
    }
    
    return false;
  };

  const canContactTechnicien = (terrain: TerrainData): boolean => {
    if (!user) return false;
    
    if (['agriculteur', 'investisseur', 'simple'].includes(userRole || '') && terrain.id_tantsaha === user.id) {
      return terrain.statut === true && !!terrain.id_technicien;
    }
    
    return false;
  };

  const handleEditClick = (terrain: TerrainData) => {
    if (onEdit) {
      onEdit(terrain);
    }
  };

  const handleViewDetailsClick = (terrain: TerrainData) => {
    if (onViewDetails) {
      onViewDetails(terrain);
    }
  };

  const handleDeleteClick = (terrain: TerrainData) => {
    if (onDelete) {
      onDelete(terrain);
    }
  };

  const handleContactTechnicien = (terrain: TerrainData) => {
    if (onContactTechnicien) {
      onContactTechnicien(terrain);
    }
  };

  const handleSort = (field: keyof TerrainData) => {
    setSortOption(prevSort => {
      if (prevSort.field === field) {
        return {
          field,
          direction: prevSort.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { field, direction: 'asc' };
    });
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
        </div>
        
        {filteredTerrains.length > 0 ? (
          filteredTerrains.map((terrain) => (
            <div 
              key={terrain.id_terrain} 
              className="border rounded-md p-3 bg-white"
              onClick={() => handleViewDetailsClick(terrain)}
            >
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
                      onClick={(e) => e.stopPropagation()}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetailsClick(terrain);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>
                
                {canValidate(terrain) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidate(terrain);
                    }}
                  >
                    <FileCheck className="h-4 w-4 mr-1" />
                    Valider
                  </Button>
                )}
                
                {canEdit(terrain) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(terrain);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(terrain);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
                
                {canContactTechnicien(terrain) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactTechnicien(terrain);
                    }}
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom, région, district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'id_terrain' ? sortOption.direction : null}
                onSort={() => handleSort('id_terrain')}
              >
                ID
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'nom_terrain' ? sortOption.direction : null}
                onSort={() => handleSort('nom_terrain')}
              >
                Nom
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'surface_proposee' ? sortOption.direction : null}
                onSort={() => handleSort('surface_proposee')}
              >
                Surface
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'region_name' ? sortOption.direction : null}
                onSort={() => handleSort('region_name')}
              >
                Zone géographique
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'acces_eau' ? sortOption.direction : null}
                onSort={() => handleSort('acces_eau')}
              >
                Accès eau
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortOption.field === 'acces_route' ? sortOption.direction : null}
                onSort={() => handleSort('acces_route')}
              >
                Accès route
              </TableHead>
              {type === 'pending' && userRole === 'superviseur' && (
                <TableHead>Technicien</TableHead>
              )}
              {type === 'validated' && (
                <TableHead 
                  sortable 
                  sorted={sortOption.field === 'surface_validee' ? sortOption.direction : null}
                  onSort={() => handleSort('surface_validee')}
                >
                  Surface validée
                </TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerrains.length > 0 ? (
              filteredTerrains.map((terrain) => (
                <TableRow 
                  key={terrain.id_terrain} 
                  clickable
                  onClick={() => handleViewDetailsClick(terrain)}
                >
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {terrain.id_technicien ? (
                        `${terrain.techniqueNom || 'Non spécifié'}`
                      ) : (
                        <Select
                          onValueChange={(value) => handleAssignTechnician(terrain.id_terrain || 0, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner un technicien" />
                          </SelectTrigger>
                          <SelectContent>
                            {techniciens?.map((tech) => (
                              <SelectItem key={tech.id_utilisateur} value={tech.id_utilisateur}>
                                {tech.nom} {tech.prenoms || ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  )}
                  {type === 'validated' && (
                    <TableCell>{terrain.surface_validee || terrain.surface_proposee} ha</TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetailsClick(terrain)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {canValidate(terrain) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidate(terrain)}
                        >
                          <FileCheck className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      )}
                      
                      {canEdit(terrain) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(terrain)}
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
                          onClick={() => handleDeleteClick(terrain)}
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
                <TableCell 
                  colSpan={type === 'pending' && userRole === 'superviseur' ? 9 : 8} 
                  className="text-center py-4"
                >
                  Aucun terrain {type === 'validated' ? 'validé' : 'en attente'} disponible
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TerrainTable;
