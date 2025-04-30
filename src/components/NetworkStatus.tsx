
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';
import { offlineService } from '@/services/OfflineService';
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  className?: string;
  showSyncButton?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className,
  showSyncButton = true
}) => {
  const { isOnline } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  
  // Update queue size periodically
  useEffect(() => {
    const checkQueueSize = async () => {
      // This is a placeholder since we don't expose the queue directly
      // In a real implementation, you'd get this from the offline service
      setQueueSize((offlineService as any).syncQueue?.length || 0);
    };
    
    checkQueueSize();
    const interval = setInterval(checkQueueSize, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await offlineService.synchronize();
      setQueueSize(0);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-amber-500" />
      )}
      
      <span className={isOnline ? "text-green-600" : "text-amber-600"}>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
      
      {(queueSize > 0 && showSyncButton) && (
        <button
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          className="flex items-center ml-2 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          title="Synchroniser les données"
        >
          <RefreshCw className={cn("w-3 h-3 mr-1", isSyncing && "animate-spin")} />
          {queueSize} en attente
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;
