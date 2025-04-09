
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TerrainData, TerrainSortOptions, TerrainFilters } from "@/types/terrain";
import { MoreHorizontal, ArrowUpDown, Search, Filter, Map, MessageSquare, Check, X, Edit, Trash, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/types/notification";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface TerrainTableProps {
  terrains: TerrainData[];
  type: 'pending' | 'validated';
  userRole?: string;
  onTerrainUpdate?: (terrain: TerrainData, action?: 'add' | 'update' | 'delete') => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  onEdit?: (terrain: TerrainData) => void;
  onViewDetails?: (terrain: TerrainData) => void;
  onValidate?: (terrain: TerrainData) => void;
  onDelete?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
}

const TerrainTable: React.FC<TerrainTableProps> = ({
  terrains,
  type,
  userRole,
  onTerrainUpdate,
  techniciens = [],
  onEdit,
  onViewDetails,
  onValidate,
  onDelete,
  onContactTechnicien,
}) => {
  const [sortOptions, setSortOptions] = useState<TerrainSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });

  const [filters, setFilters] = useState<TerrainFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigningTech, setIsAssigningTech] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const isMobile = useIsMobile();

  const sortedTerrains = [...terrains].sort((a, b) => {
    const aValue = a[sortOptions.field];
    const bValue = b[sortOptions.field];
    
    if (aValue === undefined) return sortOptions.direction === 'asc' ? -1 : 1;
    if (bValue === undefined) return sortOptions.direction === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOptions.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOptions.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortOptions.direction === 'asc'
        ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
        : (bValue ? 1 : 0) - (aValue ? 1 : 0);
    }
    
    return 0;
  });
  
  // Filter terrains
  const filteredTerrains = sortedTerrains.filter(terrain => {
    // Search query filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchable = [
        terrain.nom_terrain,
        terrain.region_name,
        terrain.district_name,
        terrain.commune_name,
        terrain.tantsahaNom,
        terrain.techniqueNom
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchable.includes(query)) {
        return false;
      }
    }
    
    // Region filter
    if (filters.region && terrain.id_region !== filters.region) {
      return false;
    }
    
    // District filter
    if (filters.district && terrain.id_district !== filters.district) {
      return false;
    }
    
    // Commune filter
    if (filters.commune && terrain.id_commune !== filters.commune) {
      return false;
    }
    
    // Water access filter
    if (filters.hasWater !== undefined && terrain.acces_eau !== filters.hasWater) {
      return false;
    }
    
    // Road access filter
    if (filters.hasRoad !== undefined && terrain.acces_route !== filters.hasRoad) {
      return false;
    }
    
    return true;
  });

  const toggleSort = (field: keyof TerrainData) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const resetFilters = () => {
    setFilters({});
  };
  
  const handleAssignTechnician = async () => {
    if (!selectedTerrain || !selectedTechId) {
      toast.error("Veuillez sélectionner un technicien");
      return;
    }
    
    try {
      // Update terrain with assigned technician
      const { error } = await supabase
        .from('terrain')
        .update({ id_technicien: selectedTechId })
        .eq('id_terrain', selectedTerrain.id_terrain);
        
      if (error) throw error;
      
      // Create notification for technician
      await sendNotification(
        supabase,
        selectedTerrain.id_tantsaha || '',
        [{ id_utilisateur: selectedTechId }],
        "Terrain assigné",
        `Vous avez été assigné au terrain ${selectedTerrain.nom_terrain}`,
        "info",
        "terrain",
        selectedTerrain.id_terrain
      );
      
      // Create notification for terrain owner
      await sendNotification(
        supabase,
        'system',
        [{ id_utilisateur: selectedTerrain.id_tantsaha || '' }],
        "Technicien assigné",
        `Un technicien a été assigné à votre terrain ${selectedTerrain.nom_terrain}`,
        "info",
        "terrain",
        selectedTerrain.id_terrain
      );
      
      // Update UI
      const updatedTerrain = {
        ...selectedTerrain,
        id_technicien: selectedTechId,
        techniqueNom: techniciens.find(t => t.id_utilisateur === selectedTechId)?.nom || 'Non assigné'
      };
      
      if (onTerrainUpdate) {
        onTerrainUpdate(updatedTerrain, 'update');
      }
      
      toast.success("Technicien assigné avec succès");
      setIsAssigningTech(false);
      setSelectedTerrain(null);
      setSelectedTechId('');
    } catch (error: any) {
      console.error("Error assigning technician:", error);
      toast.error("Erreur lors de l'assignation: " + error.message);
    }
  };

  if (isMobile) {
    return (
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4 justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un terrain..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full md:w-[300px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          
          {showFilters && (
            <div className="bg-card p-4 rounded-md shadow-sm border mt-2 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Accès à l'eau</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox
                      id="waterAccess"
                      checked={filters.hasWater === true}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, hasWater: checked ? true : undefined })
                      }
                    />
                    <label
                      htmlFor="waterAccess"
                      className="text-sm font-normal leading-none"
                    >
                      Avec accès à l'eau
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Accès à la route</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox
                      id="roadAccess"
                      checked={filters.hasRoad === true}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, hasRoad: checked ? true : undefined })
                      }
                    />
                    <label
                      htmlFor="roadAccess"
                      className="text-sm font-normal leading-none"
                    >
                      Avec accès à la route
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {filteredTerrains.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            {searchQuery || Object.keys(filters).length > 0
              ? "Aucun terrain correspondant à vos critères"
              : "Aucun terrain disponible"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTerrains.map((terrain) => (
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

                {userRole === 'superviseur' && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Technicien</p>
                    {terrain.id_technicien ? (
                      <p className="text-sm">{terrain.techniqueNom || 'Non spécifié'}</p>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedTerrain(terrain);
                          setIsAssigningTech(true);
                        }}
                      >
                        Assigner un technicien
                      </Button>
                    )}
                  </div>
                )}
                
                {userRole === 'simple' && type === 'validated' && terrain.techniqueNom && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Technicien</p>
                    <p className="text-sm">{terrain.techniqueNom || 'Non assigné'}</p>
                  </div>
                )}
                
                {type === 'validated' && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground">Surface validée</p>
                    <p className="text-sm font-medium">{terrain.surface_validee || terrain.surface_proposee} ha</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
                  {onViewDetails && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(terrain)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                  )}
                  
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(terrain)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                  
                  {type === 'pending' && onValidate && userRole === 'superviseur' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onValidate(terrain)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                  )}
                  
                  {onDelete && type === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDelete(terrain)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  )}
                  
                  {onContactTechnicien && terrain.id_technicien && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onContactTechnicien(terrain)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contacter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <AlertDialog open={isAssigningTech} onOpenChange={setIsAssigningTech}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Assigner un technicien</AlertDialogTitle>
              <AlertDialogDescription>
                Sélectionnez un technicien à assigner au terrain {selectedTerrain?.nom_terrain}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {techniciens.map((tech) => (
                    <SelectItem key={tech.id_utilisateur} value={tech.id_utilisateur}>
                      {tech.nom} {tech.prenoms || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setSelectedTerrain(null);
                setSelectedTechId('');
              }}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleAssignTechnician}>Assigner</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop view
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4 justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un terrain..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full md:w-[300px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
        
        {/* Filter options */}
        {showFilters && (
          <div className="bg-card p-4 rounded-md shadow-sm border mt-2 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Accès à l'eau</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox
                    id="waterAccess"
                    checked={filters.hasWater === true}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, hasWater: checked ? true : undefined })
                    }
                  />
                  <label
                    htmlFor="waterAccess"
                    className="text-sm font-normal leading-none"
                  >
                    Avec accès à l'eau
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Accès à la route</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox
                    id="roadAccess"
                    checked={filters.hasRoad === true}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, hasRoad: checked ? true : undefined })
                    }
                  />
                  <label
                    htmlFor="roadAccess"
                    className="text-sm font-normal leading-none"
                  >
                    Avec accès à la route
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {filteredTerrains.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed">
          {searchQuery || Object.keys(filters).length > 0
            ? "Aucun terrain correspondant à vos critères"
            : "Aucun terrain disponible"}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort('nom_terrain')}
                  >
                    Nom
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort('surface_proposee')}
                  >
                    Surface (ha)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort('region_name')}
                  >
                    Localisation
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                {(userRole === 'superviseur' || userRole === 'technicien') && (
                  <TableHead>Propriétaire</TableHead>
                )}
                {userRole === 'simple' && type === 'validated' && (
                  <TableHead>Technicien</TableHead>
                )}
                {userRole === 'superviseur' && (
                  <TableHead>Technicien</TableHead>
                )}
                <TableHead>
                  <div className="flex items-center">
                    <span className="mr-2">Accès</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerrains.map((terrain) => (
                <TableRow key={terrain.id_terrain}>
                  <TableCell>{terrain.id_terrain}</TableCell>
                  <TableCell>
                    <div className="font-medium">{terrain.nom_terrain}</div>
                  </TableCell>
                  <TableCell>
                    {terrain.surface_proposee}
                    {terrain.surface_validee && terrain.surface_validee !== terrain.surface_proposee && (
                      <div className="text-xs text-muted-foreground">
                        Validé: {terrain.surface_validee} ha
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{terrain.region_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {terrain.district_name}, {terrain.commune_name}
                    </div>
                  </TableCell>
                  {(userRole === 'superviseur' || userRole === 'technicien') && (
                    <TableCell>{terrain.tantsahaNom || 'Non spécifié'}</TableCell>
                  )}
                  {userRole === 'simple' && type === 'validated' && (
                    <TableCell>
                      {terrain.techniqueNom !== 'Non assigné' ? (
                        <div className="flex items-center">
                          <span>{terrain.techniqueNom}</span>
                          {onContactTechnicien && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-1 p-1 h-auto"
                              onClick={() => onContactTechnicien(terrain)}
                              title="Contacter le technicien"
                            >
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        'Non assigné'
                      )}
                    </TableCell>
                  )}
                  {userRole === 'superviseur' && (
                    <TableCell>
                      {terrain.id_technicien ? (
                        terrain.techniqueNom
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTerrain(terrain);
                            setIsAssigningTech(true);
                          }}
                        >
                          Assigner
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex space-x-2">
                      {terrain.acces_eau ? (
                        <Badge variant="outline" className="bg-blue-50">Eau</Badge>
                      ) : null}
                      {terrain.acces_route ? (
                        <Badge variant="outline" className="bg-amber-50">Route</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(terrain)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                        )}
                        
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(terrain)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        
                        {type === 'pending' && userRole === 'superviseur' && onValidate && (
                          <DropdownMenuItem onClick={() => onValidate(terrain)}>
                            <Check className="mr-2 h-4 w-4" />
                            Valider
                          </DropdownMenuItem>
                        )}
                        
                        {type === 'pending' && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(terrain)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <AlertDialog open={isAssigningTech} onOpenChange={setIsAssigningTech}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assigner un technicien</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez un technicien à assigner au terrain {selectedTerrain?.nom_terrain}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un technicien" />
              </SelectTrigger>
              <SelectContent>
                {techniciens.map((tech) => (
                  <SelectItem key={tech.id_utilisateur} value={tech.id_utilisateur}>
                    {tech.nom} {tech.prenoms || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedTerrain(null);
              setSelectedTechId('');
            }}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignTechnician}>Assigner</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TerrainTable;
