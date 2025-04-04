
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Trash } from "lucide-react";
import TerrainTable from "@/components/TerrainTable";
import TerrainEditDialog from "@/components/TerrainEditDialog";
import { useAuth } from "@/contexts/AuthContext";
import { TerrainData } from "@/types/terrain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigate } from "react-router-dom";

export default function Terrain() {
  const { user, profile } = useAuth();
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [agriculteurs, setAgriculteurs] = useState<{ id_utilisateur: string; nom: string; prenoms?: string; photo_profil?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    // Fetch data on component mount
    fetchTerrains();
    fetchAgriculteurs();
  }, [user]);

  const fetchTerrains = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          tantsaha:id_tantsaha(nom, prenoms, photo_profil),
          technicien:id_technicien(nom, prenoms, photo_profil),
          superviseur:id_superviseur(nom, prenoms, photo_profil)
        `)
        .order('id_terrain', { ascending: false });

      if (error) {
        console.error("Error fetching terrains:", error);
        return;
      }

      // Process terrain data
      const terrains: TerrainData[] = data.map(terrain => ({
        ...terrain,
        id_terrain: terrain.id_terrain,
        region_name: terrain.region?.nom_region,
        district_name: terrain.district?.nom_district,
        commune_name: terrain.commune?.nom_commune,
        tantsahaNom: terrain.tantsaha ? `${terrain.tantsaha.nom} ${terrain.tantsaha.prenoms || ''}` : null,
        tantsahaPhotoProfile: terrain.tantsaha?.photo_profil,
        techniqueNom: terrain.technicien ? `${terrain.technicien.nom} ${terrain.technicien.prenoms || ''}` : null,
        techniquePhotoProfile: terrain.technicien?.photo_profil,
        superviseurNom: terrain.superviseur ? `${terrain.superviseur.nom} ${terrain.superviseur.prenoms || ''}` : null,
        superviseurPhotoProfile: terrain.superviseur?.photo_profil,
      }));

      // Split terrains based on validation status
      setPendingTerrains(terrains.filter(terrain => !terrain.statut));
      setValidatedTerrains(terrains.filter(terrain => terrain.statut));
    } catch (error) {
      console.error("Error fetching terrains:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgriculteurs = async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .eq('id_role', 2); // 2 = agriculteur
        
      if (error) {
        console.error("Error fetching agriculteurs:", error);
        return;
      }
      
      setAgriculteurs(data || []);
    } catch (error) {
      console.error("Error in fetchAgriculteurs:", error);
    }
  };

  const handleAddTerrain = () => {
    setSelectedTerrain(undefined);
    setIsValidationMode(false);
    setIsDialogOpen(true);
  };

  const handleEditTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsValidationMode(false);
    setIsDialogOpen(true);
  };

  const handleValidateTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsValidationMode(true);
    setIsDialogOpen(true);
  };

  const handleContactTechnicien = (terrain: TerrainData) => {
    // Cette fonction sera implémentée pour envoyer un message au technicien
    console.log("Contact technicien for terrain:", terrain);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTerrain(undefined);
    setIsValidationMode(false);
  };

  const handleSubmitSuccess = () => {
    fetchTerrains();
    setIsDialogOpen(false);
    setSelectedTerrain(undefined);
    setIsValidationMode(false);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des terrains</h1>
          <p className="text-muted-foreground">Gérez vos terrains agricoles et suivez leur statut</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button onClick={handleAddTerrain}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un terrain
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">En attente de validation</TabsTrigger>
          <TabsTrigger value="validated">Terrains validés</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <TerrainTable 
            terrains={pendingTerrains}
            type="pending"
            userRole={profile?.nom_role?.toLowerCase()}
            onTerrainUpdate={fetchTerrains}
            onEdit={handleEditTerrain}
            onContactTechnicien={handleContactTechnicien}
            techniciens={agriculteurs}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="validated">
          <TerrainTable 
            terrains={validatedTerrains}
            type="validated"
            userRole={profile?.nom_role?.toLowerCase()}
            onTerrainUpdate={fetchTerrains}
            onEdit={handleEditTerrain}
            onContactTechnicien={handleContactTechnicien}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {isDialogOpen && (
        <TerrainEditDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          terrain={selectedTerrain}
          onSubmitSuccess={handleSubmitSuccess}
          userId={user?.id || ''}
          userRole={profile?.nom_role?.toLowerCase()}
          agriculteurs={agriculteurs}
          isValidationMode={isValidationMode}
        />
      )}
    </div>
  );
}
