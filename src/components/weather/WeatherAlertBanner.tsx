import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cloud, Wind, X, CheckCircle } from 'lucide-react';
import { WeatherAlertData } from '@/hooks/useWeatherAlerts';

interface WeatherAlertBannerProps {
  alerts: WeatherAlertData[];
  onDismiss: (alertId: string) => void;
  onAcknowledge: (alertId: string) => void;
}

const getAlertIcon = (alertType: string) => {
  switch (alertType) {
    case 'URGENT':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'POSTPONE':
      return <Cloud className="h-4 w-4 text-warning" />;
    case 'CANCEL':
      return <Wind className="h-4 w-4 text-muted-foreground" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getAlertVariant = (alertType: string) => {
  switch (alertType) {
    case 'URGENT':
      return 'destructive';
    case 'WARNING':
    case 'POSTPONE':
      return 'default';
    case 'CANCEL':
      return 'secondary';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-destructive';
    case 'HIGH':
      return 'bg-warning';
    case 'MEDIUM':
      return 'bg-primary';
    case 'LOW':
      return 'bg-muted';
    default:
      return 'bg-muted';
  }
};

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  alerts,
  onDismiss,
  onAcknowledge,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 p-4 bg-background/95 backdrop-blur border-b">
      {alerts.slice(0, 3).map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.type) as any} className="relative">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(alert.priority)} text-white border-none`}
                >
                  {alert.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {alert.message}
              </p>
              
              <div className="bg-muted/50 p-2 rounded text-xs mb-2">
                <span className="font-medium">💡 Recommandation:</span> {alert.recommendation}
              </div>
              
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Météo:</span> {alert.weather_reason} • 
                <span className="font-medium"> Culture:</span> {alert.culture_type} • 
                <span className="font-medium"> Date:</span> {new Date(alert.date_previsionnelle).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
                className="h-8 px-2"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                OK
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.id)}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Alert>
      ))}
      
      {alerts.length > 3 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            +{alerts.length - 3} autres alertes
          </Badge>
        </div>
      )}
    </div>
  );
};