
import { TerrainData } from "./terrain";

export interface TerrainFormData {
  id_terrain?: number;
  nom_terrain: string;
  surface_proposee: number;
  surface_validee?: number;
  id_region: string;
  id_district: string;
  id_commune: string;
  acces_eau: boolean;
  acces_route: boolean;
  id_tantsaha?: string;
  photos?: string | string[];
  date_validation?: string;
  rapport_validation?: string;
  photos_validation?: string | string[];
  validation_decision?: 'valider' | 'rejetter'; 
  geom?: any;
}

export const convertFormDataToTerrainData = (formData: TerrainFormData): Partial<TerrainData> => {
  return {
    id_terrain: formData.id_terrain,
    nom_terrain: formData.nom_terrain,
    id_region: formData.id_region ? parseInt(formData.id_region, 10) : undefined,
    id_district: formData.id_district ? parseInt(formData.id_district, 10) : undefined,
    id_commune: formData.id_commune ? parseInt(formData.id_commune, 10) : undefined,
    surface_proposee: formData.surface_proposee,
    surface_validee: formData.surface_validee,
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    id_tantsaha: formData.id_tantsaha,
    photos: formData.photos,
    date_validation: formData.date_validation,
    rapport_validation: formData.rapport_validation,
    photos_validation: formData.photos_validation,
    validation_decision: formData.validation_decision,
    geom: formData.geom 
      ? {
          type: "Polygon",
          coordinates: [formData.geom]
        }
      : undefined
  };
};

// Type alias for backward compatibility 
export type TerrainForm = TerrainFormData;
