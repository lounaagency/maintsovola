import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PopoverClose } from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TerrainData } from '@/types/terrain';
import { CultureData } from '@/types/culture';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Le titre doit contenir au moins 2 caractères.",
  }),
  description: z.string().optional(),
  terrain: z.string().min(1, {
    message: "Veuillez sélectionner un terrain.",
  }),
  status: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  cultures: z.array(z.string()).optional(),
  surface_ha: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }, {
    message: "La surface doit être un nombre positif.",
  }),
  cout_total: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Le coût total doit être un nombre positif ou nul.",
  }),
  financement_actuel: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Le financement actuel doit être un nombre positif ou nul.",
  }),
})

interface ProjectFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  disabled?: boolean;
  initialData?: any;
  isEditing?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, disabled, initialData, isEditing }) => {
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      terrain: initialData?.terrain?.toString() || "",
      status: initialData?.status || "planification",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
      cultures: initialData?.cultures || [],
      surface_ha: initialData?.surface_ha?.toString() || "0",
      cout_total: initialData?.cout_total?.toString() || "0",
      financement_actuel: initialData?.financement_actuel?.toString() || "0"
    },
    mode: "onChange",
  })

  const { handleSubmit, control, setValue, getValues } = form;

  const handleInputChange = (name: string, value: any) => {
    setValue(name, value, { shouldValidate: true });
  };

  const onSubmitHandler = async (data: z.infer<typeof formSchema>) => {
    try {
      const uploadedPhotoUrls = await uploadPhotos();
      
      const allPhotoUrls = [
        ...photoUrls.filter(url => url.includes('supabase.co')), 
        ...uploadedPhotoUrls
      ];
      
      const formData = {
        ...data,
        images: allPhotoUrls
      };
      
      onSubmit(formData);
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

  const fetchTerrains = useCallback(async () => {
    if (!user) return;
    try {
      const { data: terrainsData, error } = await supabase
        .from('terrain')
        .select('*')
        .eq('id_tantsaha', user.id);

      if (error) {
        console.error("Error fetching terrains:", error);
        toast.error("Erreur lors du chargement des terrains");
        return;
      }

      setTerrains(terrainsData || []);
      if (terrainsData && terrainsData.length > 0 && !getValues("terrain")) {
        handleInputChange("terrain", terrainsData[0].id_terrain?.toString());
      }
    } catch (error) {
      console.error("Unexpected error fetching terrains:", error);
      toast.error("Erreur inattendue lors du chargement des terrains");
    }
  }, [user, getValues, handleInputChange, setTerrains]);

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
    } catch (error) {
      console.error("Unexpected error fetching cultures:", error);
      toast.error("Erreur inattendue lors du chargement des cultures");
    }
  }, [setCultures]);

  useEffect(() => {
    fetchTerrains();
    fetchCultures();
  }, [fetchTerrains, fetchCultures]);

  useEffect(() => {
    if (isEditing && initialData?.images) {
      setPhotoUrls(initialData.images);
    }
  }, [isEditing, initialData]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du projet</FormLabel>
              <FormControl>
                <Input placeholder="Nommez votre projet" {...field} disabled={disabled} />
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
                  placeholder="Décrivez votre projet agricole"
                  className="resize-none"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Fournissez une description claire et concise de votre projet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="surface_ha"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Surface (ha)</FormLabel>
                <FormControl>
                  <Input placeholder="0" {...field} type="number" disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cout_total"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Coût Total</FormLabel>
                <FormControl>
                  <Input placeholder="0 Ar" {...field} type="number" disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="financement_actuel"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Financement Actuel</FormLabel>
                <FormControl>
                  <Input placeholder="0 Ar" {...field} type="number" disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="terrain"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Terrain</FormLabel>
                <Select
                  value={form.getValues("terrain")}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un terrain" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {terrains.map((terrain) => (
                      <SelectItem key={terrain.id_terrain} value={terrain.id_terrain?.toString()}>
                        {terrain.nom_terrain || `Terrain #${terrain.id_terrain}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Statut</FormLabel>
                <Select
                  value={form.getValues("status")}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planification">Planification</SelectItem>
                    <SelectItem value="en_cours">En Cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={disabled}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={disabled}
                      initialFocus
                    />
                    <PopoverClose className="absolute top-2 right-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                        <path d="M18 6 6 18" />
                        <path d="M6 6 18 18" />
                      </svg>
                    </PopoverClose>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={disabled}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={disabled}
                      initialFocus
                    />
                    <PopoverClose className="absolute top-2 right-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                        <path d="M18 6 6 18" />
                        <path d="M6 6 18 18" />
                      </svg>
                    </PopoverClose>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="cultures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultures</FormLabel>
              {cultures.length > 0 ? (
                cultures.map((culture) => (
                  <div key={culture.id_culture} className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id={`culture-${culture.id_culture}`}
                      value={culture.id_culture?.toString()}
                      checked={field.value?.includes(culture.id_culture?.toString())}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          field.onChange([...(field.value || []), culture.id_culture?.toString()]);
                        } else {
                          field.onChange(field.value?.filter((id) => id !== culture.id_culture?.toString()));
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
                ))
              ) : (
                <div>Aucune culture disponible.</div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
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

        <Button type="submit" disabled={disabled || isUploading} className="flex items-center">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            'Soumettre'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ProjectForm;
