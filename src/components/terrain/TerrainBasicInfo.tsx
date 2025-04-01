
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from 'react-hook-form';
import { TerrainFormData } from '@/types/terrainForm';

interface TerrainBasicInfoProps {
  control: Control<TerrainFormData>;
  errors: any;
}

const TerrainBasicInfo: React.FC<TerrainBasicInfoProps> = ({
  control,
  errors
}) => {
  return (
    <>
      <FormField
        control={control}
        name="nom_terrain"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du terrain</FormLabel>
            <FormControl>
              <Input placeholder="Nom du terrain" {...field} />
            </FormControl>
            <FormMessage>{errors.nom_terrain?.message}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="surface_proposee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surface proposée (en hectares)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Surface proposée en hectares"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage>{errors.surface_proposee?.message}</FormMessage>
          </FormItem>
        )}
      />

      <div className="flex items-center space-x-2">
        <FormField
          control={control}
          name="acces_eau"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Accès à l'eau
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="acces_route"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Accès à la route
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default TerrainBasicInfo;
