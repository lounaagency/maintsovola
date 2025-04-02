
export interface RegionData {
  id_region: number;
  nom_region: string;
}

export interface DistrictData {
  id_district: number;
  id_region: number;
  nom_district: string;
}

export interface CommuneData {
  id_commune: number;
  id_district: number;
  nom_commune: string;
}

export interface TerrainData {
  id_terrain?: number;
  id_tantsaha?: string;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  surface_proposee: number;
  surface_validee?: number;
  acces_eau?: boolean;
  acces_route?: boolean;
  statut?: boolean;
  nom_terrain?: string;
  created_at?: string;
  modified_at?: string;
  id_technicien?: string;
  id_superviseur?: string;
  techniqueNom?: string;
  techniquePrenoms?: string;
  photos: string | string[];
  archive?: boolean;
  created_by?: string;
  region_name?: string;
  district_name?: string;
  commune_name?: string;
  geom?: any;
}
