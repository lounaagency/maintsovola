import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, ShieldCheck, Trash2, Clock, Check, X } from "lucide-react";
import { TerrainData } from "@/types/terrain";

interface TerrainListCardProps {
  terrain: TerrainData;
  type?: "pending" | "validated";
  userRole?: string;
  onViewDetails?: (terrain: TerrainData) => void;
  onEdit?: (terrain: TerrainData) => void;
  onValidate?: (terrain: TerrainData) => void;
  onDelete?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  onAssignTechnician?: (terrain: TerrainData, technicianId: string) => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainListCard: React.FC<TerrainListCardProps> = ({
  terrain,
  type = "pending",
  userRole = "simple",
  onViewDetails,
  onEdit,
  onValidate,
  onDelete,
  onContactTechnicien,
  onAssignTechnician,
  techniciens = [],
}) => {
  const canEdit = userRole === "simple" && terrain.id_tantsaha === terrain.id_tantsaha ||
                  userRole === "technicien" ||
                  userRole === "superviseur";

  const canValidate = (userRole === "superviseur" || userRole === "technicien") &&
                      terrain.id_technicien &&
                      !terrain.statut;

  const canDelete = userRole === "simple" && terrain.id_tantsaha === terrain.id_tantsaha ||
                    userRole === "technicien" ||
                    userRole === "superviseur";

  const canContact = onContactTechnicien &&
                     terrain.id_technicien &&
                     userRole === "simple";

  const renderStatusBadge = () => {
    if (terrain.statut) {
      return <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">Validé</Badge>;
    } else {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En attente</Badge>;
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-1 leading-tight truncate">
              {terrain.nom_terrain}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {terrain.tantsahaNom || "Non spécifié"}
            </p>
          </div>
          {renderStatusBadge()}
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-foreground">Surface:</span>
              <p className="text-muted-foreground">
                {terrain.surface_validee || terrain.surface_proposee} ha
              </p>
            </div>
            <div>
              <span className="font-medium text-foreground">Localisation:</span>
              <p className="text-muted-foreground leading-tight truncate">
                {terrain.region_name || "Non spécifié"}, {terrain.commune_name || "Non spécifié"}
              </p>
            </div>
          </div>

          {/* Access badges */}
          <div className="flex gap-1">
            <Badge
              variant={terrain.acces_eau ? "default" : "secondary"}
              className={`text-xs px-1 py-0 ${terrain.acces_eau 
                ? "bg-blue-100 text-blue-800 border-blue-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {terrain.acces_eau ? (
                <Check className="h-2 w-2 mr-1" />
              ) : (
                <X className="h-2 w-2 mr-1" />
              )}
              Eau
            </Badge>
            <Badge
              variant={terrain.acces_route ? "default" : "secondary"}
              className={`text-xs px-1 py-0 ${terrain.acces_route 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {terrain.acces_route ? (
                <Check className="h-2 w-2 mr-1" />
              ) : (
                <X className="h-2 w-2 mr-1" />
              )}
              Route
            </Badge>
          </div>

          {/* Technician assignment for supervisors */}
          {type === "pending" && userRole === "superviseur" && (
            <div className="pt-1 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Technicien:</span>
              {terrain.id_technicien ? (
                <div className="flex items-center mt-1">
                  <Check className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-xs text-foreground truncate">{terrain.techniqueNom || "Non assigné"}</span>
                </div>
              ) : (
                <div className="mt-1">
                  <select
                    className="w-full text-xs border border-border rounded px-1 py-1 bg-background"
                    onChange={(e) => onAssignTechnician && onAssignTechnician(terrain, e.target.value)}
                    value=""
                  >
                    <option value="" disabled>
                      Assigner un technicien
                    </option>
                    {techniciens.map((tech) => (
                      <option key={tech.id_utilisateur} value={tech.id_utilisateur}>
                        {tech.nom} {tech.prenoms}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Validation info for validated terrains */}
          {type === "validated" && (
            <div className="pt-1 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Validé par:</span>
              <p className="text-xs text-foreground mt-1 truncate">{terrain.superviseurNom || "Non spécifié"}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-end gap-1">
          {onViewDetails && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-primary/10 hover:text-primary text-xs px-2 py-1 h-auto"
              onClick={() => onViewDetails(terrain)}
            >
              <Eye className="h-3 w-3 mr-1" /> Détails
            </Button>
          )}
          
          {canEdit && onEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 text-xs px-2 py-1 h-auto"
              onClick={() => onEdit(terrain)}
            >
              <Edit className="h-3 w-3 mr-1" /> Modifier
            </Button>
          )}
          
          {canValidate && onValidate && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-emerald-50 hover:text-emerald-600 text-xs px-2 py-1 h-auto"
              onClick={() => onValidate(terrain)}
            >
              <ShieldCheck className="h-3 w-3 mr-1" /> Valider
            </Button>
          )}
          
          {canContact && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-orange-50 hover:text-orange-600 text-xs px-2 py-1 h-auto"
              onClick={() => onContactTechnicien!(terrain)}
            >
              <Clock className="h-3 w-3 mr-1" /> Contacter
            </Button>
          )}
          
          {canDelete && onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 text-xs px-2 py-1 h-auto"
              onClick={() => onDelete(terrain)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TerrainListCard;