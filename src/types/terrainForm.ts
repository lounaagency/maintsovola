
import { TerrainData } from './terrain';

export interface TerrainFormData {
  id_terrain?: number;
  id_tantsaha?: string;
  nom_terrain: string;
  surface_proposee: number;
  id_region: string; // Form will use string for select inputs
  id_district: string; // Form will use string for select inputs
  id_commune: string; // Form will use string for select inputs
  acces_eau: boolean;
  acces_route: boolean;
  photos?: string | string[]; // Allow both string and string[] types
  geom?: any;
}

// Convert from form data (strings) to API data (numbers)
export const convertFormDataToTerrainData = (formData: TerrainFormData): TerrainData => {
  return {
    id_terrain: formData.id_terrain,
    id_tantsaha: formData.id_tantsaha,
    nom_terrain: formData.nom_terrain,
    surface_proposee: formData.surface_proposee,
    id_region: formData.id_region ? Number(formData.id_region) : null,
    id_district: formData.id_district ? Number(formData.id_district) : null,
    id_commune: formData.id_commune ? Number(formData.id_commune) : null,
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    photos: formData.photos,
    geom: formData.geom
  };
};

// Convert from API data (numbers) to form data (strings)
export const convertTerrainDataToFormData = (terrainData: TerrainData): TerrainFormData => {
  return {
    id_terrain: terrainData.id_terrain,
    id_tantsaha: terrainData.id_tantsaha,
    id_region: terrainData.id_region?.toString() || '',
    id_district: terrainData.id_district?.toString() || '',
    id_commune: terrainData.id_commune?.toString() || '',
    nom_terrain: terrainData.nom_terrain || '',
    acces_eau: terrainData.acces_eau || false,
    acces_route: terrainData.acces_route || false,
    surface_proposee: terrainData.surface_proposee,
    photos: terrainData.photos,
    geom: terrainData.geom
  };
};
