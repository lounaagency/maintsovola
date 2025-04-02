
export interface Conversation {
  id_conversation: number; 
  user1_id: string;
  user2_id: string;
  created_at: string;
  derniere_activite: string;
  // Mapping fields for API compatibility
  id_utilisateur1: string;
  id_utilisateur2: string;
}

export interface ConversationMessage {
  id_message: number;
  id_expediteur: string;
  id_destinataire: string;
  contenu: string;
  date_envoi: string;
  lu: boolean;
  created_at: string;
  modified_at?: string;
  id_conversation?: number;
}

export interface UserTelephone {
  id_telephone: number;
  id_utilisateur: string;
  numero: string;
  type: "principal" | "whatsapp" | "mobile_banking" | "autre";
  est_mobile_banking: boolean;
  est_whatsapp: boolean;
  created_at: string;
  modified_at: string;
}
