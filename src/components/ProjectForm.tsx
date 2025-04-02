
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { TerrainData } from '@/types/terrain';
import { CultureData } from '@/types/culture';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

const FormSchema = z.object({
  title: z.string().min(5, { message: "Le titre doit contenir au moins 5 caractères" }),
  description: z.string().min(20, { message: "La description doit contenir au moins 20 caractères" }),
  terrain: z.string().min(1, { message: "Vous devez sélectionner un terrain" }),
  surface_ha: z.number().min(0.1, { message: "La surface doit être positive" }),
  cultures: z.array(z.string()).min(1, { message: "Sélectionnez au moins une culture" }),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cout_total: z.number().optional(),
  financement_actuel: z.number().optional(),
});

export type ProjectFormValues = z.infer<typeof FormSchema>;

export interface ProjectFormProps {
  initialData?: any;
  onCancel: () => void;
  onSubmitSuccess: () => void;
  isEditing: boolean;
  userId: string;
  userRole: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onCancel,
  onSubmitSuccess,
  isEditing,
  userId,
  userRole
}) => {
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      terrain: '',
      surface_ha: 0,
      cultures: [],
      status: 'draft',
    }
  });
  
  // Load terrain data for the form
  useEffect(() => {
    async function fetchTerrains() {
      try {
        let query = supabase.from('terrain').select('*');
        
        if (userRole === 'agriculteur') {
          query = query.eq('id_tantsaha', userId);
        }
        
        // Only validated terrains
        query = query.eq('statut', true);
        
        const { data, error } = await query;
        if (error) throw error;
        setTerrains(data || []);
      } catch (error) {
        console.error('Error loading terrains:', error);
        toast.error("Erreur lors du chargement des terrains");
      }
    }
    
    async function fetchCultures() {
      try {
        const { data, error } = await supabase.from('culture').select('*');
        if (error) throw error;
        setCultures(data || []);
      } catch (error) {
        console.error('Error loading cultures:', error);
        toast.error("Erreur lors du chargement des cultures");
      }
    }
    
    fetchTerrains();
    fetchCultures();
  }, [userId, userRole]);
  
  // Handle terrain selection and update surface
  useEffect(() => {
    const terrainId = form.watch("terrain");
    if (terrainId) {
      const selectedTerrain = terrains.find(t => t.id_terrain?.toString() === terrainId);
      if (selectedTerrain) {
        form.setValue("surface_ha", selectedTerrain.surface_validee || selectedTerrain.surface_proposee);
      }
    }
  }, [form.watch("terrain"), terrains, form]);
  
  // Handle form submission
  const onSubmit = async (values: ProjectFormValues) => {
    setLoading(true);
    try {
      const terrainId = parseInt(values.terrain);
      const selectedTerrain = terrains.find(t => t.id_terrain === terrainId);
      
      if (!selectedTerrain) {
        throw new Error("Terrain invalide");
      }
      
      // Calculate total cost based on selected cultures and terrain surface
      const surface = selectedTerrain.surface_validee || selectedTerrain.surface_proposee;
      
      const projectData: any = {
        titre: values.title,
        description: values.description,
        id_terrain: terrainId,
        id_tantsaha: userId,
        surface_ha: surface,
        statut: 'draft', // Initial status is draft
        id_region: selectedTerrain.id_region,
        id_district: selectedTerrain.id_district,
        id_commune: selectedTerrain.id_commune,
        photos: selectedTerrain.photos, // Inherit photos from terrain
        created_by: userId
      };
      
      let projectId;
      
      if (isEditing && initialData?.id_projet) {
        // Update existing project
        const { error } = await supabase
          .from('projet')
          .update(projectData)
          .eq('id_projet', initialData.id_projet);
        
        if (error) throw error;
        projectId = initialData.id_projet;
        
        // Delete existing projet_culture records
        await supabase
          .from('projet_culture')
          .delete()
          .eq('id_projet', projectId);
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projet')
          .insert(projectData)
          .select();
        
        if (error) throw error;
        projectId = data[0].id_projet;
      }
      
      // Insert projet_culture records
      const culturePromises = values.cultures.map(cultureId => {
        const culture = cultures.find(c => c.id_culture.toString() === cultureId);
        
        if (!culture) return null;
        
        return supabase.from('projet_culture').insert({
          id_projet: projectId,
          id_culture: parseInt(cultureId),
          rendement_previsionnel: culture.rendement_ha || 0,
          cout_exploitation_previsionnel: culture.cout_exploitation_ha || 0,
          created_by: userId
        });
      });
      
      await Promise.all(culturePromises.filter(Boolean));
      
      toast.success(isEditing ? "Projet mis à jour avec succès" : "Projet créé avec succès");
      onSubmitSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Erreur lors de l'enregistrement du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du projet</FormLabel>
              <FormControl>
                <Input placeholder="Titre du projet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description détaillée du projet" 
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="terrain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terrain</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un terrain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {terrains.map((terrain) => (
                    <SelectItem 
                      key={terrain.id_terrain} 
                      value={terrain.id_terrain?.toString() || ""}
                    >
                      {terrain.nom_terrain || `Terrain #${terrain.id_terrain}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Sélectionnez un de vos terrains validés
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="surface_ha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surface (hectares)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  value={field.value || 0}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                  readOnly
                />
              </FormControl>
              <FormDescription>
                La surface est automatiquement renseignée selon le terrain sélectionné
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cultures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultures</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {cultures.map(culture => (
                  <div key={culture.id_culture} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`culture-${culture.id_culture}`}
                      value={culture.id_culture}
                      checked={field.value?.includes(culture.id_culture.toString())}
                      onChange={(e) => {
                        const value = culture.id_culture.toString();
                        const newValues = e.target.checked
                          ? [...(field.value || []), value]
                          : field.value?.filter(v => v !== value) || [];
                        field.onChange(newValues);
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`culture-${culture.id_culture}`} className="text-sm">
                      {culture.nom_culture}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>
                Sélectionnez une ou plusieurs cultures pour votre projet
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Mettre à jour' : 'Créer le projet'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
