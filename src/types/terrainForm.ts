
import { TerrainData } from '@/types/terrain';

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
  id_tantsaha: string;
  statut?: boolean;
  photos?: string | string[];
  geom?: any;
  date_validation?: string;
  rapport_validation?: string;
  photos_validation?: string | string[];
  validation_decision?: string;
}

export function convertFormDataToTerrainData(formData: TerrainFormData): Partial<TerrainData> {
  const result: Partial<TerrainData> = {
    id_terrain: formData.id_terrain,
    nom_terrain: formData.nom_terrain,
    surface_proposee: formData.surface_proposee,
    surface_validee: formData.surface_validee,
    id_region: formData.id_region ? parseInt(formData.id_region) : undefined,
    id_district: formData.id_district ? parseInt(formData.id_district) : undefined,
    id_commune: formData.id_commune ? parseInt(formData.id_commune) : undefined,
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    id_tantsaha: formData.id_tantsaha,
    statut: formData.statut,
    photos: formData.photos,
    geom: formData.geom,
    date_validation: formData.date_validation,
    rapport_validation: formData.rapport_validation,
    photos_validation: formData.photos_validation,
    validation_decision: formData.validation_decision
  };

  return result;
}
