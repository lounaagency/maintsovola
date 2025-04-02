
// Types pour le profil utilisateur
export interface UserProfile {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
  email: string;
  photo_profil?: string;
  photo_couverture?: string;
  adresse?: string;
  bio?: string;
  role?: string;
  id_role?: number;
  nom_role?: string;
  telephone?: string;
}

export interface UserTelephone {
  id_telephone: number;
  id_utilisateur: string;
  numero: string;
  is_primary: boolean;
  // Ajout des nouveaux champs requis pour la compatibilité
  type?: "principal" | "whatsapp" | "mobile_banking" | "autre";
  est_whatsapp?: boolean;
  est_mobile_banking?: boolean;
  created_at?: string;
  modified_at?: string;
}

export interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string; // Ajout de la prop className manquante
}
