
export interface TerrainData {
  id_terrain?: number;
  id_tantsaha?: string;
  id_region?: number | null;
  id_district?: number | null;
  id_commune?: number | null;
  surface_proposee: number;
  surface_validee?: number;
  acces_eau?: boolean | null;
  acces_route?: boolean | null;
  statut?: boolean;
  id_technicien?: string | null;
  id_superviseur?: string | null;
  region_name?: string;
  district_name?: string;
  commune_name?: string;
  created_at?: string;
  techniqueNom?: string;
  techniquePrenoms?: string;
  nom_terrain?: string;
}

export interface ProjetStatus {
  id_terrain: number;
  statut: string;
  has_investisseur: boolean;
}

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
