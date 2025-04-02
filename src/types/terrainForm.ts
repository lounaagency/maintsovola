
import { TerrainData } from './terrain';

export interface TerrainFormData {
  id_terrain?: number;
  nom_terrain: string;
  surface_proposee: number;
  id_region: string; // Form will use string for select inputs
  id_district: string; // Form will use string for select inputs
  id_commune: string; // Form will use string for select inputs
  acces_eau: boolean;
  acces_route: boolean;
  photos?: string | string[]; // Allow both string and string[] types
  id_tantsaha?: string;
  geom?: any;
}

// Convert from form data (strings) to API data (numbers)
export const convertFormDataToTerrainData = (formData: TerrainFormData): TerrainData => {
  return {
    ...formData,
    id_region: formData.id_region ? Number(formData.id_region) : null,
    id_district: formData.id_district ? Number(formData.id_district) : null,
    id_commune: formData.id_commune ? Number(formData.id_commune) : null,
  };
};

// Convert from API data (numbers) to form data (strings)
export const convertTerrainDataToFormData = (terrainData: TerrainData): TerrainFormData => {
  return {
    ...terrainData,
    id_region: terrainData.id_region?.toString() || '',
    id_district: terrainData.id_district?.toString() || '',
    id_commune: terrainData.id_commune?.toString() || '',
    nom_terrain: terrainData.nom_terrain || '',
    acces_eau: terrainData.acces_eau || false,
    acces_route: terrainData.acces_route || false,
    surface_proposee: terrainData.surface_proposee,
  };
};
