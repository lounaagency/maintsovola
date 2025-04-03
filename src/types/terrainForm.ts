
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
  id_tantsaha?: string;
 // photos?: string[];
  geom?: number[][]; // Coordonnées du polygone [[lng, lat], [lng, lat], ...]
}

// Convert from form data (strings) to API data (numbers)
export const convertFormDataToTerrainData = (formData: TerrainFormData): TerrainData => {
  const terrainData: TerrainData = {
    ...formData,
    id_region: Number(formData.id_region),
    id_district: Number(formData.id_district),
    id_commune: Number(formData.id_commune),
  };
  
  // Si des coordonnées de polygone ont été définies, créer un objet geom au format GeoJSON
  if (formData.geom && formData.geom.length >= 3) {
    // La propriété geom attend un objet GeoJSON Polygon
    terrainData.geom = {
      type: 'Polygon',
      coordinates: [formData.geom],
    };
  }
  
  return terrainData;
};

// Convert from API data (numbers) to form data (strings)
export const convertTerrainDataToFormData = (terrainData: TerrainData): TerrainFormData => {
  const formData: TerrainFormData = {
    ...terrainData,
    nom_terrain: terrainData.nom_terrain || '',
    surface_proposee: terrainData.surface_proposee,
    id_region: terrainData.id_region?.toString() || '',
    id_district: terrainData.id_district?.toString() || '',
    id_commune: terrainData.id_commune?.toString() || '',
    acces_eau: Boolean(terrainData.acces_eau),
    acces_route: Boolean(terrainData.acces_route),
  };
  
  // Extraire les coordonnées du polygone si elles existent
  if (terrainData.geom && terrainData.geom.type === 'Polygon' && 
      terrainData.geom.coordinates && terrainData.geom.coordinates[0]) {
    formData.geom = terrainData.geom.coordinates[0];
  }
  
  return formData;
};
