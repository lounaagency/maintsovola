
-- Create RPC function to get user weather alerts
CREATE OR REPLACE FUNCTION get_user_weather_alerts(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  recommendation TEXT,
  jalon_id INTEGER,
  projet_id INTEGER,
  culture_type TEXT,
  intervention_type TEXT,
  date_previsionnelle DATE,
  weather_reason TEXT,
  priority TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.id,
    wa.type,
    wa.title,
    wa.message,
    wa.recommendation,
    wa.jalon_id,
    wa.projet_id,
    wa.culture_type,
    wa.intervention_type,
    wa.date_previsionnelle,
    wa.weather_reason,
    wa.priority,
    wa.is_active,
    wa.created_at
  FROM weather_alerts wa
  JOIN jalon_projet jp ON wa.jalon_id = jp.id_jalon_projet
  JOIN projet p ON jp.id_projet = p.id_projet
  WHERE p.id_technicien = user_id
    AND wa.is_active = true
  ORDER BY wa.created_at DESC;
END;
$$;

-- Create RPC function to dismiss weather alert
CREATE OR REPLACE FUNCTION dismiss_weather_alert(alert_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE weather_alerts 
  SET is_active = false, updated_at = NOW()
  WHERE id = alert_id;
END;
$$;

-- Create RPC function to insert weather alert
CREATE OR REPLACE FUNCTION insert_weather_alert(alert_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO weather_alerts (
    id,
    type,
    title,
    message,
    recommendation,
    jalon_id,
    projet_id,
    culture_type,
    intervention_type,
    date_previsionnelle,
    weather_reason,
    priority,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    (alert_data->>'id')::TEXT,
    (alert_data->>'type')::TEXT,
    (alert_data->>'title')::TEXT,
    (alert_data->>'message')::TEXT,
    (alert_data->>'recommendation')::TEXT,
    (alert_data->>'jalon_id')::INTEGER,
    (alert_data->>'projet_id')::INTEGER,
    (alert_data->>'culture_type')::TEXT,
    (alert_data->>'intervention_type')::TEXT,
    (alert_data->>'date_previsionnelle')::DATE,
    (alert_data->>'weather_reason')::TEXT,
    (alert_data->>'priority')::TEXT,
    COALESCE((alert_data->>'is_active')::BOOLEAN, true),
    NOW(),
    NOW()
  );
END;
$$;
