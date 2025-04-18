import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, FileEdit, CheckCircle, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import ProjectEditDialog from "./ProjectEditDialog";
import ProjectValidationDialog from "./ProjectValidationDialog";
import ProductionLaunchDialog from "./ProductionLaunchDialog";
import ProjectCard from "./ProjectCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { canDeleteProject, canEditProject, canValidateProject, renderStatusBadge } from "@/utils/projectUtils";

interface ProjectTableProps {
  filter?: string;
  showActions?: boolean;
  statutFilter?: string;
  showFullyFundedOnly?: boolean;
}

export interface ProjectData {
  id_projet: number;
  titre?: string;
  statut: string;
  surface_ha: number;
  description?: string;
  created_at?: string;
  id_tantsaha?: string;
  id_technicien?: string;
  id_superviseur?: string;
  id_terrain: number;
  tantsaha?: {
    nom: string;
    prenoms: string;
  } | null;
  terrain?: {
    nom_terrain?: string;
  };
  region?: {
    nom_region?: string;
  };
  district?: {
    nom_district?: string;
  };
  commune?: {
    nom_commune?: string;
  };
  projet_culture?: Array<{
    id_projet_culture: number;
    id_culture: number;
    culture?: {
      nom_culture?: string;
    };
    cout_exploitation_previsionnel?: number;
  }>;
  photos?: string;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  investissements?: Array<{
    id_investissement: number;
    montant: number;
  }>;
  currentFunding?: number;
  fundingGoal?: number;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ 
  filter = "", 
  showActions = true, 
  statutFilter = "",
  showFullyFundedOnly 
}) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [productionLaunchOpen, setProductionLaunchOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('nom_role')
            .eq('id_utilisateur', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setUserRole(data.nom_role);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle de l'utilisateur:", error);
        }
      }
    };
    
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [statutFilter, filter, user, userRole, sortColumn, sortDirection, showFullyFundedOnly]);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_projet_culture,
            id_culture,
            culture:id_culture(nom_culture),
            cout_exploitation_previsionnel
          ),
          investissements:investissement(
            id_investissement,
            montant
          )
        `);
      
      if (userRole === 'simple') {
        query = query.eq('id_tantsaha', user.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user.id);
      } else if (userRole === 'superviseur') {
        // Supervisors see all projects
      }
      
      if (filter) {
        query = query.or(`description.ilike.%${filter}%,titre.ilike.%${filter}%`);
      }
      
      if (statutFilter) {
        query = query.eq(`statut`, statutFilter);
      }
      
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Calculate funding goal and current funding for each project
      const projectsWithFunding = data.map(project => {
        const fundingGoal = calculateFundingGoal(project);
        const currentFunding = calculateCurrentFunding(project);
        const isFunded = currentFunding >= fundingGoal;
        
        return {
          ...project,
          fundingGoal,
          currentFunding,
          isFunded
        };
      });
      
      // Filter projects based on funding status if needed
      let filteredProjects = projectsWithFunding;
      if (statutFilter === 'en financement' && showFullyFundedOnly !== undefined) {
        filteredProjects = projectsWithFunding.filter(project => {
          return showFullyFundedOnly ? project.isFunded : !project.isFunded;
        });
      }
      
      setProjects(filteredProjects as unknown as ProjectData[]);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      toast.error("Impossible de charger les projets");
    } finally {
      setLoading(false);
    }
  };

  const calculateFundingGoal = (project: any): number => {
    if (!project.projet_culture || project.projet_culture.length === 0) return 0;
    
    const totalCost = project.projet_culture.reduce((sum: number, culture: any) => {
      const cultureCost = culture.cout_exploitation_previsionnel || 0;
      return sum + (cultureCost * project.surface_ha);
    }, 0);
    
    return totalCost;
  };

  const calculateCurrentFunding = (project: any): number => {
    if (!project.investissements || project.investissements.length === 0) return 0;
    
    return project.investissements.reduce((sum: number, inv: any) => {
      return sum + (inv.montant || 0);
    }, 0);
  };

  const handleOpenDetails = (project: ProjectData) => {
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const handleOpenEdit = (project: ProjectData) => {
    setSelectedProject(project);
    setEditOpen(true);
  };
  
  const handleOpenValidation = (project: ProjectData) => {
    setSelectedProject(project);
    setValidationOpen(true);
  };

  const handleOpenProductionLaunch = (project: ProjectData) => {
    setSelectedProject(project);
    setProductionLaunchOpen(true);
  };

  const handleOpenDeleteConfirm = (project: ProjectData) => {
    setSelectedProject(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !user) return;
    
    try {
      const { error: cultureError } = await supabase
        .from('projet_culture')
        .delete()
        .eq('id_projet', selectedProject.id_projet);
        
      if (cultureError) throw cultureError;
      
      const { error: projectError } = await supabase
        .from('projet')
        .delete()
        .eq('id_projet', selectedProject.id_projet);
        
      if (projectError) throw projectError;
      
      toast.success("Projet supprimé avec succès");
      setDeleteConfirmOpen(false);
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id_projet !== selectedProject.id_projet)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      toast.error("Impossible de supprimer le projet");
    }
  };

  const handleProjectUpdated = () => {
    fetchProjects();
    setEditOpen(false);
    setValidationOpen(false);
    setProductionLaunchOpen(false);
  };
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const isValidationUser = canValidateProject(userRole);
  const showValidateButton = isValidationUser && statutFilter === "en attente";
  
  // Show Production Launch button for projects with 100% funding
  const canLaunchProduction = (userRole === 'technicien' || userRole === 'superviseur') && 
                              statutFilter === "en financement" && 
                              showFullyFundedOnly === true;

  if (loading) {
    return (
      <Card className="w-full shadow-sm">
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-lg text-muted-foreground">Chargement des projets...</p>
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="w-full shadow-sm">
        <div className="flex justify-center items-center p-8">
          <p className="text-muted-foreground">Aucun projet trouvé.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      {isMobile ? (
        <div className="grid grid-cols-1 gap-4 p-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id_projet}
              project={project}
              onViewDetails={handleOpenDetails}
              onEdit={handleOpenEdit}
              onValidate={handleOpenValidation}
              onLaunchProduction={canLaunchProduction ? handleOpenProductionLaunch : undefined}
              onDelete={handleOpenDeleteConfirm}
              canEdit={canEditProject(project, userRole, user?.id)}
              canValidate={showValidateButton}
              canLaunchProduction={canLaunchProduction}
              canDelete={canDeleteProject(project, userRole, user?.id)}
              showFunding={statutFilter === "en financement"}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[80px] cursor-pointer"
                  onClick={() => handleSort('id_projet')}
                  sortable
                  sorted={sortColumn === 'id_projet' ? sortDirection : null}
                  onSort={() => handleSort('id_projet')}
                >
                  ID
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('titre')}
                  sortable
                  sorted={sortColumn === 'titre' ? sortDirection : null}
                  onSort={() => handleSort('titre')}
                >
                  Titre
                </TableHead>
                <TableHead>Culture</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('id_terrain')}
                  sortable
                  sorted={sortColumn === 'id_terrain' ? sortDirection : null}
                  onSort={() => handleSort('id_terrain')}
                >
                  Terrain
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('surface_ha')}
                  sortable
                  sorted={sortColumn === 'surface_ha' ? sortDirection : null}
                  onSort={() => handleSort('surface_ha')}
                >
                  Surface (ha)
                </TableHead>
                {statutFilter === "en financement" && (
                  <TableHead>Financement</TableHead>
                )}
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('statut')}
                  sortable
                  sorted={sortColumn === 'statut' ? sortDirection : null}
                  onSort={() => handleSort('statut')}
                >
                  Statut
                </TableHead>
                {userRole !== 'simple' && (
                  <TableHead>Agriculteur</TableHead>
                )}
                <TableHead>Localisation</TableHead>
                {showActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow 
                  key={project.id_projet}
                  className="cursor-pointer"
                  onClick={() => handleOpenDetails(project)}
                >
                  <TableCell className="font-medium">{project.id_projet}</TableCell>
                  <TableCell>{project.titre || `Projet #${project.id_projet}`}</TableCell>
                  <TableCell>
                    {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
                  </TableCell>
                  <TableCell>{project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}</TableCell>
                  <TableCell>{project.surface_ha}</TableCell>
                  {statutFilter === "en financement" && (
                    <TableCell>
                      {project.fundingGoal && project.currentFunding 
                        ? `${Math.round((project.currentFunding / project.fundingGoal) * 100)}%`
                        : 'N/A'
                      }
                    </TableCell>
                  )}
                  <TableCell>{renderStatusBadge(project.statut)}</TableCell>
                  {userRole !== 'simple' && (
                    <TableCell>
                      {project.tantsaha ? `${project.tantsaha.nom} ${project.tantsaha.prenoms || ''}` : 'N/A'}
                    </TableCell>
                  )}
                  <TableCell>
                    {project.region?.nom_region}, {project.district?.nom_district}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(project);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditProject(project, userRole, user?.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(project);
                            }}
                          >
                            <FileEdit className="h-4 w-4" />
                          </Button>
                        )}
                        {showValidateButton && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Valider ce projet"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenValidation(project);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {canLaunchProduction && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Lancer la production"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProductionLaunch(project);
                            }}
                          >
                            <Play className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {canDeleteProject(project, userRole, user?.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer ce projet"
                            className="text-destructive hover:text-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteConfirm(project);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedProject && (
        <>
          <ProjectDetailsDialog
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            projectId={selectedProject.id_projet}
            userRole={userRole || undefined}
          />
          <ProjectEditDialog
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            project={selectedProject}
            onSubmitSuccess={handleProjectUpdated}
            userId={user?.id}
            userRole={userRole}
          />
          <ProjectValidationDialog
            isOpen={validationOpen}
            onClose={() => setValidationOpen(false)}
            project={selectedProject}
            onSubmitSuccess={handleProjectUpdated}
            userId={user?.id}
            userRole={userRole}
          />
          <ProductionLaunchDialog
            isOpen={productionLaunchOpen}
            onClose={() => setProductionLaunchOpen(false)}
            project={selectedProject}
            onSubmitSuccess={handleProjectUpdated}
          />
        </>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProjectTable;
