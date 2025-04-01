
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
  photos?: string[] | string;
  id_tantsaha?: string;
}

// Convert from form data (strings) to API data (numbers)
export const convertFormDataToTerrainData = (formData: TerrainFormData): TerrainData => {
  return {
    ...formData,
    id_region: Number(formData.id_region),
    id_district: Number(formData.id_district),
    id_commune: Number(formData.id_commune),
    // Ensure photos is a string for the database
    photos: Array.isArray(formData.photos) ? formData.photos.join(',') : formData.photos
  };
};

// Convert from API data (numbers) to form data (strings)
export const convertTerrainDataToFormData = (terrainData: TerrainData): TerrainFormData => {
  return {
    ...terrainData,
    nom_terrain: terrainData.nom_terrain || '',
    id_region: terrainData.id_region?.toString() || '',
    id_district: terrainData.id_district?.toString() || '',
    id_commune: terrainData.id_commune?.toString() || '',
    // Convert comma-separated photos string to array if needed
    photos: typeof terrainData.photos === 'string' && terrainData.photos ? 
            terrainData.photos.split(',') : 
            terrainData.photos,
    acces_eau: !!terrainData.acces_eau,
    acces_route: !!terrainData.acces_route
  };
};
