export interface TerrainData {
  id_terrain: number;
  nom_terrain: string;
  superficie: number;
  localisation: string;
  acces_eau: boolean;
  acces_route: boolean;
  id_region: number;
  id_district: number;
  id_commune: number;
  region_name?: string;
  district_name?: string; 
  commune_name?: string;
  statut: string;
  archive: boolean;
  created_at: string;
  created_by: string;
  date_validation?: string;
  coordonnees_gps?: string;
  id_technicien?: string;
  id_superviseur?: string;
  id_tantsaha?: string;
  observations?: string;
  status_validation?: 'en_attente' | 'valide' | 'rejete';
  photos?: string[];
  region?: {
    nom_region: string;
  };
  district?: {
    nom_district: string;
  };
  commune?: {
    nom_commune: string;
  };
  // Added properties for user names
  tantsahaNom?: string;
  techniqueNom?: string;
  superviseurNom?: string;
}

export interface TerrainFormData {
  id_terrain?: number;
  id_tantsaha?: string;
  id_technicien?: string | null;
  id_superviseur?: string | null;
  id_region: string;
  id_district: string;
  id_commune: string;
  surface_proposee: number;
  surface_validee?: number;
  acces_eau: boolean;
  acces_route: boolean;
  nom_terrain?: string;
  photos?: string | string[];
  geom?: number[][]; // Coordonnées du polygone [[lng, lat], [lng, lat], ...]
  // Validation fields
  date_validation?: string;
  rapport_validation?: string;
  photos_validation?: string | string[];
  validation_decision?: 'valider' | 'rejetter' | string;
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
