
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  entity_id?: string;
  entity_type?: 'terrain' | 'projet' | 'jalon' | 'investissement';
}

export interface DatabaseNotification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type?: string;
  entity_type?: string;
  entity_id?: string;
  projet_id?: number;
}
