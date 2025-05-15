
export interface UserTelephone {
  id_telephone: number;
  id_utilisateur: string;
  numero: string;
  type: "principal" | "whatsapp" | "mvola" | "orange_money" | "airtel_money" | "autre" | "mobile_banking";
  est_whatsapp: boolean;
  est_mobile_banking: boolean;
}

export interface UserProfile {
  id_utilisateur: string;
  id: string;
  nom: string;
  prenoms?: string;
  email: string;
  photo_profil?: string;
  photo_couverture?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
  id_role?: number;
  nom_role?: string;
  telephones?: UserTelephone[];
}
