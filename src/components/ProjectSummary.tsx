
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { ProjectData } from "./ProjectTable";
import { renderStatusBadge } from "@/utils/projectUtils";

interface ProjectSummaryProps {
  project: ProjectData;
  showDescription?: boolean;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({ 
  project, 
  showDescription = true 
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-2">
          {project.titre || `Projet #${project.id_projet}`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="flex items-center text-sm mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              {project.region?.nom_region || 'N/A'}, 
              {project.district?.nom_district || 'N/A'}, 
              {project.commune?.nom_commune || 'N/A'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Surface:</span> {project.surface_ha} ha
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Statut actuel:</span> {renderStatusBadge(project.statut)}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Culture(s):</span> {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ') || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm mb-1">
              <span className="font-medium">Propriétaire:</span> {project.tantsaha ? `${project.tantsaha.nom} ${project.tantsaha.prenoms || ''}` : 'N/A'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Terrain:</span> {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Date de création:</span> {project.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        {showDescription && project.description && (
          <div className="mt-2">
            <p className="text-sm font-medium">Description:</p>
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSummary;
