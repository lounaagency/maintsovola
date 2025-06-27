
import { WeatherAlert, WeatherData, ParcelWeatherData } from "@/types/weather";
import { WeeklyTask } from "@/types/technicien";
import { supabase } from "@/integrations/supabase/client";

interface InterventionRule {
  type: string;
  cultureName?: string;
  checkWindSpeed?: number;
  checkPrecipitation?: number;
  checkTemperature?: { min: number; max: number };
  timeWindow: number; // heures
  priority: 'high' | 'medium' | 'low';
  action: 'cancel' | 'postpone' | 'warning';
  message: string;
  recommendation: string;
}

export class WeatherAlertService {
  private static instance: WeatherAlertService;
  private rules: InterventionRule[] = [
    // Règles de semis
    {
      type: 'Semis',
      checkPrecipitation: 10,
      timeWindow: 24,
      priority: 'high',
      action: 'postpone',
      message: 'Semis prévu avec forte pluie annoncée',
      recommendation: 'Reporter le semis après les précipitations pour éviter le lessivage des graines'
    },
    {
      type: 'Plantation',
      checkPrecipitation: 10,
      timeWindow: 24,
      priority: 'high',
      action: 'postpone',
      message: 'Plantation prévue avec forte pluie annoncée',
      recommendation: 'Reporter la plantation pour éviter le compactage du sol'
    },
    
    // Règles d'irrigation
    {
      type: 'Irrigation',
      checkPrecipitation: 5,
      timeWindow: 48,
      priority: 'medium',
      action: 'cancel',
      message: 'Irrigation prévue mais pluie annoncée',
      recommendation: 'Annuler l\'irrigation, la pluie naturelle sera suffisante'
    },
    
    // Règles de traitement phytosanitaire
    {
      type: 'Traitement phytosanitaire',
      checkWindSpeed: 15,
      timeWindow: 6,
      priority: 'high',
      action: 'postpone',
      message: 'Traitement phytosanitaire prévu avec vent fort',
      recommendation: 'Reporter le traitement pour éviter la dérive des produits'
    },
    {
      type: 'Traitement phytosanitaire',
      checkPrecipitation: 2,
      timeWindow: 6,
      priority: 'high',
      action: 'postpone',
      message: 'Traitement phytosanitaire prévu avec pluie annoncée',
      recommendation: 'Reporter le traitement pour éviter le lessivage des produits'
    },
    
    // Règles de récolte
    {
      type: 'Récolte',
      checkPrecipitation: 5,
      timeWindow: 72,
      priority: 'medium',
      action: 'warning',
      message: 'Récolte prévue avec risque de pluie',
      recommendation: 'Surveiller la météo et anticiper la récolte si possible'
    },
    
    // Règles de labour
    {
      type: 'Labour',
      checkPrecipitation: 5,
      timeWindow: 24,
      priority: 'medium',
      action: 'postpone',
      message: 'Labour prévu avec sol humide',
      recommendation: 'Attendre que le sol soit ressuyé pour éviter le compactage'
    },
    
    // Règles générales de température
    {
      type: 'Semis',
      cultureName: 'Riz',
      checkTemperature: { min: 15, max: 35 },
      timeWindow: 24,
      priority: 'medium',
      action: 'warning',
      message: 'Température non optimale pour le semis de riz',
      recommendation: 'Attendre des conditions de température plus favorables (15-35°C)'
    }
  ];

  static getInstance(): WeatherAlertService {
    if (!WeatherAlertService.instance) {
      WeatherAlertService.instance = new WeatherAlertService();
    }
    return WeatherAlertService.instance;
  }

  async generateAlertsForTask(
    task: WeeklyTask,
    weatherData: ParcelWeatherData,
    cultureType: string
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const relevantRules = this.getRulesForIntervention(task.type_intervention, cultureType);

    for (const rule of relevantRules) {
      const alert = this.checkRuleAgainstWeather(task, rule, weatherData, cultureType);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private getRulesForIntervention(interventionType: string, cultureType: string): InterventionRule[] {
    return this.rules.filter(rule => {
      const typeMatch = rule.type.toLowerCase().includes(interventionType.toLowerCase()) ||
                       interventionType.toLowerCase().includes(rule.type.toLowerCase());
      const cultureMatch = !rule.cultureName || rule.cultureName.toLowerCase() === cultureType.toLowerCase();
      return typeMatch && cultureMatch;
    });
  }

  private checkRuleAgainstWeather(
    task: WeeklyTask,
    rule: InterventionRule,
    weatherData: ParcelWeatherData,
    cultureType: string
  ): WeatherAlert | null {
    const taskDate = new Date(task.date_prevue);
    const now = new Date();
    const timeUntilTask = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60); // heures

    if (timeUntilTask > rule.timeWindow || timeUntilTask < 0) {
      return null;
    }

    const relevantWeatherData = this.getRelevantWeatherData(weatherData, taskDate, rule.timeWindow);
    let alertTriggered = false;
    let weatherReason = '';

    // Vérifier les conditions météo
    if (rule.checkPrecipitation !== undefined) {
      const maxPrecipitation = Math.max(...relevantWeatherData.map(w => w.precipitation));
      const maxPrecipitationProb = Math.max(...relevantWeatherData.map(w => w.precipitationProbability));
      
      if (maxPrecipitation >= rule.checkPrecipitation || maxPrecipitationProb >= 70) {
        alertTriggered = true;
        weatherReason += `Précipitations prévues: ${maxPrecipitation}mm (${maxPrecipitationProb.toFixed(0)}% de probabilité). `;
      }
    }

    if (rule.checkWindSpeed !== undefined) {
      const maxWindSpeed = Math.max(...relevantWeatherData.map(w => w.windSpeed));
      if (maxWindSpeed >= rule.checkWindSpeed) {
        alertTriggered = true;
        weatherReason += `Vent fort prévu: ${maxWindSpeed.toFixed(1)} km/h. `;
      }
    }

    if (rule.checkTemperature !== undefined) {
      const avgTemp = relevantWeatherData.reduce((sum, w) => sum + w.temperature, 0) / relevantWeatherData.length;
      if (avgTemp < rule.checkTemperature.min || avgTemp > rule.checkTemperature.max) {
        alertTriggered = true;
        weatherReason += `Température non optimale: ${avgTemp.toFixed(1)}°C (recommandé: ${rule.checkTemperature.min}-${rule.checkTemperature.max}°C). `;
      }
    }

    if (!alertTriggered) {
      return null;
    }

    return {
      id: `alert_${task.id_tache}_${Date.now()}`,
      type: rule.priority === 'high' ? 'danger' : rule.priority === 'medium' ? 'warning' : 'info',
      title: rule.message,
      message: `${rule.message} - ${weatherReason.trim()}`,
      recommendation: rule.recommendation,
      jalonId: task.id_tache,
      projetId: task.id_projet,
      cultureType: cultureType,
      interventionType: task.type_intervention,
      datePrevisionnelle: task.date_prevue,
      weatherReason: weatherReason.trim(),
      priority: rule.priority,
      createdAt: new Date().toISOString(),
      isActive: true
    };
  }

  private getRelevantWeatherData(
    weatherData: ParcelWeatherData,
    taskDate: Date,
    timeWindow: number
  ): WeatherData[] {
    const now = new Date();
    const windowEnd = new Date(taskDate.getTime() + (timeWindow * 60 * 60 * 1000));

    return weatherData.weather.hourly.filter(hourlyData => {
      const dataDate = new Date(hourlyData.datetime);
      return dataDate >= now && dataDate <= windowEnd;
    });
  }

  async saveAlert(alert: WeatherAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .insert([{
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
          is_active: alert.isActive,
          created_at: alert.createdAt
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving weather alert:', error);
    }
  }

  async getActiveAlertsForUser(userId: string): Promise<WeatherAlert[]> {
    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select(`
          *,
          jalon_projet:jalon_id(
            projet:id_projet(
              id_technicien
            )
          )
        `)
        .eq('is_active', true)
        .eq('jalon_projet.projet.id_technicien', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(alert => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        recommendation: alert.recommendation,
        jalonId: alert.jalon_id,
        projetId: alert.projet_id,
        cultureType: alert.culture_type,
        interventionType: alert.intervention_type,
        datePrevisionnelle: alert.date_previsionnelle,
        weatherReason: alert.weather_reason,
        priority: alert.priority,
        createdAt: alert.created_at,
        isActive: alert.is_active
      })) || [];
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return [];
    }
  }
}

export const weatherAlertService = WeatherAlertService.getInstance();
