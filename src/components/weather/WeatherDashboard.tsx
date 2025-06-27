import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cloud, RefreshCw } from 'lucide-react';
import { useWeatherAlerts, useParcelWeather } from '@/hooks/useWeatherAlerts';
import { useWeeklyPlannings } from '@/hooks/useWeeklyPlannings';
import { useAssignedParcels } from '@/hooks/useAssignedParcels';
import { useAuth } from '@/contexts/AuthContext';
import WeatherAlertCard from './WeatherAlertCard';
import WeatherWidget from './WeatherWidget';
import { weatherAlertService } from '@/services/weatherAlertService';

const WeatherDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const userRole = profile?.nom_role?.toLowerCase() || 'simple';
  const { alerts, isLoading: alertsLoading, dismissAlert, getWeatherForParcel } = useWeatherAlerts();
  const { tasks } = useWeeklyPlannings(user?.id || '', userRole);
  const { parcels } = useAssignedParcels(user?.id || '', userRole);
  const [isGeneratingAlerts, setIsGeneratingAlerts] = useState(false);

  // Fonction pour extraire les coordonnées d'une géométrie
  const extractCoordinates = (geom: any) => {
    if (!geom) return null;
    
    try {
      // Si c'est un string, parser le JSON
      const geometry = typeof geom === 'string' ? JSON.parse(geom) : geom;
      
      if (geometry.type === 'Point') {
        return {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0]
        };
      } else if (geometry.type === 'Polygon') {
        // Prendre le centroïde approximatif du polygone
        const coordinates = geometry.coordinates[0];
        const lat = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
        const lon = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
        return { latitude: lat, longitude: lon };
      }
    } catch (error) {
      console.error('Error parsing geometry:', error);
    }
    
    return null;
  };

  // Génération automatique des alertes
  useEffect(() => {
    const generateAlerts = async () => {
      if (!user || isGeneratingAlerts || tasks.length === 0) return;
      
      setIsGeneratingAlerts(true);
      try {
        for (const task of tasks) {
          // Trouver la parcelle correspondante
          const parcel = parcels.find(p => p.id_projet === task.id_projet);
          if (!parcel) continue;

          // Extraire les coordonnées (simulation - à adapter selon votre structure de données)
          const coordinates = extractCoordinates(parcel.geom);
          if (!coordinates) continue;

          // Récupérer les données météo
          const weatherData = await getWeatherForParcel(parcel.id_projet, coordinates);
          
          // Déterminer le type de culture
          const cultureType = parcel.cultures?.[0]?.nom_culture || 'Générique';
          
          // Mapper WeeklyTask vers Task pour le service
          const mappedTask = {
            id_jalon_projet: task.id_jalon_projet || task.id_tache,
            nom_jalon: task.nom_jalon || task.description,
            date_previsionnelle: task.date_previsionnelle || task.date_prevue,
            id_projet: task.id_projet,
            type_intervention: task.type_intervention,
          };
          
          // Générer les alertes
          const newAlerts = await weatherAlertService.generateAlertsForTask(mappedTask, weatherData, cultureType);
          
          // Sauvegarder les alertes
          for (const alert of newAlerts) {
            await weatherAlertService.saveAlert(alert);
          }
        }
      } catch (error) {
        console.error('Error generating weather alerts:', error);
      } finally {
        setIsGeneratingAlerts(false);
      }
    };

    generateAlerts();
  }, [tasks, parcels, user, isGeneratingAlerts]);

  const criticalAlerts = Array.isArray(alerts) ? alerts.filter(alert => alert.priority === 'high') : [];
  const mediumAlerts = Array.isArray(alerts) ? alerts.filter(alert => alert.priority === 'medium') : [];
  const lowAlerts = Array.isArray(alerts) ? alerts.filter(alert => alert.priority === 'low') : [];

  if (alertsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2">Chargement des alertes météo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Alertes critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-sm text-gray-600">Interventions à reporter/annuler</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertes moyennes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{mediumAlerts.length}</div>
            <p className="text-sm text-gray-600">Interventions à surveiller</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Cloud className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{lowAlerts.length}</div>
            <p className="text-sm text-gray-600">Alertes informatives</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes détaillées */}
      <Tabs defaultValue="critical" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="critical" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Critiques ({criticalAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="medium" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Moyennes ({mediumAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="low" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Infos ({lowAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="critical" className="space-y-4">
          {criticalAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucune alerte critique pour le moment
              </CardContent>
            </Card>
          ) : (
            criticalAlerts.map(alert => (
              <WeatherAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {mediumAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucune alerte moyenne pour le moment
              </CardContent>
            </Card>
          ) : (
            mediumAlerts.map(alert => (
              <WeatherAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          {lowAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucune alerte informative pour le moment
              </CardContent>
            </Card>
          ) : (
            lowAlerts.map(alert => (
              <WeatherAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {isGeneratingAlerts && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-blue-700">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Génération des alertes météo en cours...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeatherDashboard;
