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
  const {
    user,
    profile
  } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const {
    toast
  } = useToast();
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTechnicien, setSelectedTechnicien] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [isTerrainCardOpen, setIsTerrainCardOpen] = useState(false);
  const [isTerrainDeleteOpen, setIsTerrainDeleteOpen] = useState(false);
  const [isTerrainValidateOpen, setIsTerrainValidateOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [agriculteurs, setAgriculteurs] = useState<{
    id_utilisateur: string;
    nom: string;
    prenoms?: string;
  }[]>([]);
  const [techniciens, setTechniciens] = useState<{
    id_utilisateur: string;
    nom: string;
    prenoms?: string;
  }[]>([]);
  const [loadingTerrains, setLoadingTerrains] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const userRole = profile?.nom_role?.toLowerCase() || 'simple';
  const fetchAgriculteurs = useCallback(async () => {
    if (userRole !== 'technicien' && userRole !== 'superviseur') return;
    try {
      const {
        data,
        error
      } = await supabase.from('utilisateurs_par_role').select('id_utilisateur, nom, prenoms').eq('id_role', 1);
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
      /**
       * 1. Prépare le filtre sur le rôle
       *    (on ne modifie QUE la partie `filter`, pas la requête principale)
       */
      const roleFilter: Record<string, unknown> = {};
      if (userRole === 'simple') roleFilter.id_tantsaha = user.id;else if (userRole === 'technicien') roleFilter.id_technicien = user.id;
      /**
       * 2. Requête unique comprenant :
       *    - les tables dépendantes (`region`, `district`, `commune`)
       *    - les trois utilisateurs liés (tech, superviseur, tantsaha)
       */

      const {
        data,
        error
      } = await supabase.from('v_terrain_complet').select('*').match(roleFilter); // même logique de filtre

      if (error) throw error;
      const terrains = (data ?? []).map(t => ({
        id_terrain: t.id_terrain,
        nom_terrain: t.nom_terrain || `Terrain #${t.id_terrain}`,
        surface_proposee: t.surface_proposee,
        surface_validee: t.surface_validee,
        acces_eau: t.acces_eau,
        acces_route: t.acces_route,
        statut: t.statut,
        geom: t.geom,
        photos: t.photos ?? '',
        photos_validation: t.photos_validation ?? '',
        rapport_validation: t.rapport_validation ?? '',
        date_validation: t.date_validation,
        /* libellés déjà disponibles */
        id_region: t.id_region ?? null,
        id_district: t.id_district ?? null,
        id_commune: t.id_commune ?? null,
        region_name: t.nom_region ?? 'Non spécifié',
        district_name: t.nom_district ?? 'Non spécifié',
        commune_name: t.nom_commune ?? 'Non spécifié',
        id_technicien: t.id_technicien ?? null,
        id_superviseur: t.id_superviseur ?? null,
        id_tantsaha: t.id_tantsaha ?? null,
        techniqueNom: t.technicien_nom ? `${t.technicien_nom} ${t.technicien_prenoms ?? ''}`.trim() : 'Non assigné',
        superviseurNom: t.superviseur_nom ? `${t.superviseur_nom} ${t.superviseur_prenoms ?? ''}`.trim() : 'Non assigné',
        tantsahaNom: t.tantsaha_nom ? `${t.tantsaha_nom} ${t.tantsaha_prenoms ?? ''}`.trim() : 'Non spécifié'
      }));
      setPendingTerrains(terrains.filter(t => t.statut === false));
      setValidatedTerrains(terrains.filter(t => t.statut === true));
    } catch (err) {
      console.error('Error fetching terrains:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de récupérer les terrains",
        variant: 'destructive'
      });
    } finally {
      setLoadingTerrains(false);
    }
  }, [user, userRole, toast]);
  const fetchTechniciens = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('utilisateurs_par_role').select('id_utilisateur, nom, prenoms').eq('id_role', 4);
      if (error) throw error;
      setTechniciens(data || []);
    } catch (error) {
      console.error('Error fetching techniciens:', error);
    }
  }, []);
  useEffect(() => {
    if (user) {
      fetchTerrains();
      fetchTechniciens();
      fetchAgriculteurs();
    }
  }, [user, fetchTerrains, fetchTechniciens, fetchAgriculteurs]);
  const handleTerrainUpdate = (updatedTerrain?: TerrainData, action?: 'add' | 'update' | 'delete') => {
    if (!updatedTerrain) return;
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
    setSelectedTerrain(terrain);
    if (terrain.id_technicien) {
      setSelectedTechnicien({
        id: terrain.id_technicien,
        name: `${terrain.techniqueNom ?? ''}`.trim()
      });
      setIsMessageDialogOpen(true);
    }
  };
  const handleTerrainSaved = (updatedTerrain: TerrainData) => {
    console.log("Terrain saved:", updatedTerrain);
    const isNewTerrain = !pendingTerrains.some(t => t.id_terrain === updatedTerrain.id_terrain) && !validatedTerrains.some(t => t.id_terrain === updatedTerrain.id_terrain);
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
  if (!user) {
    return <div>Loading...</div>;
  }
  return <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold mb-6 text-lime-700 text-2xl text-left">Gestion des terrains</h1>
        <Button onClick={handleCreateTerrain}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau terrain
        </Button>
      </div>
      
      {userRole === 'superviseur' ? <Tabs defaultValue="assignment" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="assignment">À assigner</TabsTrigger>
            <TabsTrigger value="validation">À valider</TabsTrigger>
            <TabsTrigger value="validated">Validés</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignment" className="pt-4">
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={pendingTerrains.filter(t => !t.id_technicien)} type="pending" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} techniciens={techniciens} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onValidate={handleValidateTerrain} onDelete={handleDeleteTerrain} />}
          </TabsContent>
          
          <TabsContent value="validation" className="pt-4">
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={pendingTerrains.filter(t => t.id_technicien)} type="pending" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onValidate={handleValidateTerrain} onDelete={handleDeleteTerrain} />}
          </TabsContent>
          
          <TabsContent value="validated" className="pt-4">
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={validatedTerrains} type="validated" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onDelete={handleDeleteTerrain} />}
          </TabsContent>
        </Tabs> : userRole === 'technicien' ? <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Terrains en attente de validation</h3>
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={pendingTerrains.filter(t => t.id_technicien === user.id)} type="pending" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onValidate={handleValidateTerrain} onDelete={handleDeleteTerrain} />}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Terrains validés</h3>
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={validatedTerrains.filter(t => t.id_technicien === user.id)} type="validated" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onDelete={handleDeleteTerrain} />}
          </div>
        </div> : <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2 text-lime-800">Terrains en attente de validation</h3>
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={pendingTerrains} type="pending" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onEdit={handleEditTerrain} onViewDetails={handleViewTerrainDetails} onDelete={handleDeleteTerrain} />}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Terrains validés</h3>
            {loadingTerrains ? <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed">
                <Loader className="h-8 w-8 animate-spin text-maintso mb-2" />
                <p>Chargement des terrains en cours...</p>
              </div> : <TerrainTable terrains={validatedTerrains} type="validated" userRole={userRole} onTerrainUpdate={handleTerrainUpdate} onViewDetails={handleViewTerrainDetails} onContactTechnicien={handleContactTechnicien} />}
          </div>
        </div>}
      
      {isTerrainDialogOpen && <TerrainEditDialog isOpen={isTerrainDialogOpen} onClose={() => setIsTerrainDialogOpen(false)} terrain={selectedTerrain || undefined} onSubmitSuccess={handleTerrainSaved} userId={user.id} userRole={userRole} agriculteurs={agriculteurs} />}
      
      {isTerrainValidateOpen && selectedTerrain && <TerrainEditDialog isOpen={isTerrainValidateOpen} onClose={() => setIsTerrainValidateOpen(false)} terrain={selectedTerrain} onSubmitSuccess={handleTerrainSaved} userId={user.id} userRole={userRole} isValidationMode={true} />}
      
      {isTerrainCardOpen && selectedTerrain && <TerrainCard isOpen={isTerrainCardOpen} onClose={() => setIsTerrainCardOpen(false)} terrain={selectedTerrain} onTerrainUpdate={handleTerrainUpdate} />}
      
      {isTerrainDeleteOpen && selectedTerrain && <TerrainCard isOpen={isTerrainDeleteOpen} onClose={() => setIsTerrainDeleteOpen(false)} terrain={selectedTerrain} onTerrainUpdate={handleTerrainDeleted} isDeleteMode={true} />}
      
      {isMessageDialogOpen && selectedTechnicien && <MessageDialog isOpen={isMessageDialogOpen} onClose={() => setIsMessageDialogOpen(false)} recipient={{
      id: selectedTechnicien.id,
      name: selectedTechnicien.name
    }} subject={`Demande concernant le terrain ${selectedTerrain?.nom_terrain || '#' + selectedTerrain?.id_terrain}`} />}
    </div>;
};
export default Terrain;
