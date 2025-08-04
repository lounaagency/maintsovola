
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TerrainData } from "@/types/terrain";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, Eye, Check, ShieldCheck, Trash2, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import TerrainListCard from "./TerrainListCard";

interface TerrainTableProps {
  terrains: TerrainData[];
  type?: "pending" | "validated";
  userRole?: string;
  onTerrainUpdate: (terrain: TerrainData, action?: "update" | "delete") => void;
  onEdit?: (terrain: TerrainData) => void;
  onViewDetails?: (terrain: TerrainData) => void;
  onValidate?: (terrain: TerrainData) => void;
  onDelete?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

type SortField = 'nom_terrain' | 'region_name' | 'surface';
type SortDirection = 'asc' | 'desc' | null;

const TerrainTable: React.FC<TerrainTableProps> = ({
  terrains,
  type = "pending",
  userRole = "simple",
  onTerrainUpdate,
  onEdit,
  onViewDetails,
  onValidate,
  onDelete,
  onContactTechnicien,
  techniciens = [],
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const isMobile = useIsMobile();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTerrains = useMemo(() => {
    if (!sortField || !sortDirection) {
      return terrains;
    }

    return [...terrains].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'nom_terrain':
          valueA = a.nom_terrain || '';
          valueB = b.nom_terrain || '';
          break;
        case 'region_name':
          valueA = a.region_name || '';
          valueB = b.region_name || '';
          break;
        case 'surface':
          valueA = a.surface_validee || a.surface_proposee || 0;
          valueB = b.surface_validee || b.surface_proposee || 0;
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [terrains, sortField, sortDirection]);

  const assignTechnicien = async (terrain: TerrainData, technicienId: string) => {
    try {
      const { data, error } = await supabase
        .from("terrain")
        .update({ id_technicien: technicienId })
        .eq("id_terrain", terrain.id_terrain)
        .select("*")
        .single();

      if (error) throw error;

      // Get technician name
      const { data: techData } = await supabase
        .from("utilisateurs_par_role")
        .select("nom, prenoms")
        .eq("id_utilisateur", technicienId)
        .maybeSingle();

      const updatedTerrain = {
        ...data,
        techniqueNom: techData ? `${techData.nom} ${techData.prenoms || ""}`.trim() : "Non assigné",
      };

      onTerrainUpdate(updatedTerrain, "update");
      toast.success("Technicien assigné avec succès");
    } catch (error: any) {
      console.error("Error assigning technician:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  if (terrains.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg border-dashed">
        <p className="text-muted-foreground">
          {type === "pending"
            ? "Aucun terrain en attente de validation"
            : "Aucun terrain validé"}
        </p>
      </div>
    );
  }

  // Mobile view - display as cards
  if (isMobile) {
    return (
      <div className="grid gap-4">
        {sortedTerrains.map((terrain) => (
          <TerrainListCard
            key={terrain.id_terrain || Math.random()}
            terrain={terrain}
            type={type}
            userRole={userRole}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onValidate={onValidate}
            onDelete={onDelete}
            onContactTechnicien={onContactTechnicien}
            onAssignTechnician={assignTechnicien}
            techniciens={techniciens}
          />
        ))}
      </div>
    );
  }

  // Desktop view - display as table
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[120px]"
              sortable={true}
              sorted={sortField === 'nom_terrain' ? sortDirection : null}
              onSort={() => handleSort('nom_terrain')}
            >
              Terrain
            </TableHead>
            <TableHead
              sortable={true}
              sorted={sortField === 'region_name' ? sortDirection : null}
              onSort={() => handleSort('region_name')}
            >
              Localisation
            </TableHead>
            <TableHead
              sortable={true}
              sorted={sortField === 'surface' ? sortDirection : null}
              onSort={() => handleSort('surface')}
            >
              Surface
            </TableHead>
            {type === "pending" && userRole === "superviseur" && (
              <TableHead>Technicien</TableHead>
            )}
            {type === "validated" && <TableHead>Validé par</TableHead>}
            <TableHead>Accès</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTerrains.map((terrain) => (
            <TableRow 
              key={terrain.id_terrain || Math.random()}
              className="cursor-pointer"
              onClick={() => onViewDetails && onViewDetails(terrain)}
            >
              <TableCell>
                <div className="font-medium">{terrain.nom_terrain}</div>
                <div className="text-xs text-muted-foreground">
                  {terrain.tantsahaNom || "Non spécifié"}
                </div>
              </TableCell>
              <TableCell>
                {terrain.region_name || "Non spécifié"}, {terrain.commune_name || "Non spécifié"}, {terrain.district_name || "Non spécifié"}
              </TableCell>
              <TableCell>
                {terrain.surface_validee || terrain.surface_proposee} ha
                {terrain.surface_validee && Number(terrain.surface_validee) !== Number(terrain.surface_proposee) && (
                  <div className="text-xs text-muted-foreground">
                    Proposé: {terrain.surface_proposee} ha
                  </div>
                )}
              </TableCell>

              {type === "pending" && userRole === "superviseur" && (
                <TableCell>
                  {terrain.id_technicien ? (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>{terrain.techniqueNom || "Non assigné"}</span>
                    </div>
                  ) : (
                    <div className="flex">
                      <X className="h-4 w-4 text-red-500 mr-1" />
                      <select
                        className="text-xs border rounded px-1 py-0.5 ml-1 bg-white"
                        onChange={(e) =>
                          assignTechnicien(terrain, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        value=""
                      >
                        <option value="" disabled>
                          Assigner
                        </option>
                        {techniciens.map((tech) => (
                          <option key={tech.id_utilisateur} value={tech.id_utilisateur}>
                            {tech.nom} {tech.prenoms}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </TableCell>
              )}

              {type === "validated" && (
                <TableCell>{terrain.superviseurNom || "Non spécifié"}</TableCell>
              )}

              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant={terrain.acces_eau ? "outline" : "secondary"}
                    className="text-xs justify-start"
                  >
                    {terrain.acces_eau ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Eau
                  </Badge>
                  <Badge
                    variant={terrain.acces_route ? "outline" : "secondary"}
                    className="text-xs justify-start"
                  >
                    {terrain.acces_route ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Route
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(terrain);
                      }}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {onEdit &&
                    (userRole === "simple" && terrain.id_tantsaha === terrain.id_tantsaha ||
                      userRole === "technicien" ||
                      userRole === "superviseur") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(terrain);
                        }}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                  {onValidate &&
                    (userRole === "superviseur" || userRole === "technicien") &&
                    terrain.id_technicien &&
                    !terrain.statut && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onValidate(terrain);
                        }}
                        title="Valider le terrain"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    )}

                  {onDelete &&
                    (userRole === "simple" && terrain.id_tantsaha === terrain.id_tantsaha ||
                      userRole === "technicien" ||
                      userRole === "superviseur") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(terrain);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                  {onContactTechnicien &&
                    terrain.id_technicien &&
                    userRole === "simple" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onContactTechnicien(terrain);
                        }}
                        title="Contacter le technicien"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TerrainTable;
