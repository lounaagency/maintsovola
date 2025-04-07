import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TerrainData } from '@/types/terrain';
import { ProjetCulture, Culture } from '@/types/culture';

const formSchema = z.object({
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  terrain: z.string().min(1, {
    message: "Veuillez sélectionner un terrain.",
  }),
  statut: z.string().default("en attente"),
  cultures: z.array(z.string()).min(1, {
    message: "Veuillez sélectionner au moins une culture.",
  }),
  selectedFarmer: z.string().optional(),
})

interface ProjectFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
  initialData?: any;
  isEditing?: boolean;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, disabled, initialData, isEditing, onCancel }) => {
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [financialSummary, setFinancialSummary] = useState({
    totalCost: 0,
    totalRevenue: 0,
    profit: 0
  });
  const [farmers, setFarmers] = useState<{ id_utilisateur: string; nom: string; prenoms?: string }[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
      terrain: initialData?.id_terrain?.toString() || "",
      statut: initialData?.statut || "en attente",
      cultures: initialData?.projet_culture?.map((pc: ProjetCulture) => pc.id_culture.toString()) || [],
      selectedFarmer: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, control, setValue, watch, getValues } = form;
  const watchedCultures = watch("cultures");
  const watchedTerrain = watch("terrain");
  const watchedFarmer = watch("selectedFarmer");

  useEffect(() => {
    setSelectedCultures(watchedCultures || []);
    updateFinancialSummary(watchedCultures, selectedTerrain);
  }, [watchedCultures, selectedTerrain]);

  useEffect(() => {
    if (watchedTerrain) {
      const terrain = terrains.find(t => t.id_terrain?.toString() === watchedTerrain);
      setSelectedTerrain(terrain || null);
    }
  }, [watchedTerrain, terrains]);

  useEffect(() => {
    if (watchedFarmer && profile?.nom_role !== 'simple') {
      setSelectedFarmerId(watchedFarmer);
      setValue("terrain", "");
      fetchTerrains(watchedFarmer);
    }
  }, [watchedFarmer, profile?.nom_role]);

  const updateFinancialSummary = (selectedCultureIds: string[], terrain: TerrainData | null) => {
    if (!selectedCultureIds || !terrain) return;

    const selectedCulturesData = cultures.filter(c => 
      selectedCultureIds.includes(c.id_culture.toString())
    );
    
    const surface = terrain.surface_validee || terrain.surface_proposee || 0;
    
    let totalCost = 0;
    let totalRevenue = 0;
    
    selectedCulturesData.forEach(culture => {
      const cost = (culture.cout_exploitation_ha || 0) * surface;
      const yield_value = (culture.rendement_ha || 0) * surface;
      const revenue = yield_value * (culture.prix_tonne || 0);
      
      totalCost += cost;
      totalRevenue += revenue;
    });
    
    setFinancialSummary({
      totalCost,
      totalRevenue,
      profit: totalRevenue - totalCost
    });
  };

  const onSubmitHandler = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!selectedTerrain) {
        toast.error("Veuillez sélectionner un terrain valide");
        return;
      }

      const uploadedPhotoUrls = await uploadPhotos();
      
      const allPhotoUrls = isEditing
        ? [...(initialData?.photos?.split(",").filter((p: string) => p) || []), ...uploadedPhotoUrls]
        : uploadedPhotoUrls;
      
      const projectData = {
        description: data.description,
        id_terrain: parseInt(data.terrain),
        statut: data.statut,
        surface_ha: selectedTerrain.surface_validee || selectedTerrain.surface_proposee,
        photos: allPhotoUrls.join(","),
        cultures: data.cultures.map(id => parseInt(id)),
        id_region: selectedTerrain.id_region,
        id_district: selectedTerrain.id_district,
        id_commune: selectedTerrain.id_commune,
        financialSummary
      };
      
      onSubmit(projectData);
    } catch (error) {
      console.error("Error processing form submission:", error);
      toast.error("Une erreur s'est produite lors de l'envoi du formulaire.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });

    setPhotoUrls(prevUrls => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `project-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `project-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, photo);
          
        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);
          
        if (publicUrlData) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error in photo upload process:", error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const fetchFarmers = useCallback(async () => {
    if (!user || profile?.nom_role === 'simple') return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 1); // ID role for 'simple' users
        
      if (error) {
        console.error("Error fetching farmers:", error);
        return;
      }
      
      setFarmers(data || []);
    } catch (error) {
      console.error("Error in fetchFarmers:", error);
    }
  }, [user, profile?.nom_role]);

  const fetchTerrains = useCallback(async (farmerId?: string) => {
    if (!user) return;
    
    try {
      const ownerUserId = profile?.nom_role === 'simple' 
        ? user.id 
        : farmerId || (isEditing ? initialData?.id_tantsaha : null);
      
      if (!ownerUserId && profile?.nom_role !== 'simple') {
        setTerrains([]);
        return;
      }

      const { data: activeProjects, error: projectsError } = await supabase
        .from('projet')
        .select('id_terrain')
        .neq('statut', 'terminé');
        
      if (projectsError) {
        console.error("Error fetching active projects:", projectsError);
      }
      
      const excludedTerrainIds = activeProjects
        ? activeProjects
            .filter(p => !isEditing || p.id_terrain !== initialData?.id_terrain)
            .map(p => p.id_terrain)
        : [];
            
      let query = supabase
        .from('terrain')
        .select('*')
        .eq('id_tantsaha', ownerUserId)
        .eq('statut', true)
        .eq('archive', false);
        
      if (excludedTerrainIds.length > 0) {
        query = query.not('id_terrain', 'in', `(${excludedTerrainIds.join(',')})`);
      }
      
      if (isEditing && initialData?.id_terrain) {
        const { data: currentTerrain, error: currentTerrainError } = await supabase
          .from('terrain')
          .select('*')
          .eq('id_terrain', initialData.id_terrain)
          .single();
          
        if (currentTerrainError) {
          console.error("Error fetching current terrain:", currentTerrainError);
        }
        
        const { data: terrainData, error: terrainError } = await query;
        
        if (terrainError) {
          console.error("Error fetching terrains:", terrainError);
          return;
        }
        
        if (currentTerrain) {
          const filteredTerrains = [...(terrainData || [])];
          if (!filteredTerrains.some(t => t.id_terrain === currentTerrain.id_terrain)) {
            filteredTerrains.push(currentTerrain);
          }
          setTerrains(filteredTerrains as TerrainData[]);
        } else {
          setTerrains(terrainData as TerrainData[] || []);
        }
      } else {
        const { data: terrainData, error: terrainError } = await query;
        
        if (terrainError) {
          console.error("Error fetching terrains:", terrainError);
          return;
        }
        
        setTerrains(terrainData as TerrainData[] || []);
        
        if (profile?.nom_role !== 'simple' && farmerId && (!terrainData || terrainData.length === 0)) {
          toast.warning("Ce propriétaire n'a pas de terrains disponibles pour un nouveau projet");
        }
      }
      
      if (isEditing && initialData?.id_terrain) {
        setValue("terrain", initialData.id_terrain.toString());
      } else if (terrains.length > 0 && !getValues("terrain")) {
        setValue("terrain", terrains[0].id_terrain?.toString() || "");
      }
    } catch (error) {
      console.error("Unexpected error fetching terrains:", error);
      toast.error("Erreur inattendue lors du chargement des terrains");
    }
  }, [user, getValues, setValue, isEditing, initialData, profile?.nom_role, terrains]);

  const fetchCultures = useCallback(async () => {
    try {
      const { data: culturesData, error } = await supabase
        .from('culture')
        .select('*');

      if (error) {
        console.error("Error fetching cultures:", error);
        toast.error("Erreur lors du chargement des cultures");
        return;
      }

      setCultures(culturesData || []);
      
      if (isEditing && initialData?.projet_culture && initialData.projet_culture.length > 0) {
        const culturesToSelect = initialData.projet_culture.map((pc: ProjetCulture) => 
          pc.id_culture.toString()
        );
        setValue("cultures", culturesToSelect);
        setSelectedCultures(culturesToSelect);
      }
    } catch (error) {
      console.error("Unexpected error fetching cultures:", error);
      toast.error("Erreur inattendue lors du chargement des cultures");
    }
  }, [setCultures, isEditing, initialData, setValue]);

  useEffect(() => {
    fetchFarmers();
    fetchCultures();
  }, [fetchFarmers, fetchCultures]);

  useEffect(() => {
    if (isEditing || profile?.nom_role === 'simple') {
      fetchTerrains();
    }
  }, [fetchTerrains, isEditing, profile?.nom_role]);

  useEffect(() => {
    if (isEditing && initialData?.photos) {
      const photos = initialData.photos.split(',').filter((p: string) => p);
      setPhotoUrls(photos);
    }
  }, [isEditing, initialData]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        {profile?.nom_role !== 'simple' && (
          <FormField
            control={control}
            name="selectedFarmer"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Agriculteur</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agriculteur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {farmers.map((farmer) => (
                      <SelectItem key={farmer.id_utilisateur} value={farmer.id_utilisateur}>
                        {farmer.nom} {farmer.prenoms || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Sélectionnez l'agriculteur propriétaire du projet
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={control}
          name="terrain"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Terrain</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled || (profile?.nom_role !== 'simple' && !watchedFarmer && !isEditing)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un terrain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {terrains.length > 0 ? (
                    terrains.map((terrain) => (
                      <SelectItem key={terrain.id_terrain} value={terrain.id_terrain?.toString() || ""}>
                        {terrain.nom_terrain || `Terrain #${terrain.id_terrain}`} ({terrain.surface_validee || terrain.surface_proposee} ha)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-terrains" disabled>
                      {profile?.nom_role !== 'simple' && !watchedFarmer 
                        ? "Veuillez d'abord sélectionner un agriculteur" 
                        : "Aucun terrain disponible"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                La surface du projet sera automatiquement celle du terrain sélectionné.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description du projet</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre projet agricole"
                  className="resize-none min-h-[100px]"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="cultures"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Cultures à mettre en place</FormLabel>
                <FormDescription>
                  Sélectionnez une ou plusieurs cultures pour votre projet.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {cultures.map((culture) => (
                  <div key={culture.id_culture} className="flex items-center space-x-2">
                    <Checkbox
                      id={`culture-${culture.id_culture}`}
                      checked={selectedCultures.includes(culture.id_culture.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue("cultures", [...selectedCultures, culture.id_culture.toString()]);
                        } else {
                          setValue("cultures", selectedCultures.filter(id => id !== culture.id_culture.toString()));
                        }
                      }}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`culture-${culture.id_culture}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {culture.nom_culture}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCultures.length > 0 && selectedTerrain && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Informations financières</h3>
            <div className="border rounded overflow-hidden">
              <Table>
                <TableCaption>Informations financières du projet basées sur les cultures sélectionnées</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Culture</TableHead>
                    <TableHead>Coût/ha</TableHead>
                    <TableHead>Coût total ({selectedTerrain.surface_validee || selectedTerrain.surface_proposee} ha)</TableHead>
                    <TableHead>Rendement/ha</TableHead>
                    <TableHead>Rendement total</TableHead>
                    <TableHead>Prix/tonne</TableHead>
                    <TableHead>CA projeté</TableHead>
                    <TableHead>Bénéfice projeté</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cultures
                    .filter(culture => selectedCultures.includes(culture.id_culture.toString()))
                    .map(culture => {
                      const surface = selectedTerrain.surface_validee || selectedTerrain.surface_proposee || 0;
                      const costPerHa = culture.cout_exploitation_ha || 0;
                      const totalCost = costPerHa * surface;
                      const yieldPerHa = culture.rendement_ha || 0;
                      const totalYield = yieldPerHa * surface;
                      const pricePerTon = culture.prix_tonne || 0;
                      const totalRevenue = totalYield * pricePerTon;
                      const profit = totalRevenue - totalCost;

                      return (
                        <TableRow key={culture.id_culture}>
                          <TableCell>{culture.nom_culture}</TableCell>
                          <TableCell>{costPerHa.toLocaleString()} Ar</TableCell>
                          <TableCell>{totalCost.toLocaleString()} Ar</TableCell>
                          <TableCell>{yieldPerHa.toLocaleString()} t</TableCell>
                          <TableCell>{totalYield.toLocaleString()} t</TableCell>
                          <TableCell>{pricePerTon.toLocaleString()} Ar</TableCell>
                          <TableCell>{totalRevenue.toLocaleString()} Ar</TableCell>
                          <TableCell>{profit.toLocaleString()} Ar</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell>{financialSummary.totalCost.toLocaleString()} Ar</TableCell>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell>{financialSummary.totalRevenue.toLocaleString()} Ar</TableCell>
                    <TableCell>{financialSummary.profit.toLocaleString()} Ar</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Photos du projet</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </div>
          
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Project photo ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-md border border-border"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={disabled}
            >
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={disabled || isUploading || selectedCultures.length === 0 || !selectedTerrain} 
            className="flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              isEditing ? 'Mettre à jour' : 'Créer le projet'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
