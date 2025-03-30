
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { TerrainData } from "@/types/terrain";
import TerrainTable from "@/components/TerrainTable";
import TerrainForm from "@/components/TerrainForm";
import TerrainEditDialog from "@/components/TerrainEditDialog";
import ProjectForm from "@/components/ProjectForm";
import ProjectEditDialog from "@/components/ProjectEditDialog";
import ProjectDetailsDialog from "@/components/ProjectDetailsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import JalonReportDialog from "@/components/JalonReportDialog";

// Add Leaflet dependency
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";

const Terrain: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("terrains");
  const [activeProjectTab, setActiveProjectTab] = useState("pending");
  const [isCreatingTerrain, setIsCreatingTerrain] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [fundingProjects, setFundingProjects] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [techniciens, setTechniciens] = useState<{id: string; nom: string; prenoms?: string}[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [agriculteurs, setAgriculteurs] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);

  // Dialog states
  const [isEditingTerrain, setIsEditingTerrain] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isViewingProjectDetails, setIsViewingProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showNoTerrainAlert, setShowNoTerrainAlert] = useState(false);
  const [showJalonReportDialog, setShowJalonReportDialog] = useState(false);
  const [selectedJalon, setSelectedJalon] = useState<{id: number, name: string} | null>(null);

  if (!user) {
    return <Navigate to="/auth" />;
  }

  useEffect(() => {
    fetchUserRole();
    fetchTechniciens();
    fetchAgriculteurs();
  }, [user]);

  useEffect(() => {
    if (userRole) {
      fetchTerrains();
      fetchProjects();
    }
  }, [userRole]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('nom_role')
        .eq('id_utilisateur', user?.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setUserRole(data.nom_role);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
    }
  };

  const fetchAgriculteurs = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('nom_role', 'agriculteur');
      
      if (error) throw error;
      
      setAgriculteurs(data);
    } catch (error) {
      console.error('Error fetching agriculteurs:', error);
    }
  };

  const fetchTerrains = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          technicien:id_technicien(nom, prenoms)
        `);
      
      if (userRole === 'agriculteur' || userRole === 'investisseur') {
        query = query.eq('id_tantsaha', user?.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data.map(item => ({
        ...item,
        id_tantsaha: item.id_tantsaha,
        region_name: item.region?.nom_region,
        district_name: item.district?.nom_district,
        commune_name: item.commune?.nom_commune,
        techniqueNom: item.technicien?.nom,
        techniquePrenoms: item.technicien?.prenoms
      }));

      const validated = transformedData.filter(terrain => terrain.statut);
      const pending = transformedData.filter(terrain => !terrain.statut);
      
      setValidatedTerrains(validated);
      setPendingTerrains(pending);
    } catch (error) {
      console.error('Error fetching terrains:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les terrains",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('projet')
        .select(`
          *,
          terrain:id_terrain(*),
          tantsaha:id_tantsaha(nom, prenoms),
          technicien:id_technicien(nom, prenoms),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_culture,
            culture:id_culture(nom_culture)
          )
        `);
      
      if (userRole === 'agriculteur' || userRole === 'investisseur') {
        query = query.eq('id_tantsaha', user?.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format project data and group by status
      const pendingList = data.filter(p => p.statut === 'en attente');
      const fundingList = data.filter(p => p.statut === 'validé');
      const activeList = data.filter(p => p.statut === 'en cours');
      
      // Add cultures array to each project
      const formatProjects = (projects: any[]) => {
        return projects.map(p => ({
          ...p,
          cultures: p.projet_culture.map((pc: any) => ({
            id_culture: pc.id_culture,
            nom_culture: pc.culture?.nom_culture
          }))
        }));
      };
      
      setPendingProjects(formatProjects(pendingList));
      setFundingProjects(formatProjects(fundingList));
      setActiveProjects(formatProjects(activeList));
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechniciens = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('nom_role', 'technicien');
      
      if (error) throw error;
      
      setTechniciens(data.map(tech => ({
        id: tech.id_utilisateur,
        nom: tech.nom,
        prenoms: tech.prenoms
      })));
    } catch (error) {
      console.error('Error fetching techniciens:', error);
    }
  };

  const handleEditTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsEditingTerrain(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsEditingProject(true);
  };

  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsViewingProjectDetails(true);
  };

  const handleCreateProject = () => {
    if (validatedTerrains.length === 0 && (userRole === 'agriculteur' || userRole === 'investisseur')) {
      setShowNoTerrainAlert(true);
    } else {
      setIsCreatingProject(true);
    }
  };

  const handleOpenJalonReport = (jalonId: number, jalonName: string) => {
    setSelectedJalon({
      id: jalonId,
      name: jalonName
    });
    setShowJalonReportDialog(true);
  };

  const handleValidateProject = async (projectId: number) => {
    try {
      const { error } = await supabase
        .from('projet')
        .update({ statut: 'validé' })
        .eq('id_projet', projectId);
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Le projet a été validé et est maintenant en phase de financement",
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error validating project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le projet",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container max-w-7xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold">Gestion des Terrains et Projets</h1>
      </motion.div>

      <Tabs 
        defaultValue="terrains" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terrains">Terrains</TabsTrigger>
          <TabsTrigger value="projets">Projets</TabsTrigger>
        </TabsList>
        
        {/* TERRAINS TAB */}
        <TabsContent value="terrains" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => setIsCreatingTerrain(!isCreatingTerrain)} 
              variant={isCreatingTerrain ? "outline" : "default"}
            >
              {isCreatingTerrain ? "Annuler" : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un terrain
                </>
              )}
            </Button>
          </div>
          
          {isCreatingTerrain && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <TerrainForm 
                onSubmitSuccess={() => {
                  setIsCreatingTerrain(false);
                  fetchTerrains();
                }}
                onCancel={() => setIsCreatingTerrain(false)}
                userId={user.id}
                userRole={userRole || undefined}
                agriculteurs={agriculteurs}
              />
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Terrains en attente de validation</h2>
                <TerrainTable 
                  terrains={pendingTerrains} 
                  type="pending" 
                  userRole={userRole || undefined}
                  onTerrainUpdate={fetchTerrains}
                  techniciens={techniciens}
                  onEditTerrain={handleEditTerrain}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Terrains validés</h2>
                <TerrainTable 
                  terrains={validatedTerrains} 
                  type="validated" 
                  userRole={userRole || undefined}
                  onTerrainUpdate={fetchTerrains}
                  onEditTerrain={handleEditTerrain}
                />
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* PROJETS TAB */}
        <TabsContent value="projets" className="space-y-4">
          <div className="flex justify-between items-center">
            <Tabs 
              value={activeProjectTab} 
              onValueChange={setActiveProjectTab} 
              className="w-full"
            >
              <TabsList>
                {(userRole === 'agriculteur' || userRole === 'investisseur' || userRole === 'superviseur') && (
                  <TabsTrigger value="pending">
                    En attente
                  </TabsTrigger>
                )}
                <TabsTrigger value="funding">
                  En financement
                </TabsTrigger>
                <TabsTrigger value="active">
                  En production
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {(userRole === 'agriculteur' || userRole === 'investisseur') && (
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un projet
              </Button>
            )}
          </div>
          
          {isCreatingProject && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <ProjectForm 
                onSubmitSuccess={() => {
                  setIsCreatingProject(false);
                  fetchProjects();
                }}
                onCancel={() => setIsCreatingProject(false)}
                userId={user.id}
                userRole={userRole || undefined}
              />
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-4">
              <TabsContent value="pending" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Agriculteur</TableHead>
                        <TableHead>Terrain</TableHead>
                        <TableHead>Cultures</TableHead>
                        <TableHead>Surface (ha)</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProjects.length > 0 ? (
                        pendingProjects.map((project) => (
                          <TableRow key={project.id_projet}>
                            <TableCell>{project.id_projet}</TableCell>
                            <TableCell>
                              {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                            </TableCell>
                            <TableCell>{project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {project.cultures.map((c: any, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {c.nom_culture}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{project.surface_ha} ha</TableCell>
                            <TableCell>{formatDate(project.created_at)}</TableCell>
                            <TableCell className="flex gap-2">
                              {userRole === 'technicien' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleValidateProject(project.id_projet)}
                                >
                                  Valider
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditProject(project)}
                              >
                                Modifier
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Aucun projet en attente
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="funding" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Agriculteur</TableHead>
                        <TableHead>Terrain</TableHead>
                        <TableHead>Cultures</TableHead>
                        <TableHead>Surface (ha)</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundingProjects.length > 0 ? (
                        fundingProjects.map((project) => (
                          <TableRow key={project.id_projet}>
                            <TableCell>{project.id_projet}</TableCell>
                            <TableCell>
                              {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                            </TableCell>
                            <TableCell>{project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {project.cultures.map((c: any, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {c.nom_culture}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{project.surface_ha} ha</TableCell>
                            <TableCell>{formatDate(project.created_at)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewProjectDetails(project)}
                              >
                                Détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Aucun projet en phase de financement
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Agriculteur</TableHead>
                        <TableHead>Terrain</TableHead>
                        <TableHead>Cultures</TableHead>
                        <TableHead>Surface (ha)</TableHead>
                        <TableHead>Lancement</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeProjects.length > 0 ? (
                        activeProjects.map((project) => (
                          <TableRow key={project.id_projet}>
                            <TableCell>{project.id_projet}</TableCell>
                            <TableCell>
                              {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                            </TableCell>
                            <TableCell>{project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {project.cultures.map((c: any, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {c.nom_culture}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{project.surface_ha} ha</TableCell>
                            <TableCell>{formatDate(project.date_lancement)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewProjectDetails(project)}
                              >
                                Détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Aucun projet en cours de production
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* No Terrain Alert Dialog */}
      <AlertDialog open={showNoTerrainAlert} onOpenChange={setShowNoTerrainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aucun terrain disponible</AlertDialogTitle>
            <AlertDialogDescription>
              Vous n'avez pas de terrains validés disponibles. Vous devez d'abord créer un terrain et attendre sa validation avant de pouvoir créer un projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoTerrainAlert(false);
              setActiveTab("terrains");
              setIsCreatingTerrain(true);
            }}>
              Créer un terrain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Terrain Edit Dialog */}
      {selectedTerrain && (
        <TerrainEditDialog
          isOpen={isEditingTerrain}
          onClose={() => setIsEditingTerrain(false)}
          terrain={selectedTerrain}
          onSubmitSuccess={() => {
            fetchTerrains();
            setIsEditingTerrain(false);
          }}
          userId={user.id}
          userRole={userRole || undefined}
          agriculteurs={agriculteurs}
        />
      )}
      
      {/* Project Edit Dialog */}
      {selectedProject && (
        <ProjectEditDialog
          isOpen={isEditingProject}
          onClose={() => setIsEditingProject(false)}
          project={selectedProject}
          onSubmitSuccess={() => {
            fetchProjects();
            setIsEditingProject(false);
          }}
          userId={user.id}
          userRole={userRole || undefined}
        />
      )}
      
      {/* Project Details Dialog */}
      {selectedProject && (
        <ProjectDetailsDialog
          isOpen={isViewingProjectDetails}
          onClose={() => setIsViewingProjectDetails(false)}
          projectId={selectedProject.id_projet}
          userRole={userRole || undefined}
        />
      )}
      
      {/* Jalon Report Dialog */}
      {selectedJalon && selectedProject && (
        <JalonReportDialog
          isOpen={showJalonReportDialog}
          onClose={() => setShowJalonReportDialog(false)}
          projectId={selectedProject.id_projet}
          jalonId={selectedJalon.id}
          jalonName={selectedJalon.name}
          onSubmitSuccess={() => {
            // Refresh project details
            if (isViewingProjectDetails) {
              // Refresh project details
            }
          }}
        />
      )}
    </div>
  );
};

export default Terrain;
