
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, FileEdit, Eye } from "lucide-react";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import ProjectEditDialog from "./ProjectEditDialog";
import { toast } from "sonner";

interface ProjectTableProps {
  filter?: string;
  showActions?: boolean;
}

export interface ProjectData {
  id_projet: number;
  titre: string;
  statut: string;
  surface_ha: number;
  description: string;
  created_at: string;
  id_tantsaha: string;
  id_technicien?: string;
  id_superviseur?: string;
  id_terrain: number;
  tantsaha?: {
    nom: string;
    prenoms: string;
  };
  terrain?: {
    nom_terrain: string;
  };
  region?: {
    nom_region: string;
  };
  district?: {
    nom_district: string;
  };
  commune?: {
    nom_commune: string;
  };
  projet_culture?: Array<{
    id_projet_culture: number;
    id_culture: number;
    culture: {
      nom_culture: string;
    };
  }>;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ filter = "", showActions = true }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

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
  }, [filter, user, userRole]);

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
            culture:id_culture(nom_culture)
          )
        `);
      
      // Apply filters based on user role
      if (userRole === 'tantsaha') {
        query = query.eq('id_tantsaha', user.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user.id);
      } else if (userRole === 'superviseur') {
        // Supervisors see all projects
      }
      
      // Apply search filter if provided
      if (filter) {
        query = query.or(`description.ilike.%${filter}%,titre.ilike.%${filter}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      toast.error("Impossible de charger les projets");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (project: ProjectData) => {
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const handleOpenEdit = (project: ProjectData) => {
    setSelectedProject(project);
    setEditOpen(true);
  };

  const handleProjectUpdated = () => {
    fetchProjects();
    setEditOpen(false);
  };

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
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Card className="w-full shadow-sm">
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-lg text-muted-foreground">Chargement des projets...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {projects.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-muted-foreground">Aucun projet trouvé.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Culture</TableHead>
                  <TableHead>Terrain</TableHead>
                  <TableHead>Surface (ha)</TableHead>
                  <TableHead>Statut</TableHead>
                  {userRole !== 'tantsaha' && (
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
                    clickable={true}
                    onClick={() => handleOpenDetails(project)}
                  >
                    <TableCell className="font-medium">{project.id_projet}</TableCell>
                    <TableCell>
                      {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}
                    </TableCell>
                    <TableCell>{project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}</TableCell>
                    <TableCell>{project.surface_ha}</TableCell>
                    <TableCell>{renderStatusBadge(project.statut)}</TableCell>
                    {userRole !== 'tantsaha' && (
                      <TableCell>
                        {project.tantsaha ? `${project.tantsaha.nom} ${project.tantsaha.prenoms || ''}` : 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      {project.region?.nom_region}, {project.district?.nom_district}
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
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
                        {(userRole === 'superviseur' || 
                           userRole === 'technicien' || 
                          (userRole === 'tantsaha' && project.id_tantsaha === user?.id)) && (
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
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
            userId={user?.id || ''}
            userRole={userRole || undefined}
          />
        </>
      )}
    </Card>
  );
};

export default ProjectTable;
