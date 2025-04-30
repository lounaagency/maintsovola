
import { Storage } from '@capacitor/storage';
import { Network } from '@capacitor/network';
import { supabase } from "@/integrations/supabase/client";

type SyncItem = {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
};

export class OfflineService {
  private static instance: OfflineService;
  private networkStatus: boolean = true;
  private syncQueue: SyncItem[] = [];
  private listeners: Array<(status: boolean) => void> = [];

  private constructor() {
    this.initialize();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initialize() {
    // Load any existing sync queue from storage
    await this.loadSyncQueue();
    
    // Check initial network status
    const status = await Network.getStatus();
    this.networkStatus = status.connected;
    
    // Listen for network status changes
    Network.addListener('networkStatusChange', (status) => {
      const wasOffline = !this.networkStatus;
      this.networkStatus = status.connected;
      
      // Notify listeners
      this.notifyListeners();
      
      // Try to sync if we're back online
      if (wasOffline && status.connected) {
        this.synchronize();
      }
    });
  }

  public addNetworkStatusListener(listener: (status: boolean) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.networkStatus);
    
    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.networkStatus));
  }

  public isOnline(): boolean {
    return this.networkStatus;
  }

  public async queueOperation(table: string, operation: 'insert' | 'update' | 'delete', data: any): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: SyncItem = {
      id,
      table,
      operation,
      data,
      timestamp: Date.now()
    };
    
    this.syncQueue.push(item);
    await this.saveSyncQueue();
    
    // If online, try to sync immediately
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

  public async synchronize(): Promise<boolean> {
    if (!this.networkStatus || this.syncQueue.length === 0) {
      return false;
    }

    const itemsToSync = [...this.syncQueue];
    const successfulSyncs: string[] = [];

    for (const item of itemsToSync) {
      try {
        switch (item.operation) {
          case 'insert':
            await supabase.from(item.table).insert(item.data);
            break;
          case 'update':
            await supabase.from(item.table).update(item.data).eq('id', item.data.id);
            break;
          case 'delete':
            await supabase.from(item.table).delete().eq('id', item.data.id);
            break;
        }
        // Mark as successfully synced
        successfulSyncs.push(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    // Remove successful syncs from the queue
    if (successfulSyncs.length > 0) {
      this.syncQueue = this.syncQueue.filter(item => !successfulSyncs.includes(item.id));
      await this.saveSyncQueue();
    }

    return successfulSyncs.length > 0;
  }

  public async cacheData(key: string, data: any): Promise<void> {
    try {
      await Storage.set({
        key: `cache_${key}`,
        value: JSON.stringify({
          data,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  public async getCachedData<T>(key: string, maxAge?: number): Promise<{ data: T | null, isFresh: boolean }> {
    try {
      const { value } = await Storage.get({ key: `cache_${key}` });
      
      if (!value) {
        return { data: null, isFresh: false };
      }
      
      const cachedItem = JSON.parse(value);
      const now = Date.now();
      const isFresh = !maxAge || (now - cachedItem.timestamp < maxAge);
      
      return {
        data: cachedItem.data as T,
        isFresh
      };
    } catch (error) {
      console.error('Error getting cached data:', error);
      return { data: null, isFresh: false };
    }
  }

  public async clearCache(): Promise<void> {
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
