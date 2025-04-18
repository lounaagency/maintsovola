import React from "react";
import { Badge } from "@/components/ui/badge";
import { ProjectData } from "@/components/ProjectTable";

/**
 * Renders a status badge with appropriate styling based on project status
 */
export const renderStatusBadge = (status: string) => {
  switch (status) {
    case "en attente":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En attente</Badge>;
    case "validé":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En financement</Badge>;
    case "en cours":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">En production</Badge>;
    case "terminé":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Terminé</Badge>;
    case "rejeté":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeté</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

/**
 * Determine if user can validate a project
 */
export const canValidateProject = (userRole: string | null): boolean => {
  return userRole === 'technicien' || userRole === 'superviseur';
};

/**
 * Check if project can be deleted (only in "en attente" status)
 */
export const canDeleteProject = (project: ProjectData, userRole: string | null, userId?: string): boolean => {
  return project.statut === 'en attente' && 
         (userRole === 'superviseur' || 
          (userRole === 'simple' && project.id_tantsaha === userId));
};

/**
 * Check if user can edit a project
 */
export const canEditProject = (project: ProjectData, userRole: string | null, userId?: string): boolean => {
  return userRole === 'superviseur' || 
         userRole === 'technicien' || 
         (userRole === 'simple' && project.id_tantsaha === userId);
};

/**
 * Format project summary for display
 */
export const getProjectSummary = (project: ProjectData) => {
  return {
    title: project.titre || `Projet #${project.id_projet}`,
    terrain: project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`,
    surface: project.surface_ha,
    cultures: project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ') || 'N/A',
    location: project.region?.nom_region && project.district?.nom_district 
      ? `${project.region.nom_region}, ${project.district.nom_district}`
      : 'N/A',
    status: project.statut,
    createdAt: project.created_at || 'N/A'
  };
};

/**
 * Calculate the funding percentage based on project costs and total investment
 */
export const getFundingPercentage = (
  project: ProjectData, 
  totalInvestment: number | null = null
): number => {
  // If totalInvestment is provided directly, use it
  if (totalInvestment !== null) {
    const totalCost = project.projet_culture?.reduce(
      (sum, pc) => sum + (pc.cout_exploitation_previsionnel || 0), 
      0
    ) || 0;
    
    return totalCost === 0 ? 0 : Math.min(Math.round((totalInvestment / totalCost) * 100), 100);
  }
  
  // Otherwise use the pre-calculated percentage if available
  return project.fundingPercentage || 0;
};
