import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeChannels } from './useRealtimeChannels';

export interface UserPresence {
  id: string;
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
}

export const useUserPresence = (userId?: string) => {
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});
  
  const updateUserPresence = useCallback((userId: string, updates: Partial<UserPresence>) => {
    setUserPresences(prev => ({
      ...prev,
      [userId]: { ...prev[userId], id: userId, ...updates }
    }));
  }, []);

  const setTyping = useCallback(async (conversationId: number, isTyping: boolean) => {
    if (!userId) return;
    
    // You could implement typing indicators through a separate table or real-time presence
    // For now, we'll use local state updates
    updateUserPresence(userId, { isTyping });
    
    // Clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        updateUserPresence(userId, { isTyping: false });
      }, 3000);
    }
  }, [userId, updateUserPresence]);

  const setOnline = useCallback(async (isOnline: boolean) => {
    if (!userId) return;
    
    updateUserPresence(userId, { 
      isOnline,
      lastSeen: isOnline ? undefined : new Date().toISOString()
    });
  }, [userId, updateUserPresence]);

  useEffect(() => {
    if (!userId) return;
    
    // Set user as online when component mounts
    setOnline(true);
    
    // Set user as offline when component unmounts or page unloads
    const handleBeforeUnload = () => setOnline(false);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      setOnline(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, setOnline]);

  const getUserPresence = useCallback((userId: string): UserPresence => {
    return userPresences[userId] || { 
      id: userId, 
      isOnline: false,
      isTyping: false 
    };
  }, [userPresences]);

  return {
    userPresences,
    updateUserPresence,
    setTyping,
    setOnline,
    getUserPresence
  };
};