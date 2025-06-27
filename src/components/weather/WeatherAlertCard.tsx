
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, X, Calendar, MapPin } from 'lucide-react';
import { WeatherAlert } from '@/types/weather';
import { formatDate } from '@/lib/utils';

interface WeatherAlertCardProps {
  alert: WeatherAlert;
  onDismiss: (alertId: string) => void;
  isDismissing?: boolean;
}

const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({ alert, onDismiss, isDismissing = false }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.type) {
      case 'danger':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={colors[alert.priority]}>
        {alert.priority === 'high' ? 'Urgent' : alert.priority === 'medium' ? 'Moyen' : 'Info'}
      </Badge>
    );
  };

  return (
    <Card className={`${getAlertColor()} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getAlertIcon()}
            <CardTitle className="text-lg">{alert.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              disabled={isDismissing}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          <p className="text-sm font-medium text-gray-900 bg-white p-2 rounded border-l-2 border-blue-500">
            💡 {alert.recommendation}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Prévu: {formatDate(alert.datePrevisionnelle)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{alert.cultureType}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-gray-800">Détails météo</summary>
            <p className="mt-2 pl-4">{alert.weatherReason}</p>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherAlertCard;
