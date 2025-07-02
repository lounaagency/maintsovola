-- Create weather alerts table for intelligent agricultural recommendations
CREATE TABLE IF NOT EXISTS public.weather_alerts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id INTEGER REFERENCES public.projet(id_projet),
  jalon_id INTEGER REFERENCES public.jalon_projet(id_jalon_projet),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('POSTPONE', 'CANCEL', 'WARNING', 'URGENT')),
  intervention_type TEXT NOT NULL,
  culture_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  weather_condition TEXT NOT NULL,
  weather_reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  date_previsionnelle DATE NOT NULL,
  jalons_affected INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  acknowledged BOOLEAN DEFAULT false,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weather alerts" 
  ON public.weather_alerts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weather alerts" 
  ON public.weather_alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_weather_alerts_user_active 
  ON public.weather_alerts(user_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_project 
  ON public.weather_alerts(project_id, is_active);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_weather_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER weather_alerts_updated_at
    BEFORE UPDATE ON public.weather_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_weather_alerts_updated_at();