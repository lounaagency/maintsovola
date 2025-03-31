import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import { CalendarIcon } from "lucide-react";
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
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, disabled }) => {
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      terrain: "",
      status: "planification",
      startDate: new Date(),
      endDate: new Date(),
      cultures: [],
      surface_ha: "0",
      cout_total: "0",
      financement_actuel: "0"
    },
    mode: "onChange",
  })

  const { handleSubmit, control, setValue, getValues } = form;

  const handleInputChange = (name: string, value: any) => {
    setValue(name, value, { shouldValidate: true });
  };

  const onSubmitHandler = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
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
        <Button type="submit" disabled={disabled}>Soumettre</Button>
      </form>
    </Form>
  );
};

export default ProjectForm;
