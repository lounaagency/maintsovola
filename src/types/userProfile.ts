
export interface UserProfile {
  id_utilisateur: string;
  id?: string; // Pour la compatibilité avec le code existant
  nom: string;
  prenoms?: string;
  email?: string;
  photo_profil?: string;
  photo_couverture?: string;
  adresse?: string;
  bio?: string;
  id_role?: number;
  nom_role?: string;
  telephones?: UserTelephone[];
  is_investor?: boolean;
  is_farming_owner?: boolean;
  // Pour la compatibilité avec Messages.tsx
  name?: string; // Alias pour nom + prenoms
  photo?: string; // Alias pour photo_profil
  refreshProfile?: () => Promise<void>;
}

export interface UserTelephone {
  id_telephone?: number;
  id_utilisateur: string;
  numero: string;
  type: "principal" | "whatsapp" | "mobile_banking" | "autre" | string; // Added string for compatibility
  est_whatsapp: boolean;
  est_mobile_banking: boolean;
  created_at?: string;
  modified_at?: string;
}
