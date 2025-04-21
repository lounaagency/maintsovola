
import { TerrainData } from './terrain';

export interface TerrainFormData {
  nom_terrain: string;
  surface_proposee: number;
  id_region: string;
  id_district: string;
  id_commune: string;
  acces_eau: boolean;
  acces_route: boolean;
  id_tantsaha: string;
}

export const convertFormDataToTerrainData = (formData: TerrainFormData): Partial<TerrainData> => {
  return {
    nom_terrain: formData.nom_terrain,
    surface_proposee: formData.surface_proposee,
    id_region: parseInt(formData.id_region, 10),
    id_district: parseInt(formData.id_district, 10),
    id_commune: parseInt(formData.id_commune, 10),
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    id_tantsaha: formData.id_tantsaha
  };
};
