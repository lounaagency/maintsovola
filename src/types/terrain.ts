
export interface RegionData {
  id_region: number;
  nom_region: string;
}

export interface DistrictData {
  id_district: number;
  nom_district: string;
  id_region: number;
}

export interface CommuneData {
  id_commune: number;
  nom_commune: string;
  id_district: number;
}

export interface TerrainData {
  id_terrain?: number;
  id_tantsaha?: string;
  tantsahaNom?: string;
  id_technicien?: string;
  techniqueNom?: string;
  id_superviseur?: string;
  nom_terrain?: string;
  surface_proposee: number;
  surface_validee?: number;
  acces_eau?: boolean;
  acces_route?: boolean;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  region_name?: string;
  district_name?: string;
  commune_name?: string;
  statut?: boolean;
  date_validation?: string;
  archive?: boolean;
  rapport_validation?: string;
  photos?: string | string[];
  photos_validation?: string | string[];
  geom?: any;
  validation_decision?: string;
  created_at?: string;
  modified_at?: string;
  created_by?: string;
}

export interface TerrainSortOptions {
  field: keyof TerrainData;
  direction: 'asc' | 'desc';
}

export interface TerrainFilters {
  region?: number;
  district?: number;
  commune?: number;
  hasWater?: boolean;
  hasRoad?: boolean;
}
