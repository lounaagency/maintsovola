import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelConfig {
  table: string;
  event: string;
  filter?: string;
  callback: (payload: any) => void;
}

class ChannelManager {
  private static instance: ChannelManager;
  private activeChannels = new Map<string, RealtimeChannel>();
  private channelStates = new Map<string, 'SUBSCRIBING' | 'SUBSCRIBED' | 'CLOSED'>();

  static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  async getOrCreateChannel(
    channelKey: string,
    configs: ChannelConfig[]
  ): Promise<RealtimeChannel | null> {
    // If channel exists and is active, return it
    const existingChannel = this.activeChannels.get(channelKey);
    const state = this.channelStates.get(channelKey);
    
    if (existingChannel && (state === 'SUBSCRIBED' || state === 'SUBSCRIBING')) {
      return existingChannel;
    }

    // Clean up any existing channel first
    if (existingChannel) {
      this.removeChannel(channelKey);
    }

    try {
      this.channelStates.set(channelKey, 'SUBSCRIBING');
      
      const channel = supabase.channel(channelKey);

      // Add all configured listeners
      configs.forEach(config => {
        channel.on('postgres_changes', {
          event: config.event as any,
          schema: 'public',
          table: config.table,
          filter: config.filter
        }, config.callback);
      });

      // Subscribe with timeout protection
      const subscribePromise = new Promise<RealtimeChannel>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Channel subscription timeout'));
        }, 10000);

        channel.subscribe((status) => {
          clearTimeout(timeout);
          
          if (status === 'SUBSCRIBED') {
            this.channelStates.set(channelKey, 'SUBSCRIBED');
            this.activeChannels.set(channelKey, channel);
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            this.channelStates.set(channelKey, 'CLOSED');
            reject(new Error(`Channel subscription error: ${channelKey}`));
          }
        });
      });

      return await subscribePromise;
    } catch (error) {
      console.error(`Error creating channel ${channelKey}:`, error);
      this.channelStates.set(channelKey, 'CLOSED');
      return null;
    }
  }

  removeChannel(channelKey: string): void {
    const channel = this.activeChannels.get(channelKey);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(`Error removing channel ${channelKey}:`, error);
      }
      this.activeChannels.delete(channelKey);
      this.channelStates.delete(channelKey);
    }
  }

  removeAllChannels(): void {
    for (const channelKey of this.activeChannels.keys()) {
      this.removeChannel(channelKey);
    }
  }

  getChannelState(channelKey: string): string | undefined {
    return this.channelStates.get(channelKey);
  }
}

export const channelManager = ChannelManager.getInstance();