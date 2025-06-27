export interface AssignedParcel {
  id_projet: number;
  nom_projet: string;
  superficie: number;
  localisation: string;
  date_assignation: string;
  statut: string;
  technicien_assigné: string;
  cultures?: {
    nom_culture: string;
  }[];
  geom?: any; // Geometry data for weather coordinates
  id_district?: number;
  id_commune?: number;
  id_region?: number;
}

export interface WeeklyTask {
  id_tache: number;
  id_projet: number;
  titre_projet: string;
  description: string;
  date_prevue: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: 'a_faire' | 'en_cours' | 'fait' | 'retard' | 'bloque';
  type_intervention: string;
  duree_estimee?: number;
}

export interface InterventionReport {
  id_rapport: number;
  id_projet: number;
  id_technicien: string;
  date_intervention: string;
  type_intervention: string;
  description: string;
  observations: string;
  anomalies?: string;
  photos?: string[];
  signature_electronique?: string;
  statut: 'brouillon' | 'soumis' | 'valide';
}

export interface TechnicalResource {
  id_ressource: number;
  titre: string;
  type: 'fiche_technique' | 'guide_pratique' | 'procedure' | 'formation';
  culture?: string;
  contenu: string;
  fichier_url?: string;
  date_creation: string;
  tags: string[];
}

export interface PaymentMilestone {
  id_jalon: number;
  id_projet: number;
  nom_jalon: string;
  montant: number;
  date_prevue: string;
  date_reelle?: string;
  statut: 'en_attente' | 'valide' | 'paye';
  description: string;
}
