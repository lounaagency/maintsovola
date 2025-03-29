
export interface UserProfile {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
  email: string;
  photo_profil?: string;
  id_role?: number;
  nom_role?: string;
}
