
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';
import { WeatherData } from '@/types/weather';

interface WeatherWidgetProps {
  weather: WeatherData;
  title?: string;
  compact?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, title = "Météo actuelle", compact = false }) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getConditionText = (conditions: any[]) => {
    return conditions[0]?.description || 'Conditions inconnues';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        {getWeatherIcon(weather.conditions[0]?.main)}
        <span className="text-sm font-medium">{Math.round(weather.temperature)}°C</span>
        <span className="text-xs text-gray-600">{getConditionText(weather.conditions)}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getWeatherIcon(weather.conditions[0]?.main)}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{Math.round(weather.temperature)}°C</span>
          <div className="text-right">
            <p className="text-sm text-gray-600 capitalize">{getConditionText(weather.conditions)}</p>
            <p className="text-xs text-gray-500">Humidité: {weather.humidity}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{weather.windSpeed.toFixed(1)} km/h</p>
              <p className="text-xs text-gray-600">Vent</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{weather.precipitation.toFixed(1)} mm</p>
              <p className="text-xs text-gray-600">Pluie</p>
            </div>
          </div>
        </div>

        {weather.precipitationProbability > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-600">Probabilité de pluie:</span>
            <Badge variant={weather.precipitationProbability > 50 ? "default" : "secondary"}>
              {weather.precipitationProbability.toFixed(0)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
