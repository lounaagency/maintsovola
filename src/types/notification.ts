
export interface Notification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: 'info' | 'validation' | 'alerte' | 'erreur';
  entity_id?: string;
  entity_type?: 'terrain' | 'projet' | 'jalon' | 'investissement';
  projet_id?: number;
}
