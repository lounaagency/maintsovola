
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, AlertTriangle } from 'lucide-react';
import WeatherDashboard from '@/components/weather/WeatherDashboard';

const WeatherSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Alertes Météo Intelligentes
          </CardTitle>
          <p className="text-sm text-gray-600">
            Recommandations automatiques basées sur la météo, vos interventions prévues et les types de cultures
          </p>
        </CardHeader>
        <CardContent>
          <WeatherDashboard />
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Comment utiliser les alertes météo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>🔴 Alertes critiques :</strong> Interventions à reporter impérativement (ex: semis avant forte pluie)
          </div>
          <div>
            <strong>🟠 Alertes moyennes :</strong> Interventions à surveiller de près (ex: irrigation avant pluie légère)
          </div>
          <div>
            <strong>🔵 Alertes informatives :</strong> Conseils d'optimisation (ex: conditions favorables)
          </div>
          <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
            <strong>💡 Astuce :</strong> Les alertes sont générées automatiquement en croisant vos tâches programmées 
            avec les prévisions météo et les spécificités de chaque culture.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherSection;
