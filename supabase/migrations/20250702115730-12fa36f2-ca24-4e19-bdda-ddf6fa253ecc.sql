-- Temporarily disable constraints and insert test data
ALTER TABLE weather_alerts DISABLE TRIGGER ALL;

-- Delete any existing test data
DELETE FROM weather_alerts WHERE id LIKE 'test-%';

-- Insert test data manually with minimum required fields
INSERT INTO weather_alerts (id, type, title, message, recommendation, culture_type, intervention_type, date_previsionnelle, weather_reason, priority, is_active) 
VALUES 
('test-001', 'WARNING', 'Test Alert Critical', 'This is a critical test alert for UI testing', 'Take immediate action', 'Riz', 'Recolte', '2025-07-02', 'Heavy rain forecast', 'HIGH', true),
('test-002', 'WARNING', 'Test Alert Medium', 'This is a medium priority test alert', 'Monitor situation', 'Mais', 'Irrigation', '2025-07-02', 'Light rain', 'MEDIUM', true),
('test-003', 'WARNING', 'Test Alert Low', 'This is a low priority test alert', 'No immediate action needed', 'Haricot', 'Semis', '2025-07-03', 'Good weather', 'LOW', true);

-- Re-enable triggers
ALTER TABLE weather_alerts ENABLE TRIGGER ALL;