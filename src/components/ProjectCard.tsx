
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileEdit, CheckCircle, Trash2 } from "lucide-react";
import { ProjectData } from "./ProjectTable";

interface ProjectCardProps {
  project: ProjectData;
  onViewDetails: (project: ProjectData) => void;
  onEdit?: (project: ProjectData) => void;
  onValidate?: (project: ProjectData) => void;
  onDelete?: (project: ProjectData) => void;
  canEdit: boolean;
  canValidate: boolean;
  canDelete: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onEdit,
  onValidate,
  onDelete,
  canEdit,
  canValidate,
  canDelete,
}) => {
  const renderStatusBadge = (status: string) => {
    let variant: "outline" | "secondary" | "destructive" | "default" = "outline";
    
    switch (status) {
      case 'en attente':
        variant = "outline";
        break;
      case 'validé':
      case 'en financement':
        variant = "secondary";
        break;
      case 'en cours':
        variant = "default";
        break;
      case 'terminé':
        variant = "secondary";
        break;
      case 'rejeté':
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-medium truncate">
            {project.titre || `Projet #${project.id_projet}`}
          </h3>
          {renderStatusBadge(project.statut)}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terrain:</span>
            <span className="font-medium">{project.terrain?.nom_terrain || `#${project.id_terrain}`}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Surface:</span>
            <span className="font-medium">{project.surface_ha} ha</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Culture:</span>
            <span className="font-medium truncate max-w-[150px]">
              {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Localisation:</span>
            <span className="font-medium truncate max-w-[150px]">
              {project.region?.nom_region}, {project.district?.nom_district}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(project)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit && onEdit(project)}
          >
            <FileEdit className="h-4 w-4" />
          </Button>
        )}
        
        {canValidate && (
          <Button
            variant="ghost"
            size="sm"
            title="Valider ce projet"
            onClick={() => onValidate && onValidate(project)}
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
          </Button>
        )}

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            title="Supprimer ce projet"
            onClick={() => onDelete && onDelete(project)}
            className="text-destructive hover:text-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
