
export interface Message {
  id_message?: number;
  id_expediteur: string;
  id_destinataire: string;
  contenu: string;
  date_envoi?: string;
  lu?: boolean;
  created_at?: string;
}

export interface Conversation {
  id_conversation?: number;
  id_utilisateur1: string;
  id_utilisateur2: string;
  derniere_activite?: string;
  created_at?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
}

// Frontend conversation representation
export interface ConversationMessage {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}
