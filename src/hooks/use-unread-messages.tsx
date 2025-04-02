
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessagesCount = (userId?: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Function to fetch the unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    
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
  }, [userId]);
  
  // Function to update count when messages are marked as read
  const decrementCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);
  
  useEffect(() => {
    if (!userId) return;
    
    // Initial call
    fetchUnreadCount();
    
    // Setup real-time subscription for new messages
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
        filter: `id_destinataire=eq.${userId} AND lu=eq.true`
      }, fetchUnreadCount)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);
  
  return { unreadCount, fetchUnreadCount, decrementCount };
};
