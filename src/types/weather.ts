
export interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  conditions: WeatherCondition[];
  precipitation: number;
  precipitationProbability: number;
  cloudiness: number;
  uvIndex: number;
  datetime: string;
}

export interface WeatherForecast {
  current: WeatherData;
  daily: WeatherData[];
  hourly: WeatherData[];
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  recommendation: string;
  jalonId: number;
  projetId: number;
  cultureType: string;
  interventionType: string;
  datePrevisionnelle: string;
  weatherReason: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  isActive: boolean;
}

export interface ParcelWeatherData {
  parcelId: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  weather: WeatherForecast;
  alerts: WeatherAlert[];
  lastUpdated: string;
}

export interface WeatherConfig {
  apiKey: string;
  baseUrl: string;
  updateInterval: number;
  alertThresholds: {
    windSpeed: number;
    precipitation: number;
    temperature: {
      min: number;
      max: number;
    };
  };
}
