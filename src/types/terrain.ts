
export interface TerrainData {
  id_terrain?: number;
  nom_terrain?: string;
  surface_proposee: number;
  surface_validee?: number;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  acces_eau?: boolean;
  acces_route?: boolean;
  id_tantsaha?: string;
  statut?: boolean;
  photos?: string | string[];
  geom?: any;
  date_validation?: string;
  rapport_validation?: string;
  photos_validation?: string | string[];
  validation_decision?: string;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  id_superviseur?: string;
  id_technicien?: string;
  archive?: boolean;
  region?: RegionData;
  district?: DistrictData;
  commune?: CommuneData;
  
  // Add these properties to match the fields used in the components
  region_name?: string;
  district_name?: string;
  commune_name?: string;
  tantsahaNom?: string;
  techniqueNom?: string;
  superviseurNom?: string;
}

export interface RegionData {
  id_region?: number;
  nom_region?: string;
  id_province?: number;
  emplacement_chef_lieu?: string;
  created_at?: string;
}

export interface DistrictData {
  id_district?: number;
  nom_district?: string;
  id_region?: number;
  emplacement_chef_lieu?: string;
  created_at?: string;
}

export interface CommuneData {
  id_commune?: number;
  nom_commune?: string;
  id_district?: number;
  id_region?: number;
  emplacement_chef_lieu?: string;
  created_at?: string;
}

// Add these interfaces for sorting and filtering
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
  validated?: boolean;
  tantsaha?: string;
  technicien?: string;
}
