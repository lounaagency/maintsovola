import { WeatherData, WeatherForecast } from '@/types/weather';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Récupère les données météo actuelles pour des coordonnées données
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const response = await fetch(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=fr`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      windDirection: data.wind.deg || 0,
      precipitation: data.rain?.['1h'] || 0,
      precipitation24h: data.rain?.['1h'] || 0,
      conditions: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Récupère les prévisions météo pour 5 jours
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    const response = await fetch(
      `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=fr`
    );
    
    if (!response.ok) {
      throw new Error(`Weather forecast API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Grouper par jour et prendre les valeurs min/max
    const dailyForecasts = new Map<string, any>();
    
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          temperatures: [item.main.temp],
          precipitation: item.rain?.['3h'] || 0,
          precipitationProbability: item.pop * 100,
          windSpeed: Math.round(item.wind.speed * 3.6),
          conditions: item.weather[0].description,
          icon: item.weather[0].icon,
        });
      } else {
        const existing = dailyForecasts.get(date);
        existing.temperatures.push(item.main.temp);
        existing.precipitation += item.rain?.['3h'] || 0;
        existing.precipitationProbability = Math.max(
          existing.precipitationProbability, 
          item.pop * 100
        );
      }
    });

    return Array.from(dailyForecasts.values()).map(forecast => ({
      date: forecast.date,
      temperature: {
        min: Math.round(Math.min(...forecast.temperatures)),
        max: Math.round(Math.max(...forecast.temperatures)),
      },
      precipitation: Math.round(forecast.precipitation),
      precipitationProbability: Math.round(forecast.precipitationProbability),
      windSpeed: forecast.windSpeed,
      conditions: forecast.conditions,
      icon: forecast.icon,
    })).slice(0, 5); // 5 jours maximum
  }

  /**
   * Extrait les coordonnées d'une géométrie GeoJSON
   */
  static extractCoordinates(geom: any): { lat: number; lon: number } | null {
    if (!geom || !geom.coordinates) return null;
    
    try {
      if (geom.type === 'Point') {
        return {
          lon: geom.coordinates[0],
          lat: geom.coordinates[1],
        };
      } else if (geom.type === 'Polygon') {
        // Prendre le centre du polygone (premier point)
        const coords = geom.coordinates[0][0];
        return {
          lon: coords[0],
          lat: coords[1],
        };
      }
    } catch (error) {
      console.error('Error extracting coordinates:', error);
    }
    
    return null;
  }
}