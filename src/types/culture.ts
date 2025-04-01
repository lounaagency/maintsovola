
export interface Culture {
  id_culture: number;
  nom_culture: string;
  description?: string;
  icone?: string;
  rendement_moyen_tonne_par_ha?: number;
  prix_moyen_par_kg?: number;
  cout_production_par_ha?: number;
  duree_cycle_jours?: number;
}

export interface ProjetCulture {
  id_projet_culture?: number;
  id_projet?: number;
  id_culture?: number;
  surface_ha?: number;
  rendement_prevu_tonne?: number;
  prix_vente_prevu_par_kg?: number;
  cout_production_prevu?: number;
  culture?: Culture;
}

// Ajout pour résoudre l'erreur d'importation
export interface CultureData {
  id_culture: number;
  nom_culture: string;
  description?: string;
  rendement_ha?: number;
  cout_exploitation_ha?: number;
  prix_tonne?: number;
}
