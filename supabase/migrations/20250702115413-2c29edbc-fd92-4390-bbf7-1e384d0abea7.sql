-- Insert test weather alerts for UI testing
INSERT INTO public.weather_alerts (
  id, user_id, project_id, jalon_id, alert_type, intervention_type, culture_type,
  title, message, recommendation, weather_condition, weather_reason, 
  severity, priority, date_previsionnelle, is_active, valid_until
) VALUES
-- Alert CRITICAL - Forte pluie pendant récolte
(
  'test-alert-001',
  (SELECT id_tantsaha FROM projet WHERE id_projet = 1 LIMIT 1),
  1,
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 1 LIMIT 1),
  'URGENT',
  'Récolte',
  'Riz',
  '⚠️ Récolte menacée par forte pluie',
  'Une forte pluie est prévue demain pendant votre récolte de riz. Risque de perte importante de rendement.',
  'Reportez la récolte de 2-3 jours ou protégez la récolte avec des bâches imperméables.',
  'Forte pluie',
  'Précipitations prévues: 45mm en 6h',
  'CRITICAL',
  'CRITICAL',
  CURRENT_DATE + INTERVAL '1 day',
  true,
  CURRENT_TIMESTAMP + INTERVAL '48 hours'
),
-- Alert HIGH - Vent fort pour traitement
(
  'test-alert-002',
  (SELECT id_tantsaha FROM projet WHERE id_projet = 2 LIMIT 1),
  2,
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 2 LIMIT 1),
  'POSTPONE',
  'Traitement phytosanitaire',
  'Manioc',
  '🌪️ Vent fort - Report traitement',
  'Vents forts prévus (35 km/h) pendant votre traitement phytosanitaire. Risque de dérive du produit.',
  'Attendez une accalmie. Traitez tôt le matin (6h-8h) quand le vent sera plus faible.',
  'Vent fort',
  'Rafales jusqu\'à 35 km/h prévues',
  'HIGH',
  'HIGH',
  CURRENT_DATE,
  true,
  CURRENT_TIMESTAMP + INTERVAL '24 hours'
),
-- Alert MEDIUM - Irrigation avec légère pluie
(
  'test-alert-003',
  (SELECT id_tantsaha FROM projet WHERE id_projet = 3 LIMIT 1),
  3,
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 3 LIMIT 1),
  'WARNING',
  'Irrigation',
  'Haricot',
  '🌧️ Irrigation non nécessaire',
  'Légère pluie prévue (8mm) dans les prochaines heures. Votre irrigation programmée pourrait être superflue.',
  'Annulez l\'irrigation programmée pour aujourd\'hui. Surveillez l\'humidité du sol demain.',
  'Pluie légère',
  'Précipitations: 8mm attendues',
  'MEDIUM',
  'MEDIUM',
  CURRENT_DATE,
  true,
  CURRENT_TIMESTAMP + INTERVAL '12 hours'
),
-- Alert LOW - Température optimale
(
  'test-alert-004',
  (SELECT id_tantsaha FROM projet WHERE id_projet = 4 LIMIT 1),
  4,
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 4 LIMIT 1),
  'WARNING',
  'Semis',
  'Arachide',
  '🌡️ Conditions favorables au semis',
  'Températures idéales (25-28°C) et sol humide. Conditions parfaites pour le semis d\'arachides.',
  'Profitez de ces conditions optimales pour effectuer vos semis dans les 48h.',
  'Conditions optimales',
  'Température: 26°C, humidité sol: 65%',
  'LOW',
  'LOW',
  CURRENT_DATE + INTERVAL '1 day',
  true,
  CURRENT_TIMESTAMP + INTERVAL '72 hours'
);