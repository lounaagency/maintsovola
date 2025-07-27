import { useEffect, useRef, useCallback } from 'react';
import { channelManager } from '@/utils/ChannelManager';
import { getPlatform } from '@/utils/deviceDetection';

interface ChannelConfig {
  table: string;
  event: string;
  filter?: string;
  callback: (payload: any) => void;
}

interface UseRealtimeChannelsProps {
  userId: string;
  channelType: 'conversations' | 'messages';
  conversationId?: number;
  configs: ChannelConfig[];
}

export const useRealtimeChannels = ({
  userId,
  channelType,
  conversationId,
  configs
}: UseRealtimeChannelsProps) => {
  const isMountedRef = useRef(true);
  const currentChannelKeyRef = useRef<string | null>(null);
  const callbacksRef = useRef(configs);

  // Update callbacks ref when configs change
  callbacksRef.current = configs;

  // Create stable channel key
  const createChannelKey = useCallback(() => {
    const channelId = channelType === 'conversations' ? userId : conversationId;
    if (!channelId) return null;
    
    const platform = getPlatform();
    return `${platform}-${channelType}-${channelId}`;
  }, [userId, channelType, conversationId]);

  // Stable setup function
  const setupChannel = useCallback(async () => {
    if (!userId || !isMountedRef.current) return;

    const channelKey = createChannelKey();
    if (!channelKey) return;

    // Don't recreate if same channel key
    if (currentChannelKeyRef.current === channelKey) return;

    // Clean up previous channel
    if (currentChannelKeyRef.current) {
      channelManager.removeChannel(currentChannelKeyRef.current);
    }

    try {
      // Create configs with stable callbacks
      const stableConfigs = callbacksRef.current.map(config => ({
        ...config,
        callback: (payload: any) => {
          if (isMountedRef.current) {
            config.callback(payload);
          }
        }
      }));

      const channel = await channelManager.getOrCreateChannel(channelKey, stableConfigs);
      
      if (channel && isMountedRef.current) {
        currentChannelKeyRef.current = channelKey;
      }
    } catch (error) {
      console.error(`Error setting up ${channelType} channel:`, error);
    }
  }, [userId, channelType, conversationId, createChannelKey]);

  // Setup effect with debouncing
  useEffect(() => {
    isMountedRef.current = true;
    
    const timeoutId = setTimeout(setupChannel, 100);

    return () => {
      clearTimeout(timeoutId);
      isMountedRef.current = false;
      
      if (currentChannelKeyRef.current) {
        channelManager.removeChannel(currentChannelKeyRef.current);
        currentChannelKeyRef.current = null;
      }
    };
  }, [setupChannel]);

  return {};
};