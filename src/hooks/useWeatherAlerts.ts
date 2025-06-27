
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weatherService } from "@/services/weatherService";
import { weatherAlertService } from "@/services/weatherAlertService";
import { WeatherAlert, ParcelWeatherData } from "@/types/weather";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useWeatherAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['weather-alerts', user?.id],
    queryFn: () => weatherAlertService.getActiveAlertsForUser(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const dismissAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: false })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather-alerts'] });
    }
  });

  const getWeatherForParcel = async (parcelId: number, coordinates: { latitude: number; longitude: number }): Promise<ParcelWeatherData> => {
    return await weatherService.getWeatherForParcel(parcelId, coordinates);
  };

  return {
    alerts,
    isLoading,
    error,
    dismissAlert: dismissAlert.mutate,
    isDismissing: dismissAlert.isPending,
    getWeatherForParcel
  };
};

export const useParcelWeather = (parcelId: number, coordinates: { latitude: number; longitude: number }) => {
  return useQuery({
    queryKey: ['parcel-weather', parcelId],
    queryFn: () => weatherService.getWeatherForParcel(parcelId, coordinates),
    enabled: !!parcelId && !!coordinates.latitude && !!coordinates.longitude,
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
};
