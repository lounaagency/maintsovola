
import React from 'react';
import { Badge } from './ui/badge';
import { ProjectData } from './ProjectTable';
import { renderStatusBadge } from '@/utils/projectUtils';

interface ProjectSummaryProps {
  project: ProjectData;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({ project }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {project.titre || `Projet #${project.id_projet}`}
        </h2>
        {renderStatusBadge(project.statut)}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Agriculteur:</span>
            <span className="font-medium">
              {project.tantsaha ? `${project.tantsaha.nom} ${project.tantsaha.prenoms || ''}` : 'Non assigné'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Surface:</span>
            <span className="font-medium">{project.surface_ha} ha</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Terrain:</span>
            <span className="font-medium">
              {project.terrain?.nom_terrain || `#${project.id_terrain}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Localisation:</span>
            <span className="font-medium">
              {project.region?.nom_region}, {project.district?.nom_district}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span className="font-medium capitalize">{project.statut}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Technicien:</span>
            <span className="font-medium">
              {project.technicien ? `${project.technicien.nom} ${project.technicien.prenoms || ''}` : 'Non assigné'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Superviseur:</span>
            <span className="font-medium">
              {project.superviseur ? `${project.superviseur.nom} ${project.superviseur.prenoms || ''}` : 'Non assigné'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Cultures:</span>
            <div className="flex flex-wrap justify-end gap-1">
              {project.projet_culture?.map((pc) => (
                <Badge key={pc.id_projet_culture} variant="outline" className="text-xs">
                  {pc.culture?.nom_culture}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {project.description && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Description</h3>
          <p className="text-sm text-gray-600">{project.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectSummary;
