
import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerrainTable from '@/components/terrain/TerrainTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TerrainEditDialog from '@/components/TerrainEditDialog';
import TerrainCard from '@/components/terrain/TerrainCard';
import ProjectEditDialog from '@/components/ProjectEditDialog';
import MessageDialog from '@/components/MessageDialog';
import ProjectDetailsDialog from '@/components/ProjectDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TerrainData } from "@/types/terrain";

export const Terrain = () => {
  const { user, profile } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  const { toast } = useToast();
  
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTechnicien, setSelectedTechnicien] = useState<{id: string; name: string} | null>(null);
  
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [isTerrainCardOpen, setIsTerrainCardOpen] = useState(false);
  const [isTerrainDeleteOpen, setIsTerrainDeleteOpen] = useState(false);
  const [isTerrainValidateOpen, setIsTerrainValidateOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  const [agriculteurs, setAgriculteurs] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);
  const [techniciens, setTechniciens] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);
  
  const userRole = profile?.nom_role?.toLowerCase() || 'simple';

  const fetchAgriculteurs = useCallback(async () => {
    if (userRole !== 'technicien' && userRole !== 'superviseur') return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 1); // 1 = simple user role
        
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
          commune:id_commune(nom_commune)
        `)
        .eq('archive', false);
      
      if (userRole === 'simple') {
        query = query.eq('id_tantsaha', user.id);
      } else if (userRole === 'technicien') {
        query = query.eq('id_technicien', user.id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Get technician, supervisor and owner details for each terrain
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
        archive: terrain.archive,
        geom: terrain.geom,
        photos: terrain.photos || '',
        photos_validation: terrain.photos_validation || '',
        rapport_validation: terrain.rapport_validation || '',
        date_validation: terrain.date_validation,
        region_name: terrain.region?.nom_region || 'Non spécifié',
        district_name: terrain.district?.nom_district || 'Non spécifié',
        commune_name: terrain.commune?.nom_commune || 'Non spécifié',
        techniqueNom: 'Non assigné', // Will be set later
        superviseurNom: 'Non assigné', // Will be set later
        tantsahaNom: 'Non spécifié' // Will be set later
      }));
      
      // Fetch additional details for terrains
      const enhancedTerrainData = await Promise.all(terrainData.map(async (terrain) => {
        // Get technician details
        if (terrain.id_technicien) {
          const { data: techData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', terrain.id_technicien)
            .maybeSingle();
            
          if (techData) {
            terrain.techniqueNom = `${techData.nom} ${techData.prenoms || ''}`.trim();
          }
        }
        
        // Get supervisor details
        if (terrain.id_superviseur) {
          const { data: supervData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', terrain.id_superviseur)
            .maybeSingle();
            
          if (supervData) {
            terrain.superviseurNom = `${supervData.nom} ${supervData.prenoms || ''}`.trim();
          }
        }
        
        // Get owner details
        if (terrain.id_tantsaha) {
          const { data: ownerData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', terrain.id_tantsaha)
            .maybeSingle();
            
          if (ownerData) {
            terrain.tantsahaNom = `${ownerData.nom} ${ownerData.prenoms || ''}`.trim();
          }
        }
        
        return terrain;
      }));
      
      setPendingTerrains(enhancedTerrainData.filter(t => t.statut === false));
      setValidatedTerrains(enhancedTerrainData.filter(t => t.statut === true));
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
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 3); // 3 = technicien role
        
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
        culture:projet_culture(*, culture_details:culture(*))
      `);
      
      if (userRole === 'simple') {
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

  const handleViewTerrainDetails = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainCardOpen(true);
  };

  const handleDeleteTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainDeleteOpen(true);
  };
  
  const handleValidateTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainValidateOpen(true);
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
    setIsTerrainValidateOpen(false);
  };

  const handleTerrainDeleted = () => {
    fetchTerrains();
    setIsTerrainDeleteOpen(false);
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
          
          {userRole === 'superviseur' ? (
            <Tabs defaultValue="assignment" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="assignment">À assigner</TabsTrigger>
                <TabsTrigger value="validation">À valider</TabsTrigger>
                <TabsTrigger value="validated">Validés</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assignment" className="pt-4">
                <TerrainTable 
                  terrains={pendingTerrains.filter(t => !t.id_technicien)}
                  type="pending"
                  userRole={userRole}
                  onTerrainUpdate={fetchTerrains}
                  techniciens={techniciens}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onValidate={handleValidateTerrain}
                  onDelete={handleDeleteTerrain}
                />
              </TabsContent>
              
              <TabsContent value="validation" className="pt-4">
                <TerrainTable 
                  terrains={pendingTerrains.filter(t => t.id_technicien)}
                  type="pending"
                  userRole={userRole}
                  onTerrainUpdate={fetchTerrains}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onValidate={handleValidateTerrain}
                  onDelete={handleDeleteTerrain}
                />
              </TabsContent>
              
              <TabsContent value="validated" className="pt-4">
                <TerrainTable 
                  terrains={validatedTerrains}
                  type="validated"
                  userRole={userRole}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onDelete={handleDeleteTerrain}
                />
              </TabsContent>
            </Tabs>
          ) : userRole === 'technicien' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
                <TerrainTable 
                  terrains={pendingTerrains.filter(t => t.id_technicien === user.id)}
                  type="pending"
                  userRole={userRole}
                  onTerrainUpdate={fetchTerrains}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onValidate={handleValidateTerrain}
                  onDelete={handleDeleteTerrain}
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Terrains validés</h3>
                <TerrainTable 
                  terrains={validatedTerrains.filter(t => t.id_technicien === user.id)}
                  type="validated"
                  userRole={userRole}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onDelete={handleDeleteTerrain}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
                <TerrainTable 
                  terrains={pendingTerrains}
                  type="pending"
                  userRole={userRole}
                  onTerrainUpdate={fetchTerrains}
                  onEdit={handleEditTerrain}
                  onViewDetails={handleViewTerrainDetails}
                  onDelete={handleDeleteTerrain}
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Terrains validés</h3>
                <TerrainTable 
                  terrains={validatedTerrains}
                  type="validated"
                  userRole={userRole}
                  onViewDetails={handleViewTerrainDetails}
                  onContactTechnicien={handleContactTechnicien}
                />
              </div>
            </div>
          )}
          
          {isTerrainDialogOpen && (
            <TerrainEditDialog
              isOpen={isTerrainDialogOpen}
              onClose={() => setIsTerrainDialogOpen(false)}
              terrain={selectedTerrain || undefined}
              onSubmitSuccess={handleTerrainSaved}
              userId={user.id}
              userRole={userRole}
              agriculteurs={agriculteurs}
            />
          )}
          
          {isTerrainValidateOpen && selectedTerrain && (
            <TerrainEditDialog
              isOpen={isTerrainValidateOpen}
              onClose={() => setIsTerrainValidateOpen(false)}
              terrain={selectedTerrain}
              onSubmitSuccess={handleTerrainSaved}
              userId={user.id}
              userRole={userRole}
              isValidationMode={true}
            />
          )}
          
          {isTerrainCardOpen && selectedTerrain && (
            <TerrainCard
              isOpen={isTerrainCardOpen}
              onClose={() => setIsTerrainCardOpen(false)}
              terrain={selectedTerrain}
              onTerrainUpdate={fetchTerrains}
            />
          )}
          
          {isTerrainDeleteOpen && selectedTerrain && (
            <TerrainCard
              isOpen={isTerrainDeleteOpen}
              onClose={() => setIsTerrainDeleteOpen(false)}
              terrain={selectedTerrain}
              onTerrainUpdate={handleTerrainDeleted}
              isDeleteMode={true}
            />
          )}
          
          {isMessageDialogOpen && selectedTechnicien && (
            <MessageDialog
              isOpen={isMessageDialogOpen}
              onClose={() => setIsMessageDialogOpen(false)}
              recipient={{
                id: selectedTechnicien.id,
                name: selectedTechnicien.name
              }}
              subject={`Demande concernant le terrain ${selectedTerrain?.nom_terrain || '#' + selectedTerrain?.id_terrain}`}
              initialMessage={`Bonjour, j'aimerais vous contacter concernant mon terrain ${selectedTerrain?.nom_terrain || '#' + selectedTerrain?.id_terrain}.\n`}
            />
          )}
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mes projets</h2>
            {(userRole === 'simple') && (
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            )}
          </div>
          
          <Tabs defaultValue="waiting">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="waiting">Projets</TabsTrigger>
              <TabsTrigger value="production">Production en cours</TabsTrigger>
            </TabsList>
            
            <TabsContent value="waiting" className="pt-4 space-y-6">
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
                              {project.culture?.map((pc: any) => pc.culture_details?.nom_culture).join(', ')}
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
                          <th className="text-left p-2">Financement</th>
                          <th className="text-right p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundingProjects.map((project) => (
                          <tr key={project.id_projet} className="border-b hover:bg-muted/50">
                            <td className="p-2">{project.id_projet}</td>
                            <td className="p-2">{project.surface_ha}</td>
                            <td className="p-2">
                              {project.culture?.map((pc: any) => pc.culture_details?.nom_culture).join(', ')}
                            </td>
                            <td className="p-2">
                              {project.terrain?.nom_terrain || `Terrain #${project.id_terrain}`}
                            </td>
                            <td className="p-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-green-600 h-2.5 rounded-full" 
                                  style={{ width: `${Math.min(100, ((project.financement_actuel || 0) / (project.cout_total || 1)) * 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs mt-1">
                                {((project.financement_actuel || 0) / (project.cout_total || 1) * 100).toFixed(0)}%
                              </div>
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
            </TabsContent>
            
            <TabsContent value="production" className="pt-4">
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
                              {project.culture?.map((pc: any) => pc.culture_details?.nom_culture).join(', ')}
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
            </TabsContent>
          </Tabs>
          
          {isProjectDialogOpen && (
            <ProjectEditDialog
              isOpen={isProjectDialogOpen}
              onClose={() => setIsProjectDialogOpen(false)}
              project={selectedProject}
              onSubmitSuccess={handleProjectSaved}
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

export default Terrain;
