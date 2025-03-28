
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

type TerrainData = {
  id_terrain?: number;
  id_tantsaha?: number;
  id_region?: number | null;
  id_district?: number | null;
  id_commune?: number | null;
  surface_proposee: number;
  acces_eau?: boolean | null;
  acces_route?: boolean | null;
  statut?: boolean;
  region_name?: string;
  district_name?: string;
  commune_name?: string;
  created_at?: string;
};

type Region = {
  id_region: number;
  nom_region: string;
};

type District = {
  id_district: number;
  nom_district: string;
  id_region: number;
};

type Commune = {
  id_commune: number;
  nom_commune: string;
  id_district: number;
};

const Terrain: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<Commune[]>([]);

  const [newTerrain, setNewTerrain] = useState<TerrainData>({
    surface_proposee: 0,
    id_region: null,
    id_district: null,
    id_commune: null,
    acces_eau: false,
    acces_route: false
  });

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" />;
  }

  useEffect(() => {
    fetchTerrains();
    fetchRegions();
    fetchDistricts();
    fetchCommunes();
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

  const fetchTerrains = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune)
        `)
        .eq('id_tantsaha', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include region/district/commune names
      const transformedData = data.map(item => ({
        ...item,
        region_name: item.region?.nom_region,
        district_name: item.district?.nom_district,
        commune_name: item.commune?.nom_commune
      }));

      setTerrains(transformedData);
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

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('terrain')
        .insert({
          id_tantsaha: user.id,
          id_region: newTerrain.id_region,
          id_district: newTerrain.id_district,
          id_commune: newTerrain.id_commune,
          surface_proposee: newTerrain.surface_proposee,
          surface_validee: 0, // Will be updated after validation
          acces_eau: newTerrain.acces_eau,
          acces_route: newTerrain.acces_route,
          statut: false // Not validated by default
        })
        .select();

      if (error) throw error;

      // Reset form
      setNewTerrain({
        surface_proposee: 0,
        id_region: null,
        id_district: null,
        id_commune: null,
        acces_eau: false,
        acces_route: false
      });
      
      setIsCreating(false);
      fetchTerrains(); // Refresh the list
      
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

  return (
    <div className="container max-w-4xl py-8 px-4 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold">Mes Terrains</h1>
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
                Enregistrez votre terrain pour pouvoir y créer des projets agricoles.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitTerrain}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select 
                      value={newTerrain.id_region?.toString() || ""} 
                      onValueChange={(value) => {
                        setNewTerrain({
                          ...newTerrain,
                          id_region: parseInt(value),
                          id_district: null, // Reset district when region changes
                          id_commune: null // Reset commune when region changes
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
                          id_commune: null // Reset commune when district changes
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
      ) : terrains.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-lg mb-4">Vous n'avez pas encore enregistré de terrain</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter votre premier terrain
          </Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {terrains.map((terrain) => (
            <motion.div key={terrain.id_terrain} variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Terrain {terrain.id_terrain}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${terrain.statut ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {terrain.statut ? 'Validé' : 'En attente de validation'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Enregistré le {new Date(terrain.created_at || '').toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Région:</p>
                      <p>{terrain.region_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">District:</p>
                      <p>{terrain.district_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commune:</p>
                      <p>{terrain.commune_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Surface proposée:</p>
                      <p>{terrain.surface_proposee} hectares</p>
                    </div>
                    {terrain.statut && (
                      <div>
                        <p className="text-sm text-muted-foreground">Surface validée:</p>
                        <p>{terrain.surface_validee} hectares</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <div className={`text-xs px-2 py-1 rounded-full ${terrain.acces_eau ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {terrain.acces_eau ? 'Accès à l\'eau' : 'Pas d\'accès à l\'eau'}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${terrain.acces_route ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {terrain.acces_route ? 'Accès routier' : 'Pas d\'accès routier'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Terrain;
