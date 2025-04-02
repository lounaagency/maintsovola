
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessagesCount = (userId?: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!userId) return;
    
    // Fonction pour récupérer le nombre de messages non lus
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('message')
        .select('*', { count: 'exact', head: true })
        .eq('id_destinataire', userId)
        .eq('lu', false);
      
      if (error) {
        console.error("Error counting unread messages:", error);
        return;
      }
      
      setUnreadCount(count || 0);
    };
    
    // Appel initial
    fetchUnreadCount();
    
    // Configurer l'écoute en temps réel des nouveaux messages
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message',
        filter: `id_destinataire=eq.${userId}`
      }, fetchUnreadCount)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'message',
        filter: `id_destinataire=eq.${userId}`
      }, fetchUnreadCount)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  return unreadCount;
};
