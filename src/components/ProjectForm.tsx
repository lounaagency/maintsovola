import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fr } from 'date-fns/locale';

interface ProjectFormProps {
  initialData?: any;
  isEditing?: boolean;
  userId: string;
  userRole?: string;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

// Define the form schema
const formSchema = yup.object().shape({
  titre: yup.string().required('Le titre est obligatoire'),
  description: yup.string().required('La description est obligatoire'),
  surface_ha: yup.number().required('La surface est obligatoire').positive('La surface doit être positive'),
  id_terrain: yup.string().required('Le terrain est obligatoire'),
  id_culture: yup.string().required('La culture est obligatoire'),
  statut: yup.string().required('Le statut est obligatoire'),
  date_debut_previsionnelle: yup.date().required('La date de début prévisionnelle est obligatoire'),
});

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  isEditing,
  userId,
  userRole,
  onCancel,
  onSubmitSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [terrains, setTerrains] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [statuts, setStatuts] = useState([
    { value: 'planifie', label: 'Planifié' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'suspendu', label: 'Suspendu' },
    { value: 'annule', label: 'Annulé' },
  ]);

  const form = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      titre: initialData?.titre || '',
      description: initialData?.description || '',
      surface_ha: initialData?.surface_ha || 0,
      id_terrain: initialData?.id_terrain || '',
      id_culture: initialData?.id_culture || '',
      statut: initialData?.statut || 'planifie',
      date_debut_previsionnelle: initialData?.date_debut_previsionnelle ? new Date(initialData.date_debut_previsionnelle) : undefined,
    },
  });

  useEffect(() => {
    fetchTerrains();
    fetchCultures();
  }, []);

  const fetchTerrains = async () => {
    try {
      const { data, error } = await supabase
        .from('terrain')
        .select('*')
        .eq('id_tantsaha', userId);

      if (error) {
        throw error;
      }

      if (data) {
        setTerrains(data);
      }
    } catch (error) {
      console.error("Error fetching terrains:", error);
      toast.error("Failed to load terrains.");
    }
  };

  const fetchCultures = async () => {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        setCultures(data);
      }
    } catch (error) {
      console.error("Error fetching cultures:", error);
      toast.error("Failed to load cultures.");
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        surface_ha: parseFloat(data.surface_ha),
        id_tantsaha: userId,
      };

      let response;
      if (isEditing && initialData?.id_projet) {
        response = await supabase
          .from('projet')
          .update(payload)
          .eq('id_projet', initialData.id_projet);
      } else {
        response = await supabase
          .from('projet')
          .insert([payload]);
      }

      if (response.error) {
        throw response.error;
      }

      toast.success(`Project ${isEditing ? 'updated' : 'created'} successfully!`);
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error("Error during form submission:", error);
      toast.error(error.message || "An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  // Make sure setValues uses string values for fields
  const setValue = (field: string, value: any) => {
    form.setValue(field as any, value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre du projet" {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.titre?.message}</FormMessage>
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
                <Textarea placeholder="Description du projet" {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.description?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surface_ha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surface (ha)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Surface en hectares"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage>{form.formState.errors.surface_ha?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_terrain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terrain</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un terrain" />
                </SelectTrigger>
                <SelectContent>
                  {terrains.map((terrain) => (
                    <SelectItem key={terrain.id_terrain} value={terrain.id_terrain}>
                      {terrain.nom_terrain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage>{form.formState.errors.id_terrain?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_culture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Culture</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une culture" />
                </SelectTrigger>
                <SelectContent>
                  {cultures.map((culture) => (
                    <SelectItem key={culture.id_culture} value={culture.id_culture}>
                      {culture.nom_culture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage>{form.formState.errors.id_culture?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="statut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuts.map((statut) => (
                    <SelectItem key={statut.value} value={statut.value}>
                      {statut.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage>{form.formState.errors.statut?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date_debut_previsionnelle"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de début prévisionnelle</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: fr })
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
                    locale={fr}
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage>{form.formState.errors.date_debut_previsionnelle?.message}</FormMessage>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
