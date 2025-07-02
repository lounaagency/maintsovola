import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { useWeatherAlerts } from '@/hooks/useWeatherAlerts';
import { useAuth } from '@/contexts/AuthContext';

export const WeatherAlertNotification: React.FC = () => {
  const { user } = useAuth();
  const { alerts, acknowledgeAlert, dismissAlert } = useWeatherAlerts(user?.id || '');

  const activeAlerts = alerts.filter(alert => alert.is_active);
  const criticalAlerts = activeAlerts.filter(alert => alert.priority === 'CRITICAL');

  if (activeAlerts.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {activeAlerts.length > 0 && (
            <Badge 
              variant={criticalAlerts.length > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center p-0"
            >
              {activeAlerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Alertes Météo Agricoles</h3>
          <p className="text-xs text-muted-foreground">
            Recommandations basées sur vos plannings et la météo
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <WeatherAlertBanner
            alerts={activeAlerts}
            onDismiss={dismissAlert}
            onAcknowledge={acknowledgeAlert}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};