import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerrainTable from '@/components/TerrainTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TerrainEditDialog from '@/components/TerrainEditDialog';
import ProjectEditDialog from '@/components/ProjectEditDialog';
import MessageDialog from '@/components/MessageDialog';
import ProjectDetailsDialog from '@/components/ProjectDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TerrainData } from "@/types/terrain";

export const Terrain = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTechnicien, setSelectedTechnicien] = useState<{id: string; name: string} | null>(null);
  
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  const [agriculteurs, setAgriculteurs] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);
  const [techniciens, setTechniciens] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);
  
  const userRole = profile?.nom_role?.toLowerCase() || 'agriculteur';

  const fetchAgriculteurs = useCallback(async () => {
    if (userRole !== 'technicien' && userRole !== 'superviseur') return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 2);
        
      if (error) throw error;
      setAgriculteurs(data || []);
    } catch (error) {
      console.error('Error fetching agriculteurs:', error);
    }
  }, [userRole]);

  const fetchTerrains = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          technicien:id_technicien(id_utilisateur, nom, prenoms)
        `);
      
      if (userRole === 'agriculteur') {
        query = query.eq('id_tantsaha', user.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user.id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      const terrainData = (data || []).map(terrain => ({
        id_terrain: terrain.id_terrain,
        nom_terrain: terrain.nom_terrain || `Terrain #${terrain.id_terrain}`,
        surface_proposee: terrain.surface_proposee,
        surface_validee: terrain.surface_validee,
        acces_eau: terrain.acces_eau,
        acces_route: terrain.acces_route,
        id_tantsaha: terrain.id_tantsaha,
        id_technicien: terrain.id_technicien,
        id_superviseur: terrain.id_superviseur,
        id_region: terrain.id_region,
        id_district: terrain.id_district,
        id_commune: terrain.id_commune,
        statut: terrain.statut,
        geom: terrain.geom,
        region_name: terrain.region?.nom_region || 'Non spécifié',
        district_name: terrain.district?.nom_district || 'Non spécifié',
        commune_name: terrain.commune?.nom_commune || 'Non spécifié',
        techniqueNom: terrain.technicien ? `${terrain.technicien.nom} ${terrain.technicien.prenoms || ''}`.trim() : 'Non assigné'
      }));
      
      setPendingTerrains(terrainData.filter(t => t.statut === false));
      setValidatedTerrains(terrainData.filter(t => t.statut === true));
    } catch (error) {
      console.error('Error fetching terrains:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les terrains",
        variant: "destructive"
      });
    }
  }, [user, userRole, toast]);

  const fetchTechniciens = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 3);
        
      if (error) throw error;
      setTechniciens(data || []);
    } catch (error) {
      console.error('Error fetching techniciens:', error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase.from('projet').select(`
        *,
        terrain(*),
        utilisateur:id_tantsaha(*),
        technicien:id_technicien(*),
        superviseur:id_superviseur(*),
        projet_culture(*, culture(*))
      `);
      
      if (userRole === 'agriculteur') {
        query = query.eq('id_tantsaha', user.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user.id);
      } else if (userRole === 'superviseur') {
        query = query.eq('id_superviseur', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les projets",
        variant: "destructive"
      });
    }
  }, [user, userRole, toast]);

  useEffect(() => {
    if (user) {
      fetchTerrains();
      fetchProjects();
      fetchTechniciens();
      fetchAgriculteurs();
    }
  }, [user, fetchTerrains, fetchProjects, fetchTechniciens, fetchAgriculteurs]);

  const handleCreateTerrain = () => {
    setSelectedTerrain(null);
    setIsTerrainDialogOpen(true);
  };

  const handleEditTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainDialogOpen(true);
  };

  const handleContactTechnicien = (terrain: TerrainData) => {
    if (terrain.id_technicien) {
      const technicien = techniciens.find(t => t.id_utilisateur === terrain.id_technicien);
      if (technicien) {
        setSelectedTechnicien({
          id: technicien.id_utilisateur,
          name: `${technicien.nom} ${technicien.prenoms || ''}`.trim()
        });
        setIsMessageDialogOpen(true);
      }
    }
  };

  const handleTerrainSaved = () => {
    fetchTerrains();
    setIsTerrainDialogOpen(false);
  };

  const handleCreateProject = () => {
    const validTerrains = validatedTerrains.filter(terrain => 
      terrain.id_tantsaha === user?.id && 
      !projects.some((project: any) => 
        project.id_terrain === terrain.id_terrain && 
        project.statut !== 'terminé'
      )
    );
    
    if (validTerrains.length === 0) {
      setIsAlertDialogOpen(true);
      return;
    }
    
    setSelectedProject(null);
    setIsProjectDialogOpen(true);
  };
  
  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };
  
  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsProjectDetailsOpen(true);
  };

  const handleProjectSaved = () => {
    fetchProjects();
    setIsProjectDialogOpen(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }
  
  const pendingProjects = projects.filter((p) => p.statut === 'en attente');
  const fundingProjects = projects.filter((p) => p.statut === 'validé' || p.statut === 'en_financement');
  const activeProjects = projects.filter((p) => p.statut === 'en cours' || p.statut === 'en_production');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Gestion terrains & projets</h1>
      
      <Tabs defaultValue="terrains">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="terrains">Terrains</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="terrains" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mes terrains</h2>
            <Button onClick={handleCreateTerrain}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau terrain
            </Button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
              <TerrainTable 
                terrains={pendingTerrains}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={fetchTerrains}
                techniciens={techniciens}
                onEdit={handleEditTerrain}
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Terrains validés</h3>
              <TerrainTable 
                terrains={validatedTerrains}
                type="validated"
                userRole={userRole}
                onEdit={handleEditTerrain}
                onContactTechnicien={handleContactTechnicien}
              />
            </div>
          </div>
          
          {isTerrainDialogOpen && (
            <TerrainEditDialog
              isOpen={isTerrainDialogOpen}
              onClose={() => setIsTerrainDialogOpen(false)}
              terrain={selectedTerrain as TerrainData}
              onSubmitSuccess={handleTerrainSaved}
              userId={user.id}
              userRole={userRole}
              agriculteurs={agriculteurs}
            />
          )}
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mes projets</h2>
            {(userRole === 'agriculteur' || userRole === 'investisseur') && (
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Projets en attente de validation</h3>
              {pendingProjects.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Surface (ha)</th>
                        <th className="text-left p-2">Cultures</th>
                        <th className="text-left p-2">Terrain</th>
                        <th className="text-right p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingProjects.map((project) => (
                        <tr key={project.id_projet} className="border-b hover:bg-muted/50">
                          <td className="p-2">{project.id_projet}</td>
                          <td className="p-2">{project.surface_ha}</td>
                          <td className="p-2">
                            {project.projet_culture?.map((pc: any) => pc.culture?.nom_culture).join(', ')}
                          </td>
                          <td className="p-2">
                            {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
                          </td>
                          <td className="p-2 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditProject(project)}
                            >
                              Modifier
                            </Button>
                            {(userRole === 'technicien' || userRole === 'superviseur') && (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="ml-2"
                                onClick={() => handleViewProjectDetails(project)}
                              >
                                Valider
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  Aucun projet en attente
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Projets en cours de financement</h3>
              {fundingProjects.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Surface (ha)</th>
                        <th className="text-left p-2">Cultures</th>
                        <th className="text-left p-2">Terrain</th>
                        <th className="text-right p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundingProjects.map((project) => (
                        <tr key={project.id_projet} className="border-b hover:bg-muted/50">
                          <td className="p-2">{project.id_projet}</td>
                          <td className="p-2">{project.surface_ha}</td>
                          <td className="p-2">
                            {project.projet_culture?.map((pc: any) => pc.culture?.nom_culture).join(', ')}
                          </td>
                          <td className="p-2">
                            {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
                          </td>
                          <td className="p-2 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProjectDetails(project)}
                            >
                              Détails
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  Aucun projet en cours de financement
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Projets en production</h3>
              {activeProjects.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Surface (ha)</th>
                        <th className="text-left p-2">Cultures</th>
                        <th className="text-left p-2">Date début</th>
                        <th className="text-right p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProjects.map((project) => (
                        <tr key={project.id_projet} className="border-b hover:bg-muted/50">
                          <td className="p-2">{project.id_projet}</td>
                          <td className="p-2">{project.surface_ha}</td>
                          <td className="p-2">
                            {project.projet_culture?.map((pc: any) => pc.culture?.nom_culture).join(', ')}
                          </td>
                          <td className="p-2">
                            {project.date_lancement ? new Date(project.date_lancement).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-2 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProjectDetails(project)}
                            >
                              Détails
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  Aucun projet en production
                </div>
              )}
            </div>
          </div>
          
          {isProjectDialogOpen && (
            <ProjectEditDialog
              isOpen={isProjectDialogOpen}
              onClose={() => setIsProjectDialogOpen(false)}
              onSubmitSuccess={handleProjectSaved}
              project={selectedProject}
              userId={user.id}
              userRole={userRole}
            />
          )}
          
          {isProjectDetailsOpen && selectedProject && (
            <ProjectDetailsDialog
              isOpen={isProjectDetailsOpen}
              onClose={() => setIsProjectDetailsOpen(false)}
              projectId={selectedProject.id_projet}
              userRole={userRole}
            />
          )}
          
          {isMessageDialogOpen && selectedTechnicien && (
            <MessageDialog
              isOpen={isMessageDialogOpen}
              onClose={() => setIsMessageDialogOpen(false)}
              recipient={selectedTechnicien}
              subject="Question sur un terrain"
            />
          )}
          
          <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Aucun terrain disponible</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous devez d'abord ajouter un terrain et attendre sa validation avant de pouvoir créer un projet agricole.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => {
                  setIsAlertDialogOpen(false);
                  handleCreateTerrain();
                }}>Ajouter un terrain</AlertDialogAction>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};
