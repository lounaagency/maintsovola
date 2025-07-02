-- Insert simple test weather alerts for UI testing
-- First check if we need to add missing columns
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weather_alerts' AND column_name='weather_condition') THEN
    ALTER TABLE weather_alerts ADD COLUMN weather_condition TEXT DEFAULT 'Unknown';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weather_alerts' AND column_name='alert_type') THEN
    ALTER TABLE weather_alerts ADD COLUMN alert_type TEXT DEFAULT 'WARNING';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weather_alerts' AND column_name='severity') THEN
    ALTER TABLE weather_alerts ADD COLUMN severity TEXT DEFAULT 'MEDIUM';
  END IF;
END
$$;

-- Insert test alerts with simple data
INSERT INTO public.weather_alerts (
  id, type, title, message, recommendation, 
  culture_type, intervention_type, date_previsionnelle, weather_reason, priority, is_active
) VALUES
('test-001', 'URGENT', 'Alerte critique', 'Message test critique', 'Recommendation test', 'Riz', 'Recolte', CURRENT_DATE, 'Test weather', 'CRITICAL', true),
('test-002', 'POSTPONE', 'Alerte importante', 'Message test important', 'Recommendation test', 'Manioc', 'Traitement', CURRENT_DATE, 'Test weather', 'HIGH', true),
('test-003', 'WARNING', 'Alerte moyenne', 'Message test moyen', 'Recommendation test', 'Haricot', 'Irrigation', CURRENT_DATE, 'Test weather', 'MEDIUM', true);