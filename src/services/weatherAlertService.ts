
import { WeatherAlert, ParcelWeatherData, WeatherData } from "@/types/weather";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id_jalon_projet: number;
  nom_jalon: string;
  date_previsionnelle: string;
  id_projet: number;
  type_intervention?: string;
}

export class WeatherAlertService {
  private static instance: WeatherAlertService;

  static getInstance(): WeatherAlertService {
    if (!WeatherAlertService.instance) {
      WeatherAlertService.instance = new WeatherAlertService();
    }
    return WeatherAlertService.instance;
  }

  async generateAlertsForTask(task: Task, weatherData: ParcelWeatherData, cultureType: string): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const interventionType = this.getInterventionType(task.nom_jalon);
    
    console.log(`Génération d'alertes pour ${interventionType} sur ${cultureType}`);

    // Vérifier les conditions météo pour les prochains jours
    const upcomingWeather = weatherData.weather.daily.slice(0, 3); // 3 prochains jours
    
    for (const dayWeather of upcomingWeather) {
      const dayAlerts = this.checkWeatherConditions(
        task,
        dayWeather,
        interventionType,
        cultureType
      );
      alerts.push(...dayAlerts);
    }

    return alerts;
  }

  private getInterventionType(nomJalon: string): string {
    const jalon = nomJalon.toLowerCase();
    
    if (jalon.includes('semis') || jalon.includes('plantation')) return 'semis';
    if (jalon.includes('irrigation') || jalon.includes('arrosage')) return 'irrigation';
    if (jalon.includes('traitement') || jalon.includes('phyto')) return 'traitement_phytosanitaire';
    if (jalon.includes('récolte') || jalon.includes('harvest')) return 'récolte';
    if (jalon.includes('labour') || jalon.includes('préparation')) return 'labour';
    
    return 'général';
  }

  private checkWeatherConditions(
    task: Task,
    weather: WeatherData,
    interventionType: string,
    cultureType: string
  ): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const taskDate = new Date(task.date_previsionnelle);
    const weatherDate = new Date(weather.datetime);

    // Règles par type d'intervention
    switch (interventionType) {
      case 'semis':
        if (weather.precipitation > 10) {
          alerts.push(this.createAlert({
            type: 'danger',
            title: `🌧️ Forte pluie prévue - Reporter le semis`,
            message: `Précipitations de ${weather.precipitation}mm prévues le ${weatherDate.toLocaleDateString()}`,
            recommendation: `Reporter le semis de ${cultureType}. Attendre une période sèche de 2-3 jours.`,
            task,
            cultureType,
            interventionType,
            priority: 'high',
            weatherReason: `Risque de pourrissement des graines et de formation de croûte avec ${weather.precipitation}mm de pluie`
          }));
        }
        break;

      case 'irrigation':
        if (weather.precipitation > 5) {
          alerts.push(this.createAlert({
            type: 'warning',
            title: `💧 Pluie prévue - Ajuster l'irrigation`,
            message: `${weather.precipitation}mm de pluie prévus`,
            recommendation: `Réduire ou annuler l'irrigation prévue. La nature s'en charge !`,
            task,
            cultureType,
            interventionType,
            priority: 'medium',
            weatherReason: `Irrigation inutile avec ${weather.precipitation}mm de pluie naturelle`
          }));
        }
        break;

      case 'traitement_phytosanitaire':
        if (weather.windSpeed > 15) {
          alerts.push(this.createAlert({
            type: 'danger',
            title: `💨 Vent fort - Reporter le traitement`,
            message: `Vent de ${weather.windSpeed} km/h prévu`,
            recommendation: `Reporter le traitement phytosanitaire ${cultureType}. Risque de dérive et d'inefficacité.`,
            task,
            cultureType,
            interventionType,  
            priority: 'high',
            weatherReason: `Dérive du produit assurée avec des vents > 15 km/h`
          }));
        }
        if (weather.precipitation > 2) {
          alerts.push(this.createAlert({
            type: 'warning',
            title: `🌧️ Pluie après traitement`,
            message: `${weather.precipitation}mm prévus dans les heures suivantes`,
            recommendation: `Attendre une fenêtre sans pluie de 6h minimum après application.`,
            task,
            cultureType,
            interventionType,
            priority: 'medium',
            weatherReason: `Le produit sera lessivé par ${weather.precipitation}mm de pluie`
          }));
        }
        break;

      case 'récolte':
        if (weather.precipitation > 5) {
          alerts.push(this.createAlert({
            type: 'warning',
            title: `🌾 Pluie avant récolte`,
            message: `${weather.precipitation}mm prévus`,
            recommendation: `Accélérer la récolte de ${cultureType} si possible, ou prévoir un séchage supplémentaire.`,
            task,
            cultureType,
            interventionType,
            priority: 'medium',
            weatherReason: `Risque d'humidité excessive et de moisissures post-récolte`
          }));
        }
        break;

      case 'labour':
        if (weather.precipitation > 8) {
          alerts.push(this.createAlert({
            type: 'warning',
            title: `🚜 Sol trop humide pour le labour`,
            message: `${weather.precipitation}mm prévus`,
            recommendation: `Attendre que le sol ressuie avant le labour. Test : la terre ne doit pas coller aux outils.`,
            task,
            cultureType,
            interventionType,
            priority: 'medium',
            weatherReason: `Labour impossible sur sol gorgé d'eau - risque de compactage`
          }));
        }
        break;
    }

    // Vérifications générales de température
    if (weather.temperature < 5) {
      alerts.push(this.createAlert({
        type: 'info',
        title: `🥶 Température basse`,
        message: `${weather.temperature}°C prévus`,
        recommendation: `Protéger les cultures sensibles au froid. Vérifier l'état des plants de ${cultureType}.`,
        task,
        cultureType,
        interventionType,
        priority: 'low',
        weatherReason: `Risque de stress hydrique et de ralentissement de croissance`
      }));
    }

    if (weather.temperature > 35) {
      alerts.push(this.createAlert({
        type: 'warning',
        title: `🔥 Forte chaleur`,
        message: `${weather.temperature}°C prévus`,
        recommendation: `Éviter les interventions en pleine chaleur. Prévoir un arrosage supplémentaire pour ${cultureType}.`,
        task,
        cultureType,
        interventionType,
        priority: 'medium',
        weatherReason: `Stress thermique des plants et risque de déshydratation`
      }));
    }

    return alerts;
  }

  private createAlert(params: {
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    recommendation: string;
    task: Task;
    cultureType: string;
    interventionType: string;
    priority: 'high' | 'medium' | 'low';
    weatherReason: string;
  }): WeatherAlert {
    return {
      id: `alert-${params.task.id_jalon_projet}-${Date.now()}-${Math.random()}`,
      type: params.type,
      title: params.title,
      message: params.message,
      recommendation: params.recommendation,
      jalonId: params.task.id_jalon_projet,
      projetId: params.task.id_projet,
      cultureType: params.cultureType,
      interventionType: params.interventionType,
      datePrevisionnelle: params.task.date_previsionnelle,
      weatherReason: params.weatherReason,
      priority: params.priority,
      createdAt: new Date().toISOString(),
      isActive: true
    };
  }

  async saveAlert(alert: WeatherAlert): Promise<void> {
    try {
      // Utiliser une requête SQL personnalisée pour insérer dans weather_alerts
      const { error } = await supabase.rpc('insert_weather_alert', {
        alert_data: {
          id: alert.id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          recommendation: alert.recommendation,
          jalon_id: alert.jalonId,
          projet_id: alert.projetId,
          culture_type: alert.cultureType,
          intervention_type: alert.interventionType,
          date_previsionnelle: alert.datePrevisionnelle,
          weather_reason: alert.weatherReason,
          priority: alert.priority,
          is_active: alert.isActive
        }
      });

      if (error) {
        console.error('Error saving weather alert:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveAlert:', error);
      throw error;
    }
  }

  async getActiveAlertsForUser(userId: string): Promise<WeatherAlert[]> {
    try {
      // Utiliser une requête SQL personnalisée pour récupérer les alertes
      const { data, error } = await supabase.rpc('get_user_weather_alerts', {
        user_id: userId
      });

      if (error) {
        console.error('Error fetching weather alerts:', error);
        throw error;
      }

      // Transformer les données en WeatherAlert
      return (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        recommendation: item.recommendation,
        jalonId: item.jalon_id,
        projetId: item.projet_id,
        cultureType: item.culture_type,
        interventionType: item.intervention_type,
        datePrevisionnelle: item.date_previsionnelle,
        weatherReason: item.weather_reason,
        priority: item.priority,
        createdAt: item.created_at,
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('Error in getActiveAlertsForUser:', error);
      return [];
    }
  }
}

export const weatherAlertService = WeatherAlertService.getInstance();
