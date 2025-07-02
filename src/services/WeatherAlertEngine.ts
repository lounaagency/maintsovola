import { WeatherData, WeatherForecast, WeatherAlert, AlertRule, InterventionType } from '@/types/weather';
import { supabase } from '@/integrations/supabase/client';

export class WeatherAlertEngine {
  private interventionTypes: InterventionType[] = [
    {
      code: 'SEMIS',
      name: 'Semis/Ensemencement',
      weatherSensitive: true,
      precipitationThreshold: 10, // mm
      temperatureRange: { min: 10, max: 35 }
    },
    {
      code: 'IRRIGATION',
      name: 'Irrigation',
      weatherSensitive: true,
      precipitationThreshold: 5, // mm
    },
    {
      code: 'TRAITEMENT_PHYTO',
      name: 'Traitement phytosanitaire',
      weatherSensitive: true,
      windThreshold: 20, // km/h
      precipitationThreshold: 2, // mm
    },
    {
      code: 'RECOLTE',
      name: 'Récolte',
      weatherSensitive: true,
      precipitationThreshold: 8, // mm
      windThreshold: 30, // km/h
    },
    {
      code: 'LABOUR',
      name: 'Labour/Préparation sol',
      weatherSensitive: true,
      precipitationThreshold: 15, // mm
    }
  ];

  private alertRules: AlertRule[] = [
    {
      interventionType: 'SEMIS',
      weatherCondition: 'RAIN',
      threshold: 10,
      alertType: 'POSTPONE',
      message: 'Semis prévu avec pluie annoncée',
      recommendation: 'Reporter de 2-3 jours après la pluie - sol trop humide pour un semis optimal'
    },
    {
      interventionType: 'IRRIGATION',
      weatherCondition: 'RAIN',
      threshold: 5,
      alertType: 'CANCEL',
      message: 'Irrigation programmée avec pluie prévue',
      recommendation: 'Annuler l\'irrigation - économie d\'eau et éviter le sur-arrosage'
    },
    {
      interventionType: 'TRAITEMENT_PHYTO',
      weatherCondition: 'WIND',
      threshold: 20,
      alertType: 'WARNING',
      message: 'Traitement phytosanitaire prévu avec vent fort',
      recommendation: 'Décaler au matin ou soir - risque de dérive et efficacité réduite'
    },
    {
      interventionType: 'TRAITEMENT_PHYTO',
      weatherCondition: 'RAIN',
      threshold: 2,
      alertType: 'POSTPONE',
      message: 'Traitement phytosanitaire avec pluie annoncée',
      recommendation: 'Reporter après la pluie - produit lessivé avant absorption'
    },
    {
      interventionType: 'RECOLTE',
      weatherCondition: 'RAIN',
      threshold: 8,
      alertType: 'URGENT',
      message: 'Récolte prévue avec pluie importante',
      recommendation: 'Avancer la récolte si possible - risque de perte de qualité'
    },
    {
      interventionType: 'LABOUR',
      weatherCondition: 'RAIN',
      threshold: 15,
      alertType: 'POSTPONE',
      message: 'Labour prévu avec sol détrempé',
      recommendation: 'Attendre 3-5 jours - éviter la compaction du sol'
    }
  ];

  /**
   * Analyse les jalons à venir et génère des alertes météo
   */
  async analyzeAndGenerateAlerts(userId: string): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    try {
      // Récupérer les projets de l'utilisateur avec jalons à venir (7 prochains jours)
      const { data: jalons, error } = await supabase
        .from('jalon_projet')
        .select(`
          id_jalon_projet,
          date_previsionnelle,
          statut,
          projet:id_projet(
            id_projet,
            titre,
            id_technicien,
            id_tantsaha,
            terrain:id_terrain(geom),
            projet_culture(
              culture:id_culture(nom_culture)
            )
          ),
          jalon_agricole:id_jalon_agricole(
            nom_jalon,
            action_a_faire
          )
        `)
        .gte('date_previsionnelle', new Date().toISOString().split('T')[0])
        .lte('date_previsionnelle', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('statut', 'Prévu')
        .or(`id_technicien.eq.${userId},id_tantsaha.eq.${userId}`, { foreignTable: 'projet' });

      if (error || !jalons) {
        console.error('Error fetching jalons:', error);
        return alerts;
      }

      // Analyser chaque jalon
      for (const jalon of jalons) {
        if (!jalon.projet?.terrain?.geom) continue;

        const coords = this.extractCoordinates(jalon.projet.terrain.geom);
        if (!coords) continue;

        // Récupérer les prévisions météo
        const weatherService = new (await import('./WeatherService')).WeatherService(
          'YOUR_OPENWEATHER_API_KEY' // À configurer via secrets Supabase
        );
        
        try {
          const forecast = await weatherService.getForecast(coords.lat, coords.lon);
          const dayForecast = this.getForecastForDate(forecast, jalon.date_previsionnelle);
          
          if (dayForecast) {
            const interventionType = this.detectInterventionType(jalon.jalon_agricole?.action_a_faire || '');
            const alertsForJalon = this.generateAlertsForIntervention(
              jalon,
              interventionType,
              dayForecast,
              userId
            );
            alerts.push(...alertsForJalon);
          }
        } catch (weatherError) {
          console.error('Weather API error for jalon:', jalon.id_jalon_projet, weatherError);
        }
      }

      // Sauvegarder les alertes en base
      await this.saveAlerts(alerts);

    } catch (error) {
      console.error('Error in analyzeAndGenerateAlerts:', error);
    }

    return alerts;
  }

  /**
   * Détecte le type d'intervention basé sur l'action à faire
   */
  private detectInterventionType(actionAFaire: string): InterventionType | null {
    const action = actionAFaire.toLowerCase();
    
    if (action.includes('semis') || action.includes('plantation')) {
      return this.interventionTypes.find(t => t.code === 'SEMIS') || null;
    }
    if (action.includes('irrigation') || action.includes('arrosage')) {
      return this.interventionTypes.find(t => t.code === 'IRRIGATION') || null;
    }
    if (action.includes('traitement') || action.includes('phyto') || action.includes('pesticide')) {
      return this.interventionTypes.find(t => t.code === 'TRAITEMENT_PHYTO') || null;
    }
    if (action.includes('récolte') || action.includes('harvest')) {
      return this.interventionTypes.find(t => t.code === 'RECOLTE') || null;
    }
    if (action.includes('labour') || action.includes('préparation')) {
      return this.interventionTypes.find(t => t.code === 'LABOUR') || null;
    }
    
    return null;
  }

  /**
   * Génère les alertes pour une intervention donnée
   */
  private generateAlertsForIntervention(
    jalon: any,
    interventionType: InterventionType | null,
    forecast: WeatherForecast,
    userId: string
  ): WeatherAlert[] {
    if (!interventionType || !interventionType.weatherSensitive) return [];

    const alerts: WeatherAlert[] = [];

    // Vérifier les règles d'alerte
    for (const rule of this.alertRules) {
      if (rule.interventionType !== interventionType.code) continue;

      let shouldAlert = false;
      let weatherCondition = '';

      switch (rule.weatherCondition) {
        case 'RAIN':
          if (forecast.precipitation >= rule.threshold) {
            shouldAlert = true;
            weatherCondition = `${forecast.precipitation}mm de pluie prévue`;
          }
          break;
        case 'WIND':
          if (forecast.windSpeed >= rule.threshold) {
            shouldAlert = true;
            weatherCondition = `Vent à ${forecast.windSpeed}km/h`;
          }
          break;
      }

      if (shouldAlert) {
        const cultureName = jalon.projet.projet_culture?.[0]?.culture?.nom_culture || 'Culture';
        
        alerts.push({
          id: `${jalon.id_jalon_projet}-${rule.weatherCondition}-${Date.now()}`,
          projectId: jalon.projet.id_projet,
          userId,
          alertType: rule.alertType,
          title: `${rule.alertType === 'POSTPONE' ? '❌' : rule.alertType === 'CANCEL' ? '⏸️' : rule.alertType === 'URGENT' ? '🚨' : '⚠️'} ${interventionType.name} - ${jalon.projet.titre}`,
          message: `${rule.message} (${cultureName})`,
          recommendation: rule.recommendation,
          jalonsAffected: [jalon.id_jalon_projet],
          weatherCondition,
          severity: this.calculateSeverity(rule.alertType, forecast.precipitation, forecast.windSpeed),
          createdAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Calcule la sévérité de l'alerte
   */
  private calculateSeverity(alertType: string, precipitation: number, windSpeed: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (alertType === 'URGENT') return 'CRITICAL';
    if (alertType === 'POSTPONE') return 'HIGH';
    if (alertType === 'CANCEL') return 'MEDIUM';
    
    if (precipitation > 20 || windSpeed > 40) return 'HIGH';
    if (precipitation > 10 || windSpeed > 25) return 'MEDIUM';
    
    return 'LOW';
  }

  /**
   * Récupère les prévisions pour une date donnée
   */
  private getForecastForDate(forecasts: WeatherForecast[], date: string): WeatherForecast | null {
    return forecasts.find(f => f.date === date) || null;
  }

  /**
   * Extrait les coordonnées d'une géométrie
   */
  private extractCoordinates(geom: any): { lat: number; lon: number } | null {
    try {
      if (geom.type === 'Point') {
        return { lon: geom.coordinates[0], lat: geom.coordinates[1] };
      } else if (geom.type === 'Polygon') {
        const coords = geom.coordinates[0][0];
        return { lon: coords[0], lat: coords[1] };
      }
    } catch (error) {
      console.error('Error extracting coordinates:', error);
    }
    return null;
  }

  /**
   * Sauvegarde les alertes en base de données
   */
  private async saveAlerts(alerts: WeatherAlert[]): Promise<void> {
    if (alerts.length === 0) return;

    try {
      const { error } = await supabase
        .from('weather_alerts')
        .insert(
          alerts.map(alert => ({
            id: alert.id,
            project_id: alert.projectId,
            user_id: alert.userId,
            alert_type: alert.alertType,
            title: alert.title,
            message: alert.message,
            recommendation: alert.recommendation,
            jalons_affected: alert.jalonsAffected,
            weather_condition: alert.weatherCondition,
            severity: alert.severity,
            valid_until: alert.validUntil,
            acknowledged: alert.acknowledged,
          }))
        );

      if (error) {
        console.error('Error saving weather alerts:', error);
      }
    } catch (error) {
      console.error('Error in saveAlerts:', error);
    }
  }
}