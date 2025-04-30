
import { useState, useEffect } from 'react';
import { offlineService } from '@/services/OfflineService';
import { Toast } from '@capacitor/toast';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState<boolean>(offlineService.isOnline());
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Add listener for network status changes
    const removeListener = offlineService.addNetworkStatusListener((status) => {
      const previousStatus = isOnline;
      setIsOnline(status);
      
      // Show toast when going offline or back online
      if (previousStatus && !status) {
        setWasOffline(true);
        Toast.show({
          text: 'Vous êtes hors ligne. Les modifications seront synchronisées ultérieurement.',
          duration: 'long',
          position: 'bottom'
        });
      } else if (!previousStatus && status && wasOffline) {
        Toast.show({
          text: 'Vous êtes de nouveau en ligne. Synchronisation en cours...',
          duration: 'long',
          position: 'bottom'
        });
        
        // Attempt to synchronize
        offlineService.synchronize().then(synced => {
          if (synced) {
            Toast.show({
              text: 'Synchronisation terminée avec succès.',
              duration: 'short',
              position: 'bottom'
            });
          }
        });
      }
    });

    return () => {
      removeListener();
    };
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    wasOffline,
    synchronize: offlineService.synchronize.bind(offlineService),
    cacheData: offlineService.cacheData.bind(offlineService),
    getCachedData: offlineService.getCachedData.bind(offlineService)
  };
}
