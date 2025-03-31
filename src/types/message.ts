
export interface Conversation {
  id_conversation: number;
  id_utilisateur1: string;
  id_utilisateur2: string;
  derniere_activite: string;
  other_user?: {
    id_utilisateur: string;
    nom: string;
    prenoms: string | null;
    photo_profil: string | null;
  };
}

export interface Message {
  id_message: number;
  id_conversation: number;
  id_expediteur: string;
  id_destinataire: string;
  contenu: string;
  date_envoi: string;
  lu: boolean;
}

export interface ConversationMessage extends Message {
  sender?: {
    id_utilisateur: string;
    nom: string;
    prenoms: string | null;
    photo_profil: string | null;
  };
}

export interface Recipient {
  id: string;
  name: string;
  photo?: string;
}
