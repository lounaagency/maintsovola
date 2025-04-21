
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ProjectData } from "@/components/ProjectTable";

/**
 * Renders a status badge with appropriate styling based on project status
 */
export const renderStatusBadge = (status: string) => {
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
 * Calculate project funding percentage
 */
export const calculateProjectFunding = (project: ProjectData, investments: Array<{montant: number}>): number => {
  if (!project.fundingGoal || project.fundingGoal <= 0) return 0;
  
  const totalInvestment = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);
  return Math.min(Math.round((totalInvestment / project.fundingGoal) * 100), 100);
};

/**
 * Check if production can be launched
 */
export const canLaunchProduction = (
  project: ProjectData, 
  fundingPercentage: number, 
  userRole: string | null
): boolean => {
  if (!userRole || !project || project.statut !== 'en financement') {
    return false;
  }
  
  const isValidRole = userRole === 'technicien' || userRole === 'superviseur';
  return isValidRole && fundingPercentage >= 100;
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
