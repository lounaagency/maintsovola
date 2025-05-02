
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TerrainForm } from '@/types/terrainForm';

export interface TerrainFormFieldsProps {
  regions: { id_region: number; nom_region: string }[];
  districts: { id_district: number; nom_district: string }[];
  communes: { id_commune: number; nom_commune: string }[];
  isLoading: boolean;
  form: UseFormReturn<TerrainForm>;
  userRole?: string;
  userId: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  photoUrls: string[];
  setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  polygonCoordinates: number[][];
  setPolygonCoordinates: React.Dispatch<React.SetStateAction<number[][]>>;
  overlapTerrains: any[] | null;
}

const TerrainFormFields: React.FC<TerrainFormFieldsProps> = ({
  regions,
  districts,
  communes,
  isLoading,
  form,
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="nom_terrain"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du terrain</FormLabel>
            <FormControl>
              <Input placeholder="Mon terrain à Ambatondrazaka" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="id_region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Région</FormLabel>
            <Select
              disabled={isLoading || regions.length === 0}
              onValueChange={(value) => {
                field.onChange(Number(value));
                form.setValue('id_district', undefined);
                form.setValue('id_commune', undefined);
              }}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une région" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem 
                    key={region.id_region} 
                    value={region.id_region.toString()}
                  >
                    {region.nom_region}
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
        name="id_district"
        render={({ field }) => (
          <FormItem>
            <FormLabel>District</FormLabel>
            <Select
              disabled={isLoading || districts.length === 0 || !form.getValues('id_region')}
              onValueChange={(value) => {
                field.onChange(Number(value));
                form.setValue('id_commune', undefined);
              }}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.getValues('id_region') 
                      ? "Sélectionnez d'abord une région" 
                      : "Sélectionnez un district"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem 
                    key={district.id_district} 
                    value={district.id_district.toString()}
                  >
                    {district.nom_district}
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
        name="id_commune"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commune</FormLabel>
            <Select
              disabled={isLoading || communes.length === 0 || !form.getValues('id_district')}
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.getValues('id_district') 
                      ? "Sélectionnez d'abord un district" 
                      : "Sélectionnez une commune"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {communes.map((commune) => (
                  <SelectItem 
                    key={commune.id_commune} 
                    value={commune.id_commune.toString()}
                  >
                    {commune.nom_commune}
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
        name="surface_proposee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surface proposée (en hectares)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.5"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="acces_eau"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Accès à l'eau</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="acces_route"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Accès routier</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default TerrainFormFields;
