
export interface UserProfile {
  id: string;
  id_utilisateur: string;
  nom: string;
  prenoms: string;
  email: string;
  photo_profil: string;
  photo_couverture?: string;
  adresse: string;
  bio: string;
  nom_role: string;
  id_role?: number;
  telephones?: UserTelephone[];
}

export interface UserTelephone {
  id_telephone: number;
  id_utilisateur: string;
  numero: string;
  type: 'principal' | 'whatsapp' | 'mobile_banking' | 'autre';
  est_whatsapp: boolean;
  est_mobile_banking: boolean;
  created_at?: string;
  modified_at?: string;
}
