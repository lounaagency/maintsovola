
export interface Culture {
  id_culture: number;
  nom_culture: string;
  rendement_ha?: number; // rendement par hectare en tonnes
  cout_exploitation_ha?: number; // coût d'exploitation par hectare
  prix_tonne?: number; // prix par tonne
  fiche_technique?: string;
}

export interface ProjetCulture {
  id_projet_culture?: number;
  id_projet?: number;
  id_culture: number;
  culture?: Culture;
  cout_exploitation_previsionnel?: number;
  cout_exploitation_reel?: number;
  rendement_previsionnel?: number;
  rendement_reel?: number;
  date_debut_previsionnelle?: string;
  date_debut_reelle?: string;
}

// Add the missing CultureData type
export interface CultureData {
  id_culture: number;
  nom_culture: string;
  rendement_ha?: number;
  cout_exploitation_ha?: number;
  prix_tonne?: number;
  fiche_technique?: string;
  created_at?: string;
  modified_at?: string;
  created_by?: string;
}
