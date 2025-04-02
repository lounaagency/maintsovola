
import { supabase } from '@/integrations/supabase/client';
import { Conversation, ConversationMessage } from '@/types/message';

export const getConversations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversation')
      .select('*')
      .or(`id_utilisateur1.eq.${userId},id_utilisateur2.eq.${userId}`)
      .order('derniere_activite', { ascending: false });

    if (error) throw error;
    return data as Conversation[];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const getMessages = async (conversationId: number) => {
  try {
    const { data, error } = await supabase
      .from('message')
      .select('*')
      .eq('id_conversation', conversationId)
      .order('date_envoi', { ascending: true });

    if (error) throw error;
    return data as ConversationMessage[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (
  conversationId: number, 
  senderId: string, 
  recipientId: string, 
  content: string
) => {
  try {
    const { error } = await supabase.from('message').insert({
      id_conversation: conversationId,
      id_expediteur: senderId,
      id_destinataire: recipientId,
      contenu: content,
      lu: false
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

export const createConversation = async (userId: string, otherUserId: string) => {
  try {
    // Check if conversation already exists
    const { data: existingConv, error: checkError } = await supabase
      .from('conversation')
      .select('*')
      .or(`and(id_utilisateur1.eq.${userId},id_utilisateur2.eq.${otherUserId}),and(id_utilisateur1.eq.${otherUserId},id_utilisateur2.eq.${userId})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingConv) {
      return existingConv as Conversation;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversation')
      .insert({
        id_utilisateur1: userId,
        id_utilisateur2: otherUserId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

export const markConversationAsRead = async (conversationId: number, userId: string) => {
  try {
    const { error } = await supabase
      .from('message')
      .update({ lu: true })
      .eq('id_conversation', conversationId)
      .eq('id_destinataire', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return false;
  }
};

export const getUnreadMessagesCount = async (userId: string) => {
  try {
    const { data, error, count } = await supabase
      .from('message')
      .select('*', { count: 'exact' })
      .eq('id_destinataire', userId)
      .eq('lu', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    return 0;
  }
};

export const markMessagesAsRead = async (conversationId: number, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('message')
      .update({ lu: true })
      .eq('id_conversation', conversationId)
      .eq('id_destinataire', userId);

    if (error) throw error;

    console.log(`Messages marked as read for conversation ${conversationId}`);
  } catch (err) {
    console.error("Error when updating messages:", err);
  }
};
