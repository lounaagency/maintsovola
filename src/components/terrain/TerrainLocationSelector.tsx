
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from 'react-hook-form';
import { TerrainFormData } from '@/types/terrainForm';
import { RegionData, DistrictData, CommuneData } from '@/types/terrain';

interface TerrainLocationSelectorProps {
  control: Control<TerrainFormData>;
  regions: RegionData[];
  districts: DistrictData[];
  communes: CommuneData[];
  onRegionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  errors: any;
}

const TerrainLocationSelector: React.FC<TerrainLocationSelectorProps> = ({
  control,
  regions,
  districts,
  communes,
  onRegionChange,
  onDistrictChange,
  errors
}) => {
  return (
    <>
      <FormField
        control={control}
        name="id_region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Région</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              onRegionChange(value);
            }} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id_region} value={region.id_region.toString()}>
                    {region.nom_region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{errors.id_region?.message}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="id_district"
        render={({ field }) => (
          <FormItem>
            <FormLabel>District</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              onDistrictChange(value);
            }} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id_district} value={district.id_district.toString()}>
                    {district.nom_district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{errors.id_district?.message}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="id_commune"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commune</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une commune" />
              </SelectTrigger>
              <SelectContent>
                {communes.map((commune) => (
                  <SelectItem key={commune.id_commune} value={commune.id_commune.toString()}>
                    {commune.nom_commune}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{errors.id_commune?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
};

export default TerrainLocationSelector;
