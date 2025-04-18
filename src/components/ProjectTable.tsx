
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import ProjectValidationDialog from "./ProjectValidationDialog";
import { motion } from "framer-motion";

export interface ProjectData {
  id_projet: number;
  titre?: string;
  nom_projet?: string;
  description?: string;
  statut: string;
  date_creation?: string;
  date_validation?: string;
  photos?: string[];
  photos_validation?: string[];
  rapport_validation?: string;
  surface_ha: number;
  id_terrain: number;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  id_tantsaha?: string;
  id_technicien?: string;
  id_superviseur?: string;
  id_validateur?: string;
  fundingPercentage?: number;
  terrain?: {
    id_terrain: number;
    nom_terrain?: string;
  };
  tantsaha?: {
    nom: string;
    prenoms?: string;
    photo_profil?: string;
  };
  technicien?: {
    nom: string;
    prenoms?: string;
  };
  superviseur?: {
    nom: string;
    prenoms?: string;
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
  projet_culture?: {
    id_projet_culture: number;
    id_culture: number;
    cout_exploitation_previsionnel?: number;
    rendement_previsionnel?: number;
    culture?: {
      nom_culture: string;
    };
  }[];
}

interface ProjectTableProps {
  filter?: string;
  statutFilter?: string;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ filter = "", statutFilter = "en attente" }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, statutFilter, filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms, photo_profil),
          technicien:id_technicien(nom, prenoms),
          superviseur:id_superviseur(nom, prenoms),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_projet_culture,
            cout_exploitation_previsionnel,
            culture:id_culture(nom_culture)
          )
        `)
        .order('modified_at', { ascending: false });

      // Filter by status
      if (statutFilter === "en attente") {
        query = query.eq('statut', 'en attente');
      } else if (statutFilter === "en financement") {
        query = query.eq('statut', 'validé');
      } else if (statutFilter === "en cours") {
        query = query.eq('statut', 'en cours');
      } else if (statutFilter === "terminé") {
        query = query.eq('statut', 'terminé');
      }

      // Different query based on role
      if (profile?.nom_role === 'simple') {
        query = query.eq('id_tantsaha', user.id);
      } else if (profile?.nom_role === 'technicien') {
        query = query.eq('id_technicien', user.id);
      } else if (profile?.nom_role === 'superviseur') {
        query = query
          .eq('id_superviseur', user.id);
      }

      // Text filter
      if (filter && filter.trim() !== "") {
        const searchTerm = `%${filter.toLowerCase()}%`;
        query = query.or(`nom_projet.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // For each project, calculate the funding percentage
      const projectsWithFunding = await Promise.all((data || []).map(async (project) => {
        // Get total cost of the project
        const totalCost = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.cout_exploitation_previsionnel || 0), 
          0
        );
        
        // Get current investments
        const { data: investments, error: investError } = await supabase
          .from('investissement')
          .select('montant')
          .eq('id_projet', project.id_projet);
          
        if (investError) {
          console.error("Error fetching investments:", investError);
          return { ...project, fundingPercentage: 0 };
        }
        
        const totalInvestment = (investments || []).reduce(
          (sum: number, inv: any) => sum + (inv.montant || 0),
          0
        );
        
        const fundingPercentage = totalCost === 0 ? 0 : Math.min(Math.round((totalInvestment / totalCost) * 100), 100);
        
        return { ...project, fundingPercentage };
      }));
      
      setProjects(projectsWithFunding || []);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowDetailsDialog(true);
  };

  const handleValidate = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowValidationDialog(true);
  };
  
  const handleLaunchProduction = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowDetailsDialog(true);
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {filter
              ? "Aucun projet ne correspond à votre recherche"
              : "Aucun projet dans cette catégorie"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-lg overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Agriculteur</TableHead>
                <TableHead className="hidden md:table-cell">Lieu</TableHead>
                <TableHead className="hidden md:table-cell">Cultures</TableHead>
                <TableHead className="hidden md:table-cell">Surface</TableHead>
                {statutFilter === "en financement" && (
                  <TableHead>Financement</TableHead>
                )}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id_projet}>
                  <TableCell className="font-medium">
                    {project.nom_projet || project.titre}
                    {project.id_technicien === null && project.statut === "en attente" && (
                      <div className="flex items-center text-amber-500 text-xs mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        En attente d'assignation
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs overflow-hidden">
                        {project.tantsaha?.photo_profil ? (
                          <img 
                            src={project.tantsaha.photo_profil} 
                            alt={project.tantsaha?.nom || "Tantsaha"} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          project.tantsaha?.nom?.charAt(0).toUpperCase() || "T"
                        )}
                      </div>
                      <span className="truncate max-w-[100px]">
                        {project.tantsaha?.nom} {project.tantsaha?.prenoms?.charAt(0) || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {project.region?.nom_region}, {project.commune?.nom_commune}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {project.projet_culture?.map((pc) => (
                        <Badge key={pc.id_projet_culture} variant="outline" className="text-xs">
                          {pc.culture?.nom_culture}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {project.surface_ha} ha
                  </TableCell>
                  
                  {statutFilter === "en financement" && (
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">{project.fundingPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${project.fundingPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(project.id_projet)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir</span>
                      </Button>
                      
                      {statutFilter === "en attente" && profile?.nom_role === "superviseur" && (
                        <Button
                          size="sm"
                          onClick={() => handleValidate(project.id_projet)}
                        >
                          Valider
                        </Button>
                      )}
                      
                      {statutFilter === "en financement" && 
                       (profile?.nom_role === "technicien" || profile?.nom_role === "superviseur") && 
                       project.fundingPercentage === 100 && (
                        <Button
                          size="sm"
                          onClick={() => handleLaunchProduction(project.id_projet)}
                        >
                          Lancer production
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {selectedProjectId && (
        <>
          <ProjectDetailsDialog
            isOpen={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              fetchProjects(); // Refresh data after possible changes
            }}
            projectId={selectedProjectId}
            userRole={profile?.nom_role}
          />
          
          <ProjectValidationDialog
            isOpen={showValidationDialog}
            onClose={() => {
              setShowValidationDialog(false);
              fetchProjects(); // Refresh data after validation
            }}
            project={selectedProjectId}
          />
        </>
      )}
    </div>
  );
};

export default ProjectTable;
