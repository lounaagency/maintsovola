
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
  id_tantsaha?: string;
  photos?: string;
  photos_validation?: string;
  date_validation?: string;
  rapport_validation?: string;
  validation_decision?: string;
  geom?: any;
  statut?: boolean;
}

export type TerrainForm = TerrainFormData;

export function convertFormDataToTerrainData(formData: TerrainFormData): Partial<TerrainData> {
  return {
    id_terrain: formData.id_terrain,
    nom_terrain: formData.nom_terrain,
    surface_proposee: formData.surface_proposee,
    surface_validee: formData.surface_validee,
    id_region: formData.id_region ? parseInt(formData.id_region) : undefined,
    id_district: formData.id_district ? parseInt(formData.id_district) : undefined,
    id_commune: formData.id_commune ? parseInt(formData.id_commune) : undefined,
    acces_eau: formData.acces_eau,
    acces_route: formData.acces_route,
    photos: formData.photos,
    photos_validation: formData.photos_validation,
    date_validation: formData.date_validation,
    rapport_validation: formData.rapport_validation,
    validation_decision: formData.validation_decision,
    geom: formData.geom ? JSON.stringify({
      type: "Polygon",
      coordinates: [formData.geom]
    }) : undefined,
    id_tantsaha: formData.id_tantsaha,
    statut: formData.statut
  };
}
