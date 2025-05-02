
import { useState, useEffect } from 'react';
import { offlineService } from '@/services/OfflineService';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(offlineService.isOnline());

  useEffect(() => {
    const unsubscribe = offlineService.addNetworkStatusListener((status) => {
      setIsOnline(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline,
    cacheData: offlineService.cacheData.bind(offlineService),
    getCachedData: offlineService.getCachedData.bind(offlineService),
    clearCache: offlineService.clearCache.bind(offlineService),
    queueOperation: offlineService.queueOperation.bind(offlineService),
    synchronize: offlineService.synchronize.bind(offlineService),
  };
}
