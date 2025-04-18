import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerrainTable from '@/components/terrain/TerrainTable';
import { Button } from '@/components/ui/button';
import { Plus, Loader } from 'lucide-react';
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
  
  const [loadingTerrains, setLoadingTerrains] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  const userRole = profile?.nom_role?.toLowerCase() || 'simple';

  const fetchAgriculteurs = useCallback(async () => {
    if (userRole !== 'technicien' && userRole !== 'superviseur') return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 1);
        
      if (error) throw error;
      setAgriculteurs(data || []);
    } catch (error) {
      console.error('Error fetching agriculteurs:', error);
    }
  }, [userRole]);

  const fetchTerrains = useCallback(async () => {
    if (!user) return;

    setLoadingTerrains(true);
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
      
      if (!data) {
        setPendingTerrains([]);
        setValidatedTerrains([]);
        setLoadingTerrains(false);
        return;
      }
      
      const terrainData = data.map(terrain => ({
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
        techniqueNom: 'Non assigné',
        superviseurNom: 'Non assigné',
        tantsahaNom: 'Non spécifié'
      }));
      
      const enhancedTerrainData = await Promise.all(terrainData.map(async (terrain) => {
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
      
      const pending = enhancedTerrainData.filter(t => t.statut === false);
      const validated = enhancedTerrainData.filter(t => t.statut === true);
      
      setPendingTerrains(pending);
      setValidatedTerrains(validated);
    } catch (error) {
      console.error('Error fetching terrains:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les terrains",
        variant: "destructive"
      });
    } finally {
      setLoadingTerrains(false);
    }
  }, [user, userRole, toast]);

  const fetchTechniciens = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 4);
        
      if (error) throw error;
      setTechniciens(data || []);
    } catch (error) {
      console.error('Error fetching techniciens:', error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!user) return;

    setLoadingProjects(true);
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
    } finally {
      setLoadingProjects(false);
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

  const handleTerrainUpdate = (updatedTerrain?: TerrainData, action?: 'add' | 'update' | 'delete') => {
    if (!updatedTerrain) return;
    
    console.log("Handling terrain update:", { action, terrain: updatedTerrain });
    
    if (action === 'delete') {
      setPendingTerrains(prev => prev.filter(t => t.id_terrain !== updatedTerrain.id_terrain));
      setValidatedTerrains(prev => prev.filter(t => t.id_terrain !== updatedTerrain.id_terrain));
    } else if (action === 'add') {
      if (updatedTerrain.statut) {
        setValidatedTerrains(prev => [updatedTerrain, ...prev]);
      } else {
        setPendingTerrains(prev => [updatedTerrain, ...prev]);
      }
    } else if (action === 'update') {
      if (updatedTerrain.statut) {
        setPendingTerrains(prev => prev.filter(t => t.id_terrain !== updatedTerrain.id_terrain));
        setValidatedTerrains(prev => {
          const exists = prev.some(t => t.id_terrain === updatedTerrain.id_terrain);
          if (exists) {
            return prev.map(t => t.id_terrain === updatedTerrain.id_terrain ? updatedTerrain : t);
          } else {
            return [updatedTerrain, ...prev];
          }
        });
      } else {
        setValidatedTerrains(prev => prev.filter(t => t.id_terrain !== updatedTerrain.id_terrain));
        setPendingTerrains(prev => {
          const exists = prev.some(t => t.id_terrain === updatedTerrain.id_terrain);
          if (exists) {
            return prev.map(t => t.id_terrain === updatedTerrain.id_terrain ? updatedTerrain : t);
          } else {
            return [updatedTerrain, ...prev];
          }
        });
      }
    }
  };

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

  const handleTerrainSaved = (updatedTerrain: TerrainData) => {
    console.log("Terrain saved:", updatedTerrain);
    
    const isNewTerrain = !pendingTerrains.some(t => t.id_terrain === updatedTerrain.id_terrain) && 
                         !validatedTerrains.some(t => t.id_terrain === updatedTerrain.id_terrain);
                         
    if (isNewTerrain) {
      handleTerrainUpdate(updatedTerrain, 'add');
    } else {
      handleTerrainUpdate(updatedTerrain, 'update');
    }
    
    setIsTerrainDialogOpen(false);
    setIsTerrainValidateOpen(false);
  };

  const handleTerrainDeleted = (deletedTerrain?: TerrainData) => {
    if (deletedTerrain) {
      handleTerrainUpdate(deletedTerrain, 'delete');
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">Gestion des terrains</h1>
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
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={pendingTerrains.filter(t => !t.id_technicien)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                techniciens={techniciens}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onValidate={handleValidateTerrain}
                onDelete={handleDeleteTerrain}
              />
            )}
          </TabsContent>
          
          <TabsContent value="validation" className="pt-4">
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={pendingTerrains.filter(t => t.id_technicien)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onValidate={handleValidateTerrain}
                onDelete={handleDeleteTerrain}
              />
            )}
          </TabsContent>
          
          <TabsContent value="validated" className="pt-4">
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={validatedTerrains}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onDelete={handleDeleteTerrain}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : userRole === 'technicien' ? (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={pendingTerrains.filter(t => t.id_technicien === user.id)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onValidate={handleValidateTerrain}
                onDelete={handleDeleteTerrain}
              />
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Terrains validés</h3>
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={validatedTerrains.filter(t => t.id_technicien === user.id)}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onDelete={handleDeleteTerrain}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={pendingTerrains}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onDelete={handleDeleteTerrain}
              />
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Terrains validés</h3>
            {loadingTerrains ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div>
            ) : (
              <TerrainTable 
                terrains={validatedTerrains}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onViewDetails={handleViewTerrainDetails}
                onContactTechnicien={handleContactTechnicien}
              />
            )}
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
          onTerrainUpdate={handleTerrainUpdate}
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
        />
      )}
    </div>
  );
};

export default Terrain;
