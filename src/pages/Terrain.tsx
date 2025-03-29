import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { container, item } from "@/components/auth/motionConstants";
import { Plus, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { TerrainData, ProjetStatus, RegionData, DistrictData, CommuneData } from "@/types/terrain";
import TerrainTable from "@/components/TerrainTable";

const Terrain: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [techniciens, setTechniciens] = useState<{id: string; nom: string; prenoms?: string}[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictData[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<CommuneData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [terrainProjets, setTerrainProjets] = useState<ProjetStatus[]>([]);
  const [agriculteurs, setAgriculteurs] = useState<{id_utilisateur: string; nom: string; prenoms?: string}[]>([]);
  const [selectedAgriculteur, setSelectedAgriculteur] = useState<string>("");

  const [newTerrain, setNewTerrain] = useState<TerrainData>({
    surface_proposee: 0,
    id_region: null,
    id_district: null,
    id_commune: null,
    acces_eau: false,
    acces_route: false
  });

  if (!user) {
    return <Navigate to="/auth" />;
  }

  useEffect(() => {
    fetchUserRole();
    fetchTerrains();
    fetchRegions();
    fetchDistricts();
    fetchCommunes();
    fetchTechniciens();
    fetchTerrainProjets();
    fetchAgriculteurs();
  }, [user]);

  useEffect(() => {
    if (newTerrain.id_region) {
      setFilteredDistricts(
        districts.filter((district) => district.id_region === newTerrain.id_region)
      );
    } else {
      setFilteredDistricts([]);
    }
  }, [newTerrain.id_region, districts]);

  useEffect(() => {
    if (newTerrain.id_district) {
      setFilteredCommunes(
        communes.filter((commune) => commune.id_district === newTerrain.id_district)
      );
    } else {
      setFilteredCommunes([]);
    }
  }, [newTerrain.id_district, communes]);

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

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('region')
        .select('*')
        .order('nom_region');
      
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from('district')
        .select('*')
        .order('nom_district');
      
      if (error) throw error;
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCommunes = async () => {
    try {
      const { data, error } = await supabase
        .from('commune')
        .select('*')
        .order('nom_commune');
      
      if (error) throw error;
      setCommunes(data || []);
    } catch (error) {
      console.error('Error fetching communes:', error);
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

  const fetchTerrainProjets = async () => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select('id_terrain, statut')
        .eq('archive', false);
      
      if (error) throw error;
      
      const statusData: ProjetStatus[] = data.map(p => ({
        id_terrain: p.id_terrain,
        statut: p.statut,
        has_investisseur: false
      }));
      
      setTerrainProjets(statusData);
    } catch (error) {
      console.error('Error fetching terrain projects:', error);
    }
  };

  const handleSubmitTerrain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un terrain",
        variant: "destructive"
      });
      return;
    }

    if (!newTerrain.id_region || !newTerrain.id_district || !newTerrain.id_commune || newTerrain.surface_proposee <= 0) {
      toast({
        title: "Champs manquants",
        description: "Tous les champs sont obligatoires et la surface doit être supérieure à 0",
        variant: "destructive"
      });
      return;
    }

    if ((userRole === 'superviseur' || userRole === 'technicien') && !selectedAgriculteur) {
      toast({
        title: "Champ manquant",
        description: "Veuillez sélectionner un agriculteur propriétaire du terrain",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('terrain')
        .insert({
          id_tantsaha: userRole === 'agriculteur' ? user.id : selectedAgriculteur,
          id_region: newTerrain.id_region,
          id_district: newTerrain.id_district,
          id_commune: newTerrain.id_commune,
          surface_proposee: newTerrain.surface_proposee,
          surface_validee: 0,
          acces_eau: newTerrain.acces_eau,
          acces_route: newTerrain.acces_route,
          statut: false
        })
        .select();

      if (error) throw error;

      setNewTerrain({
        surface_proposee: 0,
        id_region: null,
        id_district: null,
        id_commune: null,
        acces_eau: false,
        acces_route: false
      });
      setSelectedAgriculteur("");
      
      setIsCreating(false);
      fetchTerrains();
      
      toast({
        title: "Succès",
        description: "Terrain enregistré avec succès",
      });
    } catch (error) {
      console.error('Error submitting terrain:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le terrain",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTerrainsTableTitle = () => {
    switch (userRole) {
      case 'agriculteur':
      case 'investisseur':
        return "Mes terrains validés";
      case 'superviseur':
        return "Terrains validés";
      case 'technicien':
        return "Terrains validés qui me sont assignés";
      default:
        return "Terrains validés";
    }
  };

  const getPendingTerrainsTableTitle = () => {
    switch (userRole) {
      case 'agriculteur':
      case 'investisseur':
        return "Mes terrains en attente de validation";
      case 'superviseur':
        return "Terrains en attente de validation";
      case 'technicien':
        return "Terrains en attente de validation qui me sont assignés";
      default:
        return "Terrains en attente de validation";
    }
  };

  return (
    <div className="container max-w-7xl py-8 px-4 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold">Gestion des Terrains</h1>
        <Button 
          onClick={() => setIsCreating(!isCreating)} 
          variant={isCreating ? "outline" : "default"}
        >
          {isCreating ? "Annuler" : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un terrain
            </>
          )}
        </Button>
      </motion.div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Nouvel enregistrement de terrain</CardTitle>
              <CardDescription>
                Enregistrez un terrain pour pouvoir y créer des projets agricoles.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitTerrain}>
              <CardContent className="space-y-4">
                {(userRole === 'superviseur' || userRole === 'technicien') && (
                  <div className="space-y-2">
                    <Label htmlFor="agriculteur">Agriculteur propriétaire</Label>
                    <Select 
                      value={selectedAgriculteur} 
                      onValueChange={setSelectedAgriculteur}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un agriculteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {agriculteurs.map(agriculteur => (
                          <SelectItem key={agriculteur.id_utilisateur} value={agriculteur.id_utilisateur}>
                            {agriculteur.nom} {agriculteur.prenoms || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select 
                      value={newTerrain.id_region?.toString() || ""} 
                      onValueChange={(value) => {
                        setNewTerrain({
                          ...newTerrain,
                          id_region: parseInt(value),
                          id_district: null,
                          id_commune: null
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region.id_region} value={region.id_region.toString()}>
                            {region.nom_region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select 
                      value={newTerrain.id_district?.toString() || ""} 
                      onValueChange={(value) => {
                        setNewTerrain({
                          ...newTerrain,
                          id_district: parseInt(value),
                          id_commune: null
                        });
                      }}
                      disabled={!newTerrain.id_region}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un district" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDistricts.map(district => (
                          <SelectItem key={district.id_district} value={district.id_district.toString()}>
                            {district.nom_district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune</Label>
                    <Select 
                      value={newTerrain.id_commune?.toString() || ""} 
                      onValueChange={(value) => {
                        setNewTerrain({
                          ...newTerrain,
                          id_commune: parseInt(value)
                        });
                      }}
                      disabled={!newTerrain.id_district}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une commune" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCommunes.map(commune => (
                          <SelectItem key={commune.id_commune} value={commune.id_commune.toString()}>
                            {commune.nom_commune}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surface">Surface proposée (hectares)</Label>
                    <Input 
                      id="surface"
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={newTerrain.surface_proposee || ''} 
                      onChange={(e) => setNewTerrain({
                        ...newTerrain,
                        surface_proposee: parseFloat(e.target.value)
                      })}
                      placeholder="Surface en hectares"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="acces_eau"
                      checked={newTerrain.acces_eau || false}
                      onChange={(e) => setNewTerrain({
                        ...newTerrain,
                        acces_eau: e.target.checked
                      })}
                      className="form-checkbox h-5 w-5 text-primary"
                    />
                    <Label htmlFor="acces_eau">Accès à l'eau</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="acces_route"
                      checked={newTerrain.acces_route || false}
                      onChange={(e) => setNewTerrain({
                        ...newTerrain,
                        acces_route: e.target.checked
                      })}
                      className="form-checkbox h-5 w-5 text-primary"
                    />
                    <Label htmlFor="acces_route">Accès routier</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : "Enregistrer le terrain"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{getPendingTerrainsTableTitle()}</h2>
            <TerrainTable 
              terrains={pendingTerrains} 
              type="pending" 
              userRole={userRole || undefined}
              onTerrainUpdate={fetchTerrains}
              techniciens={techniciens}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">{getTerrainsTableTitle()}</h2>
            <TerrainTable 
              terrains={validatedTerrains} 
              type="validated" 
              userRole={userRole || undefined}
              onTerrainUpdate={fetchTerrains}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Terrain;
