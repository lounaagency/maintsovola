
export interface Culture {
  id_culture: number;
  nom_culture: string;
  description?: string;
  photo?: string;
  rendement_par_hectare?: number;
  prix_par_kg?: number;
  duree_cycle_jours?: number;
  created_at?: string;
  modified_at?: string;
}

export interface CultureData {
  id_culture: number;
  nom_culture: string;
  description?: string;
  photo?: string;
  rendement_par_hectare?: number;
  prix_par_kg?: number;
  duree_cycle_jours?: number;
}

export interface ProjectCulture {
  id_projet_culture?: number;
  id_projet: number;
  id_culture: number;
  surface_ha?: number;
  rendement_total?: number;
  ca_total?: number;
  created_at?: string;
  modified_at?: string;
  culture?: Culture;
}
