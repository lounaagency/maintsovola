
import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from '@/types/notification';

interface GroupedNotificationData {
  senderId: string;
  recipientId: string;
  entityType: 'projet' | 'terrain' | 'jalon' | 'commentaire';
  entityId: number;
  action: 'like' | 'comment';
  projetId?: number;
}

// Fonction pour obtenir le nom complet d'un utilisateur
async function getUserName(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('utilisateur')
      .select('nom, prenoms')
      .eq('id_utilisateur', userId)
      .single();
    
    if (error) throw error;
    return data ? `${data.nom} ${data.prenoms || ''}`.trim() : 'Quelqu\'un';
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Quelqu\'un';
  }
}

// Fonction pour formater le message de notification groupée
function formatGroupedMessage(
  userNames: string[], 
  totalCount: number, 
  action: 'like' | 'comment',
  entityType: 'projet' | 'terrain' | 'jalon' | 'commentaire',
  entityName?: string
): { title: string; message: string } {
  const actionText = action === 'like' ? 'aimé' : 'commenté';
  let entityText = '';
  
  switch (entityType) {
    case 'projet':
      entityText = 'votre projet';
      break;
    case 'terrain':
      entityText = 'votre terrain';
      break;
    case 'jalon':
      entityText = 'votre jalon';
      break;
    case 'commentaire':
      entityText = 'votre commentaire';
      break;
    default:
      entityText = 'votre contenu';
  }
  
  let title: string;
  let message: string;
  
  if (totalCount === 1) {
    title = `Nouveau ${action === 'like' ? 'j\'aime' : 'commentaire'}`;
    message = `${userNames[0]} a ${actionText} ${entityText}${entityName ? ` "${entityName}"` : ''}`;
  } else if (totalCount === 2) {
    title = `${totalCount} ${action === 'like' ? 'j\'aimes' : 'commentaires'}`;
    message = `${userNames[0]} et ${userNames[1]} ont ${actionText} ${entityText}${entityName ? ` "${entityName}"` : ''}`;
  } else {
    const othersCount = totalCount - 1;
    title = `${totalCount} ${action === 'like' ? 'j\'aimes' : 'commentaires'}`;
    message = `${userNames[0]} et ${othersCount} autre${othersCount > 1 ? 's' : ''} ${othersCount > 1 ? 'personnes ont' : 'personne a'} ${actionText} ${entityText}${entityName ? ` "${entityName}"` : ''}`;
  }
  
  return { title, message };
}

// Fonction principale pour envoyer une notification groupée
export async function sendGroupedNotification(data: GroupedNotificationData): Promise<void> {
  const { senderId, recipientId, entityType, entityId, action, projetId } = data;
  
  // Éviter l'auto-notification
  if (senderId === recipientId) return;
  
  try {
    // Chercher les notifications similaires dans les dernières 24 heures
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notification')
      .select('*')
      .eq('id_destinataire', recipientId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('type', action === 'like' ? 'info' : 'info')
      .gte('date_creation', twentyFourHoursAgo)
      .order('date_creation', { ascending: false });
    
    if (fetchError) throw fetchError;
    
    // Trouver une notification existante pour ce type d'action
    const existingNotification = existingNotifications?.find(notif => 
      notif.message.includes(action === 'like' ? 'aimé' : 'commenté')
    );
    
    if (existingNotification) {
      // Mettre à jour la notification existante
      await updateGroupedNotification(existingNotification, senderId, action, entityType, entityId);
    } else {
      // Créer une nouvelle notification
      await createNewGroupedNotification(data);
    }
  } catch (error) {
    console.error('Error in sendGroupedNotification:', error);
  }
}

// Fonction pour mettre à jour une notification existante
async function updateGroupedNotification(
  existingNotification: any,
  newSenderId: string,
  action: 'like' | 'comment',
  entityType: 'projet' | 'terrain' | 'jalon' | 'commentaire',
  entityId: number
): Promise<void> {
  try {
    // Extraire les IDs des utilisateurs existants du message
    const existingSenderIds = extractSenderIds(existingNotification.message, existingNotification.id_expediteur);
    
    // Ajouter le nouveau sender s'il n'est pas déjà dans la liste
    if (!existingSenderIds.includes(newSenderId)) {
      existingSenderIds.push(newSenderId);
    }
    
    // Obtenir les noms des utilisateurs
    const userNames = await Promise.all(
      existingSenderIds.slice(0, 2).map(id => getUserName(id))
    );
    
    // Obtenir le nom de l'entité si c'est un projet
    let entityName = '';
    if (entityType === 'projet') {
      const { data: projectData } = await supabase
        .from('projet')
        .select('titre')
        .eq('id_projet', entityId)
        .single();
      entityName = projectData?.titre || '';
    }
    
    // Formater le nouveau message
    const { title, message } = formatGroupedMessage(
      userNames,
      existingSenderIds.length,
      action,
      entityType,
      entityName
    );
    
    // Mettre à jour la notification
    const { error } = await supabase
      .from('notification')
      .update({
        titre: title,
        message: message,
        lu: false, // Marquer comme non lu pour attirer l'attention
        date_creation: new Date().toISOString() // Mettre à jour la date
      })
      .eq('id_notification', existingNotification.id_notification);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating grouped notification:', error);
  }
}

// Fonction pour créer une nouvelle notification groupée
async function createNewGroupedNotification(data: GroupedNotificationData): Promise<void> {
  const { senderId, recipientId, entityType, entityId, action, projetId } = data;
  
  try {
    // Obtenir le nom de l'utilisateur
    const senderName = await getUserName(senderId);
    
    // Obtenir le nom de l'entité si c'est un projet
    let entityName = '';
    if (entityType === 'projet') {
      const { data: projectData } = await supabase
        .from('projet')
        .select('titre')
        .eq('id_projet', entityId)
        .single();
      entityName = projectData?.titre || '';
    }
    
    // Formater le message pour une seule personne
    const { title, message } = formatGroupedMessage(
      [senderName],
      1,
      action,
      entityType,
      entityName
    );
    
    // Créer la notification
    await sendNotification(
      supabase,
      senderId,
      [{ id_utilisateur: recipientId }],
      title,
      message,
      'info',
      entityType,
      entityId,
      projetId
    );
  } catch (error) {
    console.error('Error creating new grouped notification:', error);
  }
}

// Fonction utilitaire pour extraire les IDs des expéditeurs d'un message existant
function extractSenderIds(message: string, originalSenderId: string): string[] {
  // Pour l'instant, on commence simple avec juste l'expéditeur original
  // Dans une version plus avancée, on pourrait stocker les IDs dans un champ séparé
  return [originalSenderId];
}
