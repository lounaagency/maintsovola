
import { TerrainData } from './terrain';

export interface TerrainFormData {
  nom_terrain: string;
  surface_proposee: number;
  id_region: string;
  id_district: string;
  id_commune: string;
  acces_eau: boolean;
  acces_route: boolean;
}

export const convertFormDataToTerrainData = (formData: TerrainFormData): TerrainData => {
  return {
    id_region: formData.id_region ? parseInt(formData.id_region) : undefined,
    id_district: formData.id_district ? parseInt(formData.id_district) : undefined,
    id_commune: formData.id_commune ? parseInt(formData.id_commune) : undefined,
    nom_terrain: formData.nom_terrain,
    surface_proposee: formData.surface_proposee,
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    photos: [] // Initialize with empty array
  };
};
