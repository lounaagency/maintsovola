
export interface TerrainData {
  id_terrain?: number;
  nom_terrain?: string;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  surface_proposee: number;
  surface_validee?: number;
  acces_eau?: boolean;
  acces_route?: boolean;
  geom?: any;
  statut?: boolean;
  created_at?: string;
  modified_at?: string;
  id_tantsaha?: string;
  id_superviseur?: string;
  id_technicien?: string;
  photos?: string;
  archive?: boolean;
  date_validation?: string | null;
  rapport_validation?: string | null;
  photos_validation?: string | null;
  validation_decision?: string;
}
