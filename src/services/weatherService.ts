
import { WeatherData, WeatherForecast, ParcelWeatherData } from "@/types/weather";

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export class WeatherService {
  private static instance: WeatherService;
  private cache: Map<string, { data: WeatherForecast; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
      
      const data = await response.json();
      return this.transformCurrentWeatherData(data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  async getForecast(lat: number, lon: number): Promise<WeatherForecast> {
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const [currentWeather, forecastData] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getForecastData(lat, lon)
      ]);

      const forecast: WeatherForecast = {
        current: currentWeather,
        daily: forecastData.daily,
        hourly: forecastData.hourly
      };

      this.cache.set(cacheKey, {
        data: forecast,
        timestamp: Date.now()
      });

      return forecast;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }

  private async getForecastData(lat: number, lon: number) {
    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Forecast API Error: ${response.status}`);
    
    const data = await response.json();
    return this.transformForecastData(data);
  }

  private transformCurrentWeatherData(data: any): WeatherData {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      windDirection: data.wind?.deg || 0,
      pressure: data.main.pressure,
      visibility: data.visibility || 10000,
      conditions: data.weather.map((w: any) => ({
        main: w.main,
        description: w.description,
        icon: w.icon
      })),
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      precipitationProbability: 0,
      cloudiness: data.clouds.all,
      uvIndex: 0,
      datetime: new Date(data.dt * 1000).toISOString()
    };
  }

  private transformForecastData(data: any) {
    const hourly = data.list.slice(0, 24).map((item: any) => ({
      temperature: item.main.temp,
      humidity: item.main.humidity,
      windSpeed: item.wind?.speed || 0,
      windDirection: item.wind?.deg || 0,
      pressure: item.main.pressure,
      visibility: 10000,
      conditions: item.weather.map((w: any) => ({
        main: w.main,
        description: w.description,
        icon: w.icon
      })),
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
      precipitationProbability: item.pop * 100,
      cloudiness: item.clouds.all,
      uvIndex: 0,
      datetime: new Date(item.dt * 1000).toISOString()
    }));

    // Groupe par jour pour les prévisions quotidiennes
    const dailyMap = new Map();
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date).push(item);
    });

    const daily = Array.from(dailyMap.values()).slice(0, 5).map((dayData: any) => {
      const temps = dayData.map((d: any) => d.main.temp);
      const precipitations = dayData.map((d: any) => d.rain?.['3h'] || d.snow?.['3h'] || 0);
      
      return {
        temperature: Math.round(temps.reduce((a: number, b: number) => a + b) / temps.length),
        humidity: Math.round(dayData.reduce((sum: number, d: any) => sum + d.main.humidity, 0) / dayData.length),
        windSpeed: Math.max(...dayData.map((d: any) => d.wind?.speed || 0)),
        windDirection: dayData[0].wind?.deg || 0,
        pressure: dayData[0].main.pressure,
        visibility: 10000,
        conditions: dayData[0].weather.map((w: any) => ({
          main: w.main,
          description: w.description,
          icon: w.icon
        })),
        precipitation: Math.max(...precipitations),
        precipitationProbability: Math.max(...dayData.map((d: any) => d.pop * 100)),
        cloudiness: Math.round(dayData.reduce((sum: number, d: any) => sum + d.clouds.all, 0) / dayData.length),
        uvIndex: 0,
        datetime: new Date(dayData[0].dt * 1000).toISOString()
      };
    });

    return { hourly, daily };
  }

  async getWeatherForParcel(parcelId: number, coordinates: { latitude: number; longitude: number }): Promise<ParcelWeatherData> {
    const weather = await this.getForecast(coordinates.latitude, coordinates.longitude);
    
    return {
      parcelId,
      coordinates,
      weather,
      alerts: [], // Sera rempli par le service d'alerte
      lastUpdated: new Date().toISOString()
    };
  }
}

export const weatherService = WeatherService.getInstance();
