
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TerrainTable from "@/components/terrain/TerrainTable";
import TerrainDialog from "@/components/TerrainDialog";
import { TerrainData } from "@/types/terrain";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/types/notification";
import { Loader2 } from "lucide-react";

const Terrain: React.FC = () => {
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState<'validated' | 'pending'>('pending');
  const [terrainDialogOpen, setTerrainDialogOpen] = useState(false);
  const [editTerrain, setEditTerrain] = useState<TerrainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerrains();
    fetchTechniciens();
  }, []);

  useEffect(() => {
    setUserRole(profile?.nom_role || null);
  }, [profile]);

  const fetchTerrains = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const userId = user.id;
      const { data: terrainsData, error: terrainsError } = await supabase
        .from('terrain')
        .select(`
          id_terrain,
          nom_terrain,
          surface_proposee,
          surface_validee,
          statut,
          acces_eau,
          acces_route,
          id_tantsaha,
          id_technicien,
          id_region,
          id_district,
          id_commune,
          region (nom_region),
          district (nom_district),
          commune (nom_commune),
          technicien: utilisateur!id_technicien (nom, prenoms)
        `);

      if (terrainsError) throw terrainsError;

      const transformedTerrains: TerrainData[] = terrainsData.map(terrain => ({
        id_terrain: terrain.id_terrain,
        nom_terrain: terrain.nom_terrain,
        surface_proposee: terrain.surface_proposee,
        surface_validee: terrain.surface_validee,
        statut: terrain.statut,
        acces_eau: terrain.acces_eau,
        acces_route: terrain.acces_route,
        id_tantsaha: terrain.id_tantsaha,
        id_technicien: terrain.id_technicien,
        id_region: terrain.id_region,
        id_district: terrain.id_district,
        id_commune: terrain.id_commune,
        region_name: terrain.region?.nom_region || 'N/A',
        district_name: terrain.district?.nom_district || 'N/A',
        commune_name: terrain.commune?.nom_commune || 'N/A',
        techniqueNom: terrain.technicien ? `${terrain.technicien.nom} ${terrain.technicien.prenoms || ''}` : null,
      }));

      // Separate terrains based on their status
      setValidatedTerrains(transformedTerrains.filter(terrain => terrain.statut === true));
      setPendingTerrains(transformedTerrains.filter(terrain => terrain.statut === false));
    } catch (error) {
      console.error("Erreur lors de la récupération des terrains:", error);
      toast.error("Erreur lors du chargement des terrains");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechniciens = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 4); // Assuming role ID 4 is for techniciens

      if (error) throw error;
      setTechniciens(data);
    } catch (error) {
      console.error("Error fetching techniciens:", error);
      toast.error("Erreur lors du chargement des techniciens");
    }
  };

  const handleEditTerrain = (terrain: TerrainData) => {
    setEditTerrain(terrain);
    setTerrainDialogOpen(true);
  };

  const handleContactTechnicien = (terrain: TerrainData) => {
    if (!terrain.id_technicien) {
      toast.error("Aucun technicien n'est assigné à ce terrain.");
      return;
    }

    // Open a direct message channel with the technician
    window.open(`/messages/new?to=${terrain.id_technicien}`, '_blank');
  };

  const handleValidateTerrain = async (terrain: TerrainData) => {
    try {
      setLoading(true);
      // Check if user is either technicien or superviseur
      if (!['technicien', 'superviseur'].includes(userRole || '')) {
        toast.error("Vous n'avez pas les permissions nécessaires pour valider ce terrain");
        return;
      }

      // If user is technicien, check if they are assigned to this terrain
      if (userRole === 'technicien' && terrain?.id_technicien !== user?.id) {
        toast.error("Vous pouvez uniquement valider les terrains qui vous sont assignés");
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .update({ 
          statut: true,
          surface_validee: terrain?.surface_proposee
        })
        .eq('id_terrain', terrain.id_terrain);

      if (error) throw error;
      
      // Notify the land owner
      if (terrain && terrain.id_tantsaha && user) {
        await sendNotification(
          supabase,
          user.id,
          [{ id_utilisateur: terrain.id_tantsaha }],
          "Terrain validé",
          `Votre terrain ${terrain.nom_terrain || `#${terrain.id_terrain}`} a été validé`,
          "info",
          "terrain",
          terrain.id_terrain
        );
      }
      
      toast.success("Le terrain a été validé avec succès");
      
      fetchTerrains();
    } catch (error) {
      console.error('Erreur lors de la validation du terrain:', error);
      toast.error("Impossible de valider le terrain");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerrain = async (terrain: TerrainData) => {
    try {
      setLoading(true);
      if (!user) return;
      
      // Check if user has permission to delete
      if (userRole === 'simple' && terrain?.id_tantsaha !== user.id) {
        toast.error("Vous pouvez uniquement supprimer vos propres terrains");
        return;
      }

      // Only simple users and superviseurs can delete terrains
      if (userRole !== 'simple' && userRole !== 'superviseur') {
        toast.error("Vous n'avez pas les permissions nécessaires");
        return;
      }

      // Check if this terrain has existing projects
      const { data: projects, error: projectsError } = await supabase
        .from('projet')
        .select('id_projet')
        .eq('id_terrain', terrain.id_terrain);
        
      if (projectsError) throw projectsError;
      
      if (projects && projects.length > 0) {
        toast.error("Impossible de supprimer ce terrain car il est associé à des projets");
        return;
      }

      const { error } = await supabase
        .from('terrain')
        .delete()
        .eq('id_terrain', terrain.id_terrain);

      if (error) throw error;
      
      toast.success("Le terrain a été supprimé avec succès");
      
      fetchTerrains();
    } catch (error) {
      console.error('Erreur lors de la suppression du terrain:', error);
      toast.error("Impossible de supprimer le terrain");
    } finally {
      setLoading(false);
    }
  };

  const handleTerrainUpdate = () => {
    fetchTerrains();
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 mt-14">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Gestion des terrains</h1>
        <p className="text-gray-600">Consultez et gérez vos terrains agricoles</p>
      </header>

      <div className="flex justify-between items-center mb-4">
        <Tabs value={showPanel} onValueChange={(value) => setShowPanel(value as 'validated' | 'pending')}>
          <TabsList>
            <TabsTrigger value="pending">
              En attente
            </TabsTrigger>
            <TabsTrigger value="validated">
              Validés
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setTerrainDialogOpen(true)}>
          Ajouter un terrain
        </Button>
      </div>

      <div className="mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-maintso mb-4" />
            <p className="text-gray-600 text-center">Chargement des terrains en cours...</p>
          </div>
        ) : showPanel === 'pending' ? (
          <TerrainTable 
            terrains={pendingTerrains} 
            type="pending" 
            userRole={userRole}
            onTerrainUpdate={fetchTerrains}
            techniciens={techniciens}
            onEdit={handleEditTerrain}
            onValidate={handleValidateTerrain}
            onContactTechnicien={handleContactTechnicien}
            onViewDetails={(terrain) => console.log('Viewing details for:', terrain)}
            onDelete={handleDeleteTerrain}
            loading={loading}
          />
        ) : (
          <TerrainTable 
            terrains={validatedTerrains} 
            type="validated" 
            userRole={userRole}
            onTerrainUpdate={fetchTerrains}
            onEdit={handleEditTerrain}
            onValidate={handleValidateTerrain}
            onContactTechnicien={handleContactTechnicien}
            onViewDetails={(terrain) => console.log('Viewing details for:', terrain)}
            onDelete={handleDeleteTerrain}
            loading={loading}
          />
        )}
      </div>

      <TerrainDialog
        open={terrainDialogOpen}
        setOpen={setTerrainDialogOpen}
        onTerrainUpdate={handleTerrainUpdate}
        terrain={editTerrain}
      />
    </div>
  );
};

export default Terrain;
