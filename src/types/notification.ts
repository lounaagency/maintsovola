
export interface Notification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type: 'info' | 'validation' | 'alerte' | 'erreur' | 'assignment';
  entity_id?: number;
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
  entity_id?: string | number;  // Accept both string and number
  entity_type?: string;
  projet_id?: number;
}

export async function sendNotification(supabase, userId, recipients, title, message, type = "info", entityType = null, entityId = null) {
  const notifications = recipients.map(recipient => ({
      id_expediteur: userId,
      id_destinataire: recipient.id_utilisateur,
      titre: title,
      message: message,
      type: type,
      entity_type: entityType,
      entity_id: entityId
  }));

  const { error } = await supabase.from('notification').insert(notifications);
  if (error) {
      console.error("Erreur lors de l'envoi de la notification:", error.message);
  }
}
