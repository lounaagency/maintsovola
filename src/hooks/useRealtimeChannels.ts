import { useEffect, useRef } from 'react';
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
  const isSubscribingRef = useRef(false);

  // Effect to setup and cleanup channels
  useEffect(() => {
    const setupChannels = async () => {
      if (!userId || !isMountedRef.current || isSubscribingRef.current) return;
      
      // Clean up existing channels first
      if (channelsRef.current.length > 0) {
        channelsRef.current.forEach(channel => {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('Error removing channel:', error);
          }
        });
        channelsRef.current = [];
      }

      try {
        isSubscribingRef.current = true;
        const channelId = channelType === 'conversations' ? userId : conversationId;
        if (!channelId) return;

        const platform = getPlatform();
        const channelName = `${platform}-${channelType}-${channelId}`;
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
          isSubscribingRef.current = false;
        });

      } catch (error) {
        console.error(`Error setting up ${channelType} channels:`, error);
        isSubscribingRef.current = false;
      }
    };

    isMountedRef.current = true;
    setupChannels();

    return () => {
      isMountedRef.current = false;
      isSubscribingRef.current = false;
      if (channelsRef.current.length > 0) {
        channelsRef.current.forEach(channel => {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('Error removing channel:', error);
          }
        });
        channelsRef.current = [];
      }
    };
  }, [userId, channelType, conversationId]);

  return {};
};