import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
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
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const isMountedRef = useRef(true);

  // Generate platform-specific channel name
  const generateChannelName = useCallback((type: string, id: string | number) => {
    const platform = getPlatform();
    const timestamp = Date.now();
    return `${platform}-${type}-${id}-${timestamp}`;
  }, []);

  // Cleanup all channels
  const cleanupChannels = useCallback(() => {
    if (channelsRef.current.length > 0) {
      console.log(`Cleaning up ${channelsRef.current.length} channels`);
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      });
      channelsRef.current = [];
    }
  }, []);

  // Setup channels
  const setupChannels = useCallback(async () => {
    if (!userId || !isMountedRef.current) return;

    // Clean up existing channels first
    cleanupChannels();

    try {
      const channelId = channelType === 'conversations' ? userId : conversationId;
      if (!channelId) return;

      const channelName = generateChannelName(channelType, channelId);
      const channel = supabase.channel(channelName);

      // Add all configured listeners
      configs.forEach(config => {
        channel.on('postgres_changes', {
          event: config.event as any,
          schema: 'public',
          table: config.table,
          filter: config.filter
        }, (payload) => {
          if (isMountedRef.current) {
            config.callback(payload);
          }
        });
      });

      // Subscribe to the channel
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          console.log(`Successfully subscribed to ${channelType} channel:`, channelName);
          channelsRef.current.push(channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${channelType} channel:`, channelName);
        }
      });

    } catch (error) {
      console.error(`Error setting up ${channelType} channels:`, error);
    }
  }, [userId, channelType, conversationId, configs, generateChannelName, cleanupChannels]);

  // Effect to setup and cleanup channels
  useEffect(() => {
    isMountedRef.current = true;
    setupChannels();

    return () => {
      isMountedRef.current = false;
      cleanupChannels();
    };
  }, [setupChannels, cleanupChannels]);

  return {
    cleanupChannels,
    setupChannels
  };
};