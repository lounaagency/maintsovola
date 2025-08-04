
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeChannels } from "./useRealtimeChannels";

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
  
  // Setup real-time subscription using centralized channel manager
  useRealtimeChannels({
    userId: userId || '',
    channelType: 'messages',
    configs: userId ? [
      {
        table: 'message',
        event: 'INSERT',
        filter: `id_destinataire=eq.${userId}`,
        callback: fetchUnreadCount
      },
      {
        table: 'message', 
        event: 'UPDATE',
        filter: `id_destinataire=eq.${userId}`,
        callback: fetchUnreadCount
      }
    ] : []
  });
  
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId, fetchUnreadCount]);
  
  return { unreadCount, fetchUnreadCount, decrementCount };
};
