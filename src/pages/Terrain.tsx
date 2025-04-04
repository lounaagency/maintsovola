
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerrainTable from '@/components/TerrainTable';
import { TerrainData } from '@/types/terrain';
import TerrainEditDialog from '@/components/TerrainEditDialog';
import MessageDialog from '@/components/MessageDialog';

const Terrain = () => {
  const { user, profile } = useAuth();
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [techniciens, setTechniciens] = useState<{ id_utilisateur: string; nom: string; prenoms?: string; photo_profil?: string; }[]>([]);
  const [agriculteurs, setAgriculteurs] = useState<{ id_utilisateur: string; nom: string; prenoms?: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTerrains();
    fetchUsersByRole();
  }, []);

  const fetchTerrains = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom),
          district:id_district(nom),
          commune:id_commune(nom),
          tantsaha:id_tantsaha(nom, prenoms, photo_profil),
          technicien:id_technicien(nom, prenoms, photo_profil)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedTerrains = data.map(terrain => ({
        id_terrain: terrain.id_terrain,
        id_tantsaha: terrain.id_tantsaha,
        tantsahaNom: terrain.tantsaha ? `${terrain.tantsaha.nom} ${terrain.tantsaha.prenoms || ''}` : 'Inconnu',
        tantsahaPhoto: terrain.tantsaha?.photo_profil,
        id_technicien: terrain.id_technicien,
        techniqueNom: terrain.technicien ? `${terrain.technicien.nom} ${terrain.technicien.prenoms || ''}` : null,
        techniquePhoto: terrain.technicien?.photo_profil,
        nom_terrain: terrain.nom_terrain,
        id_region: terrain.id_region,
        region_name: terrain.region?.nom,
        id_district: terrain.id_district,
        district_name: terrain.district?.nom,
        id_commune: terrain.id_commune,
        commune_name: terrain.commune?.nom,
        surface_proposee: terrain.surface_proposee,
        surface_validee: terrain.surface_validee,
        acces_eau: terrain.acces_eau,
        acces_route: terrain.acces_route,
        statut: terrain.statut,
        photos: terrain.photos,
        photos_validation: terrain.photos_validation,
        rapport_validation: terrain.rapport_validation,
        date_validation: terrain.date_validation,
        created_at: terrain.created_at
      }));

      setTerrains(formattedTerrains);
    } catch (error) {
      console.error('Error fetching terrains:', error);
      toast.error('Erreur lors de la récupération des terrains');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByRole = async () => {
    try {
      // Fetch techniciens (role_id = 4)
      const { data: techData, error: techError } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .eq('id_role', 4);
        
      if (techError) throw techError;
      setTechniciens(techData || []);
      
      // Fetch agriculteurs (role_id = 1, 2)
      const { data: agriData, error: agriError } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .in('id_role', [1, 2]);
        
      if (agriError) throw agriError;
      setAgriculteurs(agriData || []);
    } catch (error) {
      console.error('Error fetching users by role:', error);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateDialogOpen(false);
  };

  const handleOpenEdit = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    setSelectedTerrain(null);
  };

  const handleOpenMessage = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsMessageDialogOpen(true);
  };

  const handleCloseMessage = () => {
    setIsMessageDialogOpen(false);
    setSelectedTerrain(null);
  };

  const handleTerrainCreated = () => {
    fetchTerrains();
    handleCloseCreate();
    toast.success('Terrain créé avec succès');
  };

  const handleTerrainUpdated = () => {
    fetchTerrains();
    handleCloseEdit();
    toast.success('Terrain mis à jour avec succès');
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Terrains</h1>
        {['superviseur', 'agriculteur', 'simple'].includes(profile?.nom_role || '') && (
          <Button onClick={handleOpenCreate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un terrain
          </Button>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="validated">Validés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <TerrainTable 
            terrains={terrains} 
            type="pending" 
            userRole={profile?.nom_role}
            onTerrainUpdate={fetchTerrains}
            techniciens={techniciens}
            onEdit={handleOpenEdit}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="validated">
          <TerrainTable 
            terrains={terrains} 
            type="validated" 
            userRole={profile?.nom_role}
            onTerrainUpdate={fetchTerrains}
            techniciens={techniciens}
            onEdit={handleOpenEdit}
            onContactTechnicien={handleOpenMessage}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {isCreateDialogOpen && (
        <TerrainEditDialog
          onCancel={handleCloseCreate}
          onSubmitSuccess={handleTerrainCreated}
          userId={user?.id || ''}
          userRole={profile?.nom_role || ''}
          agriculteurs={agriculteurs}
          techniciens={techniciens}
        />
      )}

      {isEditDialogOpen && selectedTerrain && (
        <TerrainEditDialog
          initialData={selectedTerrain}
          onCancel={handleCloseEdit}
          onSubmitSuccess={handleTerrainUpdated}
          userId={user?.id || ''}
          userRole={profile?.nom_role || ''}
          agriculteurs={agriculteurs}
          techniciens={techniciens}
          isValidationMode={profile?.nom_role === 'technicien' || profile?.nom_role === 'superviseur'}
        />
      )}

      {isMessageDialogOpen && selectedTerrain && (
        <MessageDialog
          recipient={selectedTerrain.id_technicien || ''}
          recipientName={selectedTerrain.techniqueNom || 'Technicien'}
          onClose={handleCloseMessage}
          contextType="terrain"
          contextId={selectedTerrain.id_terrain}
        />
      )}
    </div>
  );
};

export default Terrain;
