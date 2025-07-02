import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeatherAlert } from '@/types/weather';

export interface WeatherAlertData {
  id: string;
  type: string;
  title: string;
  message: string;
  recommendation: string;
  jalon_id: number | null;
  projet_id: number | null;
  culture_type: string;
  intervention_type: string;
  date_previsionnelle: string;
  weather_reason: string;
  priority: string;
  is_active: boolean;
  created_at: string;
}

export const useWeatherAlerts = (userId: string) => {
  const [alerts, setAlerts] = useState<WeatherAlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching weather alerts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;
      
      // Mettre à jour l'état local
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId);
  };

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    dismissAlert,
    refetch: fetchAlerts,
  };
};