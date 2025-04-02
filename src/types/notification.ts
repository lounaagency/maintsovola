
export interface Notification {
  id_notification: number;
  id_expediteur?: string; // UUID
  id_destinataire: string; // UUID
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: 'info' | 'validation' | 'alerte' | 'erreur' | 'assignment';
  entity_id?: string; // Changed from number to string to handle UUID values
  entity_type?: 'terrain' | 'projet' | 'jalon' | 'investissement';
  projet_id?: number;
}

// Interface for the database notifications
export interface DatabaseNotification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: string;
  entity_id?: string; // Changed from number to string to handle both numeric IDs and UUIDs
  entity_type?: string;
  projet_id?: number;
}
