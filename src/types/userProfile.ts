
export interface UserProfile {
  id_utilisateur: string;
  id?: string; // For compatibility with existing code
  nom: string;
  prenoms?: string;
  email?: string;
  photo_profil?: string;
  photo_couverture?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
  id_role?: number;
  nom_role?: string;
  telephones?: UserTelephone[];
  is_investor?: boolean;
  is_farming_owner?: boolean;
  // For compatibility with Messages.tsx
  name?: string; // Alias for nom + prenoms
  photo?: string; // Alias for photo_profil
}

export interface UserTelephone {
  id_telephone?: number;
  id_utilisateur: string;
  numero: string;
  type: "principal" | "whatsapp" | "mobile_banking" | "autre";
  est_whatsapp: boolean;
  est_mobile_banking: boolean;
  created_at?: string;
  modified_at?: string;
}
