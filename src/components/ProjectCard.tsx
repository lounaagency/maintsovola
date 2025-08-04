
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileEdit, CheckCircle, Trash2, Play } from "lucide-react";
import { ProjectData } from "./ProjectTable";
import { Progress } from "@/components/ui/progress";
import ContractTemplate from "./ContractTemplate";

interface ProjectCardProps {
  project: ProjectData;
  onViewDetails: (project: ProjectData) => void;
  onEdit?: (project: ProjectData) => void;
  onValidate?: (project: ProjectData) => void;
  onLaunchProduction?: (project: ProjectData) => void;
  onDelete?: (project: ProjectData) => void;
  canEdit?: boolean;
  canValidate?: boolean;
  canLaunchProduction?: boolean;
  canDelete?: boolean;
  showFunding?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onEdit,
  onValidate,
  onLaunchProduction,
  onDelete,
  canEdit = false,
  canValidate = false,
  canLaunchProduction = false,
  canDelete = false,
  showFunding = false
}) => {
  const renderStatusBadge = (status: string) => {
    let variant: "outline" | "secondary" | "destructive" | "default" = "outline";
    
    switch (status) {
      case 'en attente':
        variant = "outline";
        break;
      case 'validé':
        break;
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

  const calculateFundingProgress = () => {
    if (!project.fundingGoal || project.fundingGoal <= 0 || !project.currentFunding) return 0;
    return Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100);
  };

  return (
    <Card className="shadow-sm hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {project.titre || `Projet #${project.id_projet}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
            </p>
          </div>
          {renderStatusBadge(project.statut)}
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-foreground">Surface:</span>
              <p className="text-muted-foreground">{project.surface_ha} ha</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-foreground">Culture:</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="font-medium text-foreground text-sm">Localisation:</span>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {project.region?.nom_region || "Non spécifié"}, {project.district?.nom_district || "Non spécifié"}
            </p>
          </div>

          {showFunding && project.currentFunding !== undefined && project.fundingGoal !== undefined && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-foreground">Financement</span>
                <span className="text-muted-foreground">{calculateFundingProgress()}%</span>
              </div>
              <Progress value={calculateFundingProgress()} className="h-2" />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-primary/10 hover:text-primary"
            onClick={() => onViewDetails(project)}
          >
            <Eye className="h-4 w-4 mr-1" /> Détails
          </Button>
          
          {project.statut === 'en attente' && (
            <ContractTemplate project={project} className="mr-1" />
          )}
          
          {canEdit && onEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600"
              onClick={() => onEdit(project)}
            >
              <FileEdit className="h-4 w-4 mr-1" /> Modifier
            </Button>
          )}
          
          {canValidate && onValidate && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-emerald-50 hover:text-emerald-600"
              onClick={() => onValidate(project)}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Valider
            </Button>
          )}
          
          {canLaunchProduction && onLaunchProduction && (
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-green-50 hover:text-green-600"
              onClick={() => onLaunchProduction(project)}
            >
              <Play className="h-4 w-4 mr-1" /> Lancer
            </Button>
          )}
          
          {canDelete && onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              onClick={() => onDelete(project)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
