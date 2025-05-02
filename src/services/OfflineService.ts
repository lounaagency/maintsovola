import { Capacitor } from '@capacitor/core';
import { supabase } from "@/integrations/supabase/client";

// Capacitor-safe fallback
const isNative = Capacitor.isNativePlatform();

const Storage = isNative
  ? require('@capacitor/storage').Storage
  : {
      get: async () => ({ value: null }),
      set: async () => {},
      remove: async () => {},
      keys: async () => ({ keys: [] })
    };

const Network = isNative
  ? require('@capacitor/network').Network
  : {
      getStatus: async () => ({ connected: true }),
      addListener: async (_event: string, _callback: any) => {}
    };

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

interface CachedItem {
  data: any;
  timestamp: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private networkStatus: boolean = true;
  private syncQueue: SyncQueueItem[] = [];
  private listeners: ((status: boolean) => void)[] = [];

  constructor() {
    this.initialize();
  }

  static getInstance() {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async initialize() {
    await this.loadSyncQueue();

    const status = await Network.getStatus();
    this.networkStatus = status.connected;

    Network.addListener('networkStatusChange', (status) => {
      const wasOffline = !this.networkStatus;
      this.networkStatus = status.connected;
      this.notifyListeners();
      if (wasOffline && status.connected) {
        this.synchronize();
      }
    });
  }

  addNetworkStatusListener(listener: (status: boolean) => void) {
    this.listeners.push(listener);
    listener(this.networkStatus);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.networkStatus));
  }

  isOnline() {
    return this.networkStatus;
  }

  async queueOperation(table: string, operation: 'insert' | 'update' | 'delete', data: any) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: SyncQueueItem = {
      id,
      table,
      operation,
      data,
      timestamp: Date.now()
    };

    this.syncQueue.push(item);
    await this.saveSyncQueue();

    if (this.networkStatus) {
      this.synchronize();
    }

    return id;
  }

  private async loadSyncQueue() {
    try {
      const { value } = await Storage.get({ key: 'offline_sync_queue' });
      if (value) {
        this.syncQueue = JSON.parse(value);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue() {
    try {
      await Storage.set({
        key: 'offline_sync_queue',
        value: JSON.stringify(this.syncQueue)
      });
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async synchronize() {
    if (!this.networkStatus || this.syncQueue.length === 0) {
      return false;
    }

    const itemsToSync = [...this.syncQueue];
    const successfulSyncs: string[] = [];

    for (const item of itemsToSync) {
      try {
        switch (item.operation) {
          case 'insert':
            await supabase.from(item.table as any).insert(item.data);
            break;
          case 'update':
            await supabase.from(item.table as any).update(item.data).eq('id', item.data.id);
            break;
          case 'delete':
            await supabase.from(item.table as any).delete().eq('id', item.data.id);
            break;
        }
        successfulSyncs.push(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    if (successfulSyncs.length > 0) {
      this.syncQueue = this.syncQueue.filter(item => !successfulSyncs.includes(item.id));
      await this.saveSyncQueue();
    }

    return successfulSyncs.length > 0;
  }

  async cacheData(key: string, data: any) {
    try {
      await Storage.set({
        key: `cache_${key}`,
        value: JSON.stringify({ data, timestamp: Date.now() })
      });
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData(key: string, maxAge?: number) {
    try {
      const { value } = await Storage.get({ key: `cache_${key}` });
      if (!value) {
        return { data: null, isFresh: false };
      }

      const cachedItem = JSON.parse(value) as CachedItem;
      const now = Date.now();
      const isFresh = !maxAge || (now - cachedItem.timestamp < maxAge);

      return {
        data: cachedItem.data,
        isFresh
      };
    } catch (error) {
      console.error('Error getting cached data:', error);
      return { data: null, isFresh: false };
    }
  }

  async clearCache() {
    try {
      const { keys } = await Storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      for (const key of cacheKeys) {
        await Storage.remove({ key });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export const offlineService = OfflineService.getInstance();
