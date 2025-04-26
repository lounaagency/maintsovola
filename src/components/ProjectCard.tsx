
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
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">{project.titre || `Projet #${project.id_projet}`}</h3>
            <p className="text-sm text-muted-foreground">
              {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
            </p>
          </div>
          {renderStatusBadge(project.statut)}
        </div>
        
        <div className="grid grid-cols-2 gap-1 my-2 text-sm">
          <div>
            <span className="font-medium">Surface:</span> {project.surface_ha} ha
          </div>
          <div>
            <span className="font-medium">Culture:</span> {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Localisation:</span> {project.region?.nom_region}, {project.district?.nom_district}
          </div>
          {showFunding && project.currentFunding !== undefined && project.fundingGoal !== undefined && (
            <div className="col-span-2 mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Financement</span>
                <span>{calculateFundingProgress()}%</span>
              </div>
              <Progress value={calculateFundingProgress()} className="h-2" />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-end mt-3 gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
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
              onClick={() => onEdit(project)}
            >
              <FileEdit className="h-4 w-4 mr-1" /> Modifier
            </Button>
          )}
          
          {canValidate && onValidate && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onValidate(project)}
            >
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Valider
            </Button>
          )}
          
          {canLaunchProduction && onLaunchProduction && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onLaunchProduction(project)}
            >
              <Play className="h-4 w-4 mr-1 text-green-500" /> Lancer
            </Button>
          )}
          
          {canDelete && onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive/90"
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
