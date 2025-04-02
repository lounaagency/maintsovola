
export interface DatabaseNotification {
  id_notification: number;
  id_expediteur?: string | null;
  id_destinataire: string;
  titre: string;
  message: string;
  type: 'info' | 'validation' | 'alerte' | 'erreur' | 'assignment';
  entity_type?: 'projet' | 'investissement' | 'jalon' | 'terrain' | string;
  entity_id?: string | number | null;
  projet_id?: number | null;
  lu: boolean;
  date_creation: string;
}

export interface Notification extends DatabaseNotification {
  // Additional client-side properties can be added here
}
