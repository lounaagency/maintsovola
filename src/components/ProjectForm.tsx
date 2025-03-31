
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TerrainData } from "@/types/terrain";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";

interface ProjectFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  userId: string;
  userRole?: string;
  isEditing?: boolean;
  initialData?: any;
}

interface Culture {
  id_culture: number;
  nom_culture: string;
  rendement_ha: number;
  cout_exploitation_ha: number;
  prix_tonne: number;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  onSubmitSuccess,
  onCancel,
  userId,
  userRole,
  isEditing = false,
  initialData
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<number[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [surface, setSurface] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalYield, setTotalYield] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchTerrains();
    fetchCultures();
    
    if (isEditing && initialData) {
      setSelectedTerrain(initialData.id_terrain);
      setDescription(initialData.description || "");
      setSurface(initialData.surface_ha || 0);
      
      // Load selected cultures if editing
      if (initialData.cultures) {
        setSelectedCultures(initialData.cultures.map((c: any) => c.id_culture));
      }
    }
  }, [initialData, isEditing]);
  
  useEffect(() => {
    if (selectedTerrain) {
      // Find the terrain and set its surface
      const terrain = terrains.find(t => t.id_terrain === selectedTerrain);
      if (terrain) {
        setSurface(terrain.surface_validee || terrain.surface_proposee);
      }
    }
  }, [selectedTerrain, terrains]);
  
  useEffect(() => {
    calculateProjectMetrics();
  }, [selectedCultures, surface, cultures]);

  const fetchTerrains = async () => {
    try {
      // Get only validated terrains that are not already used in active projects
      let query = supabase
        .from('terrain')
        .select(`
          id_terrain,
          nom_terrain,
          surface_validee,
          surface_proposee,
          id_tantsaha,
          id_region,
          id_district,
          id_commune
        `)
        .eq('statut', true);
      
      if (userRole === 'agriculteur') {
        query = query.eq('id_tantsaha', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter out terrains used in active projects
      const { data: activeProjects, error: projectError } = await supabase
        .from('projet')
        .select('id_terrain')
        .not('statut', 'eq', 'terminé');
      
      if (projectError) throw projectError;
      
      const usedTerrainIds = activeProjects?.map(p => p.id_terrain) || [];
      const availableTerrains = data?.filter(t => !usedTerrainIds.includes(t.id_terrain) || 
                                       (isEditing && initialData && t.id_terrain === initialData.id_terrain));
      
      setTerrains(availableTerrains || []);
    } catch (error) {
      console.error('Error fetching terrains:', error);
    }
  };

  const fetchCultures = async () => {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('id_culture, nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne');
      
      if (error) throw error;
      
      setCultures(data || []);
    } catch (error) {
      console.error('Error fetching cultures:', error);
    }
  };
  
  const calculateProjectMetrics = () => {
    if (selectedCultures.length === 0) {
      setTotalCost(0);
      setTotalYield(0);
      setTotalRevenue(0);
      return;
    }
    
    // Get selected culture objects
    const selectedCultureObjects = cultures.filter(c => 
      selectedCultures.includes(c.id_culture)
    );
    
    // Calculate averages for multiple cultures
    const avgCostPerHa = selectedCultureObjects.reduce(
      (sum, culture) => sum + (culture.cout_exploitation_ha || 0), 0
    ) / selectedCultureObjects.length;
    
    const avgYieldPerHa = selectedCultureObjects.reduce(
      (sum, culture) => sum + (culture.rendement_ha || 0), 0
    ) / selectedCultureObjects.length;
    
    const avgPricePerTonne = selectedCultureObjects.reduce(
      (sum, culture) => sum + (culture.prix_tonne || 0), 0
    ) / selectedCultureObjects.length;
    
    // Calculate totals based on surface
    const calculatedTotalCost = avgCostPerHa * surface;
    const calculatedTotalYield = avgYieldPerHa * surface;
    const calculatedTotalRevenue = calculatedTotalYield * avgPricePerTonne;
    
    setTotalCost(parseFloat(calculatedTotalCost.toFixed(2)));
    setTotalYield(parseFloat(calculatedTotalYield.toFixed(2)));
    setTotalRevenue(parseFloat(calculatedTotalRevenue.toFixed(2)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTerrain) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un terrain",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedCultures.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une culture",
        variant: "destructive"
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir une description du projet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const terrain = terrains.find(t => t.id_terrain === selectedTerrain);
      if (!terrain) throw new Error("Terrain non trouvé");
      
      // Create or update the project
      let projectId;
      
      if (isEditing && initialData) {
        // Update existing project
        const { error } = await supabase
          .from('projet')
          .update({
            id_terrain: selectedTerrain,
            surface_ha: surface,
            description: description,
            // Status remains the same
          })
          .eq('id_projet', initialData.id_projet);
        
        if (error) throw error;
        projectId = initialData.id_projet;
        
        // Delete existing project cultures
        const { error: deleteError } = await supabase
          .from('projet_culture')
          .delete()
          .eq('id_projet', projectId);
          
        if (deleteError) throw deleteError;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projet')
          .insert({
            id_terrain: selectedTerrain,
            id_tantsaha: userId,
            surface_ha: surface,
            statut: 'en attente',
            id_region: terrain.id_region,
            id_district: terrain.id_district,
            id_commune: terrain.id_commune,
            description: description,
            id_technicien: terrain.id_technicien
          })
          .select('id_projet')
          .single();
        
        if (error) throw error;
        projectId = data.id_projet;
      }
      
      // Add cultures to project
      for (const cultureId of selectedCultures) {
        const culture = cultures.find(c => c.id_culture === cultureId);
        if (!culture) continue;
        
        const { error } = await supabase
          .from('projet_culture')
          .insert({
            id_projet: projectId,
            id_culture: cultureId,
            cout_exploitation_previsionnel: culture.cout_exploitation_ha * surface,
            rendement_previsionnel: culture.rendement_ha * surface,
            date_debut_previsionnelle: new Date().toISOString().split('T')[0]
          });
          
        if (error) throw error;
      }
      
      toast({
        title: "Succès",
        description: isEditing 
          ? "Projet mis à jour avec succès" 
          : "Projet créé avec succès. Il est en attente de validation.",
      });
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: "Erreur",
        description: isEditing 
          ? "Impossible de mettre à jour le projet" 
          : "Impossible de créer le projet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCultureChange = (cultureId: number, checked: boolean) => {
    if (checked) {
      setSelectedCultures(prev => [...prev, cultureId]);
    } else {
      setSelectedCultures(prev => prev.filter(id => id !== cultureId));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Modifier le projet" : "Nouveau projet agricole"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terrain">Terrain</Label>
            <Select 
              value={selectedTerrain?.toString() || ""} 
              onValueChange={(value) => setSelectedTerrain(parseInt(value))}
              disabled={terrains.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un terrain" />
              </SelectTrigger>
              <SelectContent>
                {terrains.map(terrain => (
                  <SelectItem 
                    key={terrain.id_terrain} 
                    value={terrain.id_terrain?.toString() || ""}
                  >
                    {terrain.nom_terrain} ({terrain.surface_validee || terrain.surface_proposee} ha)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {terrains.length === 0 && (
              <p className="text-sm text-red-500">
                Vous n'avez pas de terrains validés disponibles. Veuillez d'abord créer et faire valider un terrain.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Cultures (sélectionnez une ou plusieurs)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
              {cultures.map(culture => (
                <div key={culture.id_culture} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`culture-${culture.id_culture}`} 
                    checked={selectedCultures.includes(culture.id_culture)}
                    onCheckedChange={(checked) => handleCultureChange(culture.id_culture, checked === true)}
                  />
                  <Label htmlFor={`culture-${culture.id_culture}`} className="cursor-pointer">
                    {culture.nom_culture}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description du projet</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre projet agricole..."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surface">Surface (hectares)</Label>
              <Input 
                id="surface"
                type="number" 
                step="0.01"
                min="0.01"
                value={surface || ''} 
                readOnly
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">La surface est définie par le terrain sélectionné</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Coût d'exploitation estimé</Label>
              <p className="font-semibold">{formatCurrency(totalCost)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Rendement total estimé</Label>
              <p className="font-semibold">{totalYield.toLocaleString()} tonnes</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Chiffre d'affaires potentiel</Label>
              <p className="font-semibold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || terrains.length === 0 || selectedCultures.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Mise à jour..." : "Création..."}
              </>
            ) : (isEditing ? "Mettre à jour le projet" : "Créer le projet")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProjectForm;
