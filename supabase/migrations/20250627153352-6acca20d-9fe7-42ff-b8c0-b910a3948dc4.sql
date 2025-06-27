
-- Migration: Création de la table weather_alerts
CREATE TABLE weather_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('danger', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  jalon_id INTEGER,
  projet_id INTEGER,
  culture_type TEXT NOT NULL,
  intervention_type TEXT NOT NULL,
  date_previsionnelle DATE NOT NULL,
  weather_reason TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_weather_alerts_active ON weather_alerts(is_active);
CREATE INDEX idx_weather_alerts_priority ON weather_alerts(priority);
CREATE INDEX idx_weather_alerts_projet_id ON weather_alerts(projet_id);
CREATE INDEX idx_weather_alerts_created_at ON weather_alerts(created_at);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_weather_alerts_updated_at
  BEFORE UPDATE ON weather_alerts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
