-- Insert test weather alerts for UI testing
INSERT INTO public.weather_alerts (
  id, type, title, message, recommendation, jalon_id, projet_id, 
  culture_type, intervention_type, date_previsionnelle, weather_reason, 
  priority, is_active
) VALUES
-- Alert CRITICAL - Forte pluie pendant recolte
(
  'test-alert-001',
  'URGENT',
  'Recolte menacee par forte pluie',
  'Une forte pluie est prevue demain pendant votre recolte de riz. Risque de perte importante de rendement.',
  'Reportez la recolte de 2-3 jours ou protegez la recolte avec des baches impermeables.',
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 1 LIMIT 1),
  1,
  'Riz',
  'Recolte',
  CURRENT_DATE + INTERVAL '1 day',
  'Precipitations prevues: 45mm en 6h',
  'CRITICAL',
  true
),
-- Alert HIGH - Vent fort pour traitement
(
  'test-alert-002',
  'POSTPONE',
  'Vent fort - Report traitement',
  'Vents forts prevus (35 km/h) pendant votre traitement phytosanitaire. Risque de derive du produit.',
  'Attendez une accalmie. Traitez tot le matin (6h-8h) quand le vent sera plus faible.',
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 2 LIMIT 1),
  2,
  'Manioc',
  'Traitement phytosanitaire',
  CURRENT_DATE,
  'Rafales jusqu a 35 km/h prevues',
  'HIGH',
  true
),
-- Alert MEDIUM - Irrigation avec legere pluie
(
  'test-alert-003',
  'WARNING',
  'Irrigation non necessaire',
  'Legere pluie prevue (8mm) dans les prochaines heures. Votre irrigation programmee pourrait etre superflue.',
  'Annulez l irrigation programmee pour aujourd hui. Surveillez l humidite du sol demain.',
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 3 LIMIT 1),
  3,
  'Haricot',
  'Irrigation',
  CURRENT_DATE,
  'Precipitations: 8mm attendues',
  'MEDIUM',
  true
),
-- Alert LOW - Temperature optimale
(
  'test-alert-004',
  'WARNING',
  'Conditions favorables au semis',
  'Temperatures ideales (25-28°C) et sol humide. Conditions parfaites pour le semis d arachides.',
  'Profitez de ces conditions optimales pour effectuer vos semis dans les 48h.',
  (SELECT id_jalon_projet FROM jalon_projet WHERE id_projet = 4 LIMIT 1),
  4,
  'Arachide',
  'Semis',
  CURRENT_DATE + INTERVAL '1 day',
  'Temperature: 26°C, humidite sol: 65%',
  'LOW',
  true
);