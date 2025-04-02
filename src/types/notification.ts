
export interface Notification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: 'info' | 'validation' | 'alerte' | 'erreur' | 'assignment';
  entity_id?: string;
  entity_type?: 'terrain' | 'projet' | 'jalon' | 'investissement';
  projet_id?: number;
}

// Update DatabaseNotification to match what's coming from the database
export interface DatabaseNotification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: string;
  entity_id?: string | number;  // Accept both string and number for entity_id
  entity_type?: string;
  projet_id?: number;
}
