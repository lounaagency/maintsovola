
export interface Conversation {
  id_conversation: number;
  id_utilisateur1: string; // UUID
  id_utilisateur2: string; // UUID
  derniere_activite: string;
  other_user?: {
    id_utilisateur: string; // UUID
    nom: string;
    prenoms: string | null;
    photo_profil: string | null;
  };
}

export interface Message {
  id_message: number;
  id_conversation: number;
  id_expediteur: string; // UUID
  id_destinataire: string; // UUID
  contenu: string;
  date_envoi: string;
  lu: boolean;
}

export interface ConversationMessage extends Message {
  sender?: {
    id_utilisateur: string; // UUID
    nom: string;
    prenoms: string | null;
    photo_profil: string | null;
  };
  // Additional fields for UI
  id?: string;
  user?: {
    id: string; // UUID
    name: string;
    photo_profil?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
  };
  lastMessage?: string; // Changed from object to string
  timestamp?: string;
  unread?: number; // Changed from boolean to number
}

export interface Recipient {
  id: string; // UUID
  name: string;
  photo_profil?: string;
}
