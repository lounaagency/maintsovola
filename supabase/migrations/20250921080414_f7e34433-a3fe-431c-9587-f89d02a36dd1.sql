-- ============================================================================
-- MIGRATION COMPLÈTE: VIDANGE ET NOUVELLES DONNÉES DE DÉMONSTRATION (CORRIGÉE)
-- ============================================================================

-- 1. MISE À JOUR DE LA FONCTION generate_project_milestones pour gérer les deux statuts
CREATE OR REPLACE FUNCTION public.generate_project_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Si le statut passe à 'en_cours' OU 'en cours', générer jalons et coûts automatiquement
    IF (NEW.statut = 'en_cours' OR NEW.statut = 'en cours') AND 
       (OLD.statut IS NULL OR (OLD.statut != 'en_cours' AND OLD.statut != 'en cours')) THEN
        
        -- Insérer les jalons du projet basés sur les jalons agricoles des cultures
        INSERT INTO jalon_projet (
            id_projet,
            id_jalon_agricole,
            date_previsionnelle,
            statut
        )
        SELECT 
            NEW.id_projet,
            ja.id_jalon_agricole,
            NEW.date_debut_production + INTERVAL '1 day' * ja.delai_apres_lancement,
            'Prévu'
        FROM projet_culture pc
        JOIN jalon_agricole ja ON pc.id_culture = ja.id_culture
        WHERE pc.id_projet = NEW.id_projet
        ON CONFLICT DO NOTHING;

        -- Insérer les coûts basés sur les coûts de référence
        INSERT INTO cout_jalon_projet (
            id_projet,
            id_jalon_projet,
            type_depense,
            montant_par_hectare,
            montant_total,
            statut_paiement
        )
        SELECT 
            jp.id_projet,
            jp.id_jalon_projet,
            cjr.type_depense,
            cjr.montant_par_hectare,
            cjr.montant_par_hectare * NEW.surface_ha,
            'Non engagé'
        FROM jalon_projet jp
        JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
        JOIN projet_culture pc ON jp.id_projet = pc.id_projet
        JOIN cout_jalon_reference cjr ON (ja.id_jalon_agricole = cjr.id_jalon_agricole AND pc.id_culture = cjr.id_culture)
        WHERE jp.id_projet = NEW.id_projet
        ON CONFLICT (id_jalon_projet, type_depense) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 2. VIDANGE COMPLÈTE DES DONNÉES OPÉRATIONNELLES
TRUNCATE TABLE aimer_commentaire RESTART IDENTITY CASCADE;
TRUNCATE TABLE aimer_projet RESTART IDENTITY CASCADE;
TRUNCATE TABLE commentaire RESTART IDENTITY CASCADE;
TRUNCATE TABLE historique_paiement RESTART IDENTITY CASCADE;
TRUNCATE TABLE historique_paiement_invest RESTART IDENTITY CASCADE;
TRUNCATE TABLE cout_jalon_projet RESTART IDENTITY CASCADE;
TRUNCATE TABLE jalon_projet RESTART IDENTITY CASCADE;
TRUNCATE TABLE projet_jalon RESTART IDENTITY CASCADE;
TRUNCATE TABLE projet_culture RESTART IDENTITY CASCADE;
TRUNCATE TABLE investissement RESTART IDENTITY CASCADE;
TRUNCATE TABLE projet RESTART IDENTITY CASCADE;
TRUNCATE TABLE terrain RESTART IDENTITY CASCADE;

-- 3. CRÉATION DE NOUVELLES DONNÉES DE DÉMONSTRATION

-- 3.1 Insertion de terrains validés (8 terrains répartis géographiquement)
INSERT INTO terrain (
    id_tantsaha, surface_proposee, surface_validee, 
    acces_eau, acces_route, statut, id_commune, id_district, id_region,
    geom, id_technicien, id_superviseur, created_by
) VALUES
-- Région Analamanga (Antananarivo)
((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rakoto' LIMIT 1), 2.5, 2.5, true, true, true, 1, 1, 1, 
 ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andrianasolo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rakoto' LIMIT 1)::text),

((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ravelo' LIMIT 1), 1.8, 1.8, true, false, true, 1, 1, 1,
 ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andriamahefa' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ravelo' LIMIT 1)::text),

-- Région Vakinankaratra  
((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ranaivo' LIMIT 1), 3.2, 3.0, true, true, true, 2, 2, 2,
 ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andrianasolo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ranaivo' LIMIT 1)::text),

((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Randrianasolo' LIMIT 1), 2.8, 2.8, false, true, true, 2, 2, 2,
 ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andriamahefa' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Randrianasolo' LIMIT 1)::text),

-- Région Itasy
((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rakoto' LIMIT 1), 4.5, 4.2, true, true, true, 3, 3, 3,
 ST_GeomFromText('POLYGON((46.8 -19.1, 46.83 -19.1, 46.83 -19.13, 46.8 -19.13, 46.8 -19.1))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andrianasolo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rakoto' LIMIT 1)::text),

((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ravelo' LIMIT 1), 1.5, 1.5, true, false, true, 3, 3, 3,
 ST_GeomFromText('POLYGON((46.9 -19.2, 46.92 -19.2, 46.92 -19.22, 46.9 -19.22, 46.9 -19.2))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andriamahefa' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ravelo' LIMIT 1)::text),

-- Autres terrains
((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ranaivo' LIMIT 1), 3.8, 3.5, true, true, true, 1, 1, 1,
 ST_GeomFromText('POLYGON((47.6 -18.8, 47.63 -18.8, 47.63 -18.83, 47.6 -18.83, 47.6 -18.8))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andrianasolo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ranaivo' LIMIT 1)::text),

((SELECT id_utilisateur FROM utilisateur WHERE nom = 'Randrianasolo' LIMIT 1), 2.2, 2.0, false, true, true, 2, 2, 2,
 ST_GeomFromText('POLYGON((47.15 -19.7, 47.17 -19.7, 47.17 -19.72, 47.15 -19.72, 47.15 -19.7))', 4326),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Andriamahefa' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Rasolofo' LIMIT 1),
 (SELECT id_utilisateur FROM utilisateur WHERE nom = 'Randrianasolo' LIMIT 1)::text);

-- 3.2 Insertion de projets avec statuts compatibles UI
INSERT INTO projet (
    id_tantsaha, id_terrain, titre, description, surface_ha, statut,
    id_commune, id_district, id_region, geom, date_debut_production,
    id_technicien, id_superviseur, created_by
) VALUES
-- 5 Projets en financement
('8b2e1f43-4c56-4789-9012-3456789abcde', 1, 'Riziculture Intensive Analamanga', 'Production de riz SRI haute qualité avec système d''irrigation moderne', 2.5, 'en financement', 1, 1, 1,
 ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326), '2024-11-15',
 '9c3f2a54-5d67-589a-a123-456789abcdef', '1e5d8c91-8f23-4567-890a-bcdef1234567', '8b2e1f43-4c56-4789-9012-3456789abcde'),

('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 2, 'Haricot Blanc Bio Vakinankaratra', 'Culture biologique de haricot blanc pour export', 1.8, 'en financement', 2, 2, 2,
 ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326), '2024-12-01',
 '2a6b9f72-1c48-5d39-b567-890abcdef123', '1e5d8c91-8f23-4567-890a-bcdef1234567', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'),

('f9e8d7c6-b5a4-9382-7160-54321098fedc', 3, 'Manioc Transformation Itasy', 'Production de manioc avec unité de transformation', 3.0, 'en financement', 3, 3, 3,
 ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326), '2024-12-15',
 '4d8e2f91-3a67-5b89-c012-345678901abc', '1e5d8c91-8f23-4567-890a-bcdef1234567', 'f9e8d7c6-b5a4-9382-7160-54321098fedc'),

('3c4d5e6f-7a8b-9c0d-1e2f-3456789abcde', 4, 'Pois Bambara Durable', 'Culture traditionnelle améliorée de pois bambara', 2.8, 'en financement', 2, 2, 2,
 ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326), '2025-01-10',
 '9c3f2a54-5d67-589a-a123-456789abcdef', '1e5d8c91-8f23-4567-890a-bcdef1234567', '3c4d5e6f-7a8b-9c0d-1e2f-3456789abcdef'),

('5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0', 5, 'Arachide Premium Itasy', 'Production d''arachide haut de gamme certifiée', 4.2, 'en financement', 3, 3, 3,
 ST_GeomFromText('POLYGON((46.8 -19.1, 46.83 -19.1, 46.83 -19.13, 46.8 -19.13, 46.8 -19.1))', 4326), '2025-02-01',
 '2a6b9f72-1c48-5d39-b567-890abcdef123', '1e5d8c91-8f23-4567-890a-bcdef1234567', '5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0'),

-- 5 Projets en cours
('8b2e1f43-4c56-4789-9012-3456789abcde', 6, 'Riz Pluvial Innovation', 'Système innovant de riziculture pluviale', 1.5, 'en cours', 3, 3, 3,
 ST_GeomFromText('POLYGON((46.9 -19.2, 46.92 -19.2, 46.92 -19.22, 46.9 -19.22, 46.9 -19.2))', 4326), '2024-09-01',
 '4d8e2f91-3a67-5b89-c012-345678901abc', '1e5d8c91-8f23-4567-890a-bcdef1234567', '8b2e1f43-4c56-4789-9012-3456789abcde'),

('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 7, 'Haricot Associé Multi-Culture', 'Association haricot-manioc-arachide', 3.5, 'en cours', 1, 1, 1,
 ST_GeomFromText('POLYGON((47.6 -18.8, 47.63 -18.8, 47.63 -18.83, 47.6 -18.83, 47.6 -18.8))', 4326), '2024-08-15',
 '9c3f2a54-5d67-589a-a123-456789abcdef', '1e5d8c91-8f23-4567-890a-bcdef1234567', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'),

('f9e8d7c6-b5a4-9382-7160-54321098fedc', 8, 'Manioc Séchage Solaire', 'Production avec séchage solaire intégré', 2.0, 'en cours', 2, 2, 2,
 ST_GeomFromText('POLYGON((47.15 -19.7, 47.17 -19.7, 47.17 -19.72, 47.15 -19.72, 47.15 -19.7))', 4326), '2024-07-20',
 '2a6b9f72-1c48-5d39-b567-890abcdef123', '1e5d8c91-8f23-4567-890a-bcdef1234567', 'f9e8d7c6-b5a4-9382-7160-54321098fedc'),

('3c4d5e6f-7a8b-9c0d-1e2f-3456789abcde', 1, 'Pois Bambara Coopératif', 'Projet coopératif de pois bambara', 2.5, 'en cours', 1, 1, 1,
 ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326), '2024-09-10',
 '4d8e2f91-3a67-5b89-c012-345678901abc', '1e5d8c91-8f23-4567-890a-bcdef1234567', '3c4d5e6f-7a8b-9c0d-1e2f-3456789abcde'),

('5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0', 2, 'Arachide Export Premium', 'Production d''arachide pour marché export', 1.8, 'en cours', 2, 2, 2,
 ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326), '2024-08-01',
 '9c3f2a54-5d67-589a-a123-456789abcdef', '1e5d8c91-8f23-4567-890a-bcdef1234567', '5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0'),

-- 2 Projets terminés
('8b2e1f43-4c56-4789-9012-3456789abcde', 3, 'Riz Traditionnel Amélioré', 'Première récolte de riz amélioré terminée', 3.0, 'terminé', 3, 3, 3,
 ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326), '2024-03-01',
 '2a6b9f72-1c48-5d39-b567-890abcdef123', '1e5d8c91-8f23-4567-890a-bcdef1234567', '8b2e1f43-4c56-4789-9012-3456789abcde'),

('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 4, 'Haricot Blanc Pilot', 'Projet pilote de haricot blanc terminé avec succès', 2.8, 'terminé', 2, 2, 2,
 ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326), '2024-02-15',
 '4d8e2f91-3a67-5b89-c012-345678901abc', '1e5d8c91-8f23-4567-890a-bcdef1234567', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');

-- 3.3 Insertion des cultures par projet
INSERT INTO projet_culture (id_projet, id_culture, cout_exploitation_previsionnel, rendement_previsionnel, created_by) VALUES
(1, 1, 850000, 4.5, '8b2e1f43-4c56-4789-9012-3456789abcde'), -- Riz
(2, 2, 650000, 2.8, 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'), -- Haricot blanc
(3, 3, 750000, 12.0, 'f9e8d7c6-b5a4-9382-7160-54321098fedc'), -- Manioc
(4, 4, 420000, 1.8, '3c4d5e6f-7a8b-9c0d-1e2f-3456789abcde'), -- Pois bambara
(5, 5, 680000, 2.2, '5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0'), -- Arachide

(6, 1, 780000, 4.2, '8b2e1f43-4c56-4789-9012-3456789abcde'), -- Riz
(7, 2, 620000, 2.5, 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'), -- Haricot blanc
(8, 3, 680000, 11.5, 'f9e8d7c6-b5a4-9382-7160-54321098fedc'), -- Manioc
(9, 4, 380000, 1.6, '3c4d5e6f-7a8b-9c0d-1e2f-3456789abcde'), -- Pois bambara
(10, 5, 640000, 2.0, '5f6a7b8c-9d0e-1f2a-3b4c-56789abcdef0'), -- Arachide

(11, 1, 820000, 4.8, '8b2e1f43-4c56-4789-9012-3456789abcde'), -- Riz (terminé)
(12, 2, 680000, 3.2, 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'); -- Haricot blanc (terminé)

-- 3.4 Insertion d'investissements réalistes
INSERT INTO investissement (
    id_projet, id_investisseur, montant, date_decision_investir, date_paiement, 
    statut_paiement, reference_paiement, created_by
) VALUES
-- Investissements pour projets en financement
(1, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 2125000, '2024-10-15', '2024-10-20', 'effectué', 'INV-001-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(1, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 1275000, '2024-10-18', '2024-10-22', 'effectué', 'INV-002-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(2, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1170000, '2024-10-25', '2024-10-28', 'effectué', 'INV-003-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(3, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 2250000, '2024-11-01', '2024-11-05', 'effectué', 'INV-004-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(4, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1176000, '2024-11-08', '2024-11-12', 'effectué', 'INV-005-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(5, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 2856000, '2024-11-15', '2024-11-18', 'effectué', 'INV-006-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),

-- Investissements pour projets en cours
(6, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1170000, '2024-08-20', '2024-08-25', 'effectué', 'INV-007-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(7, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 2170000, '2024-08-10', '2024-08-15', 'effectué', 'INV-008-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(8, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1360000, '2024-07-15', '2024-07-20', 'effectué', 'INV-009-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(9, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 950000, '2024-09-05', '2024-09-10', 'effectué', 'INV-010-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(10, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1152000, '2024-07-25', '2024-07-30', 'effectué', 'INV-011-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),

-- Investissements pour projets terminés
(11, '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def', 2460000, '2024-02-10', '2024-02-15', 'effectué', 'INV-012-2024', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(12, '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678', 1904000, '2024-02-05', '2024-02-10', 'effectué', 'INV-013-2024', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678');

-- 3.5 Insertion de l'historique des paiements d'investissement
INSERT INTO historique_paiement_invest (
    id_investissement, montant, date_paiement, methode_paiement, 
    reference_transaction, numero_telephone, statut, created_by
) VALUES
(1, 2125000, '2024-10-20', 'mvola', 'TXN-001-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(2, 1275000, '2024-10-22', 'airtel_money', 'TXN-002-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(3, 1170000, '2024-10-28', 'mvola', 'TXN-003-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(4, 2250000, '2024-11-05', 'airtel_money', 'TXN-004-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(5, 1176000, '2024-11-12', 'mvola', 'TXN-005-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(6, 2856000, '2024-11-18', 'airtel_money', 'TXN-006-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(7, 1170000, '2024-08-25', 'mvola', 'TXN-007-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(8, 2170000, '2024-08-15', 'airtel_money', 'TXN-008-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(9, 1360000, '2024-07-20', 'mvola', 'TXN-009-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(10, 950000, '2024-09-10', 'airtel_money', 'TXN-010-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(11, 1152000, '2024-07-30', 'mvola', 'TXN-011-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678'),
(12, 2460000, '2024-02-15', 'airtel_money', 'TXN-012-2024', '0331234567', 'effectué', '6f8e7d9c-2b1a-4c5d-6e7f-890abc123def'),
(13, 1904000, '2024-02-10', 'mvola', 'TXN-013-2024', '0341234567', 'effectué', '7a9b8c2d-3e4f-5a6b-7c8d-9e0f12345678');

-- 3.6 Déclencher la génération des jalons pour les projets 'en cours'
UPDATE projet SET statut = 'en cours' WHERE statut = 'en cours';

-- 3.7 Mise à jour manuelle du statut de quelques jalons pour simuler l'avancement
UPDATE jalon_projet 
SET statut = 'Terminé', date_reelle = CURRENT_DATE - INTERVAL '10 days'
WHERE id_projet IN (6, 7, 8) AND id_jalon_projet IN (
    SELECT id_jalon_projet 
    FROM jalon_projet jp2 
    JOIN jalon_agricole ja ON jp2.id_jalon_agricole = ja.id_jalon_agricole
    WHERE jp2.id_projet IN (6, 7, 8) 
    AND ja.delai_apres_lancement <= 30
    LIMIT 3
);

UPDATE jalon_projet 
SET statut = 'En cours', date_reelle = CURRENT_DATE - INTERVAL '3 days'
WHERE id_projet IN (9, 10) AND id_jalon_projet IN (
    SELECT id_jalon_projet 
    FROM jalon_projet jp2 
    JOIN jalon_agricole ja ON jp2.id_jalon_agricole = ja.id_jalon_agricole
    WHERE jp2.id_projet IN (9, 10) 
    AND ja.delai_apres_lancement <= 60
    LIMIT 2
);

-- 3.8 Insertion de quelques paiements aux techniciens
INSERT INTO historique_paiement (
    id_projet, montant, date_paiement, type_paiement, reference_paiement,
    id_technicien, id_responsable_financier, observation, statut_justificatif
) VALUES
(6, 450000, '2024-09-15', 'mobile_banking', 'PAY-TECH-001', 
 '4d8e2f91-3a67-5b89-c012-345678901abc', '0d1e2f3a-4b5c-6d7e-8f90-123456789abc', 
 'Paiement jalon préparation terrain', 'valide'),
(7, 380000, '2024-09-20', 'mobile_banking', 'PAY-TECH-002',
 '9c3f2a54-5d67-589a-a123-456789abcdef', '0d1e2f3a-4b5c-6d7e-8f90-123456789abc',
 'Paiement jalon semis', 'valide'),
(8, 320000, '2024-08-25', 'cheque', 'CHQ-001-2024',
 '2a6b9f72-1c48-5d39-b567-890abcdef123', '0d1e2f3a-4b5c-6d7e-8f90-123456789abc',
 'Paiement jalon entretien', 'valide');

-- 4. VÉRIFICATIONS POST-MIGRATION
DO $$
DECLARE
    projet_count INTEGER;
    terrain_count INTEGER;
    investissement_count INTEGER;
    jalon_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO projet_count FROM projet;
    SELECT COUNT(*) INTO terrain_count FROM terrain;
    SELECT COUNT(*) INTO investissement_count FROM investissement;
    SELECT COUNT(*) INTO jalon_count FROM jalon_projet;
    
    RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS:';
    RAISE NOTICE '   - % projets créés (5 en financement, 5 en cours, 2 terminés)', projet_count;
    RAISE NOTICE '   - % terrains validés', terrain_count;
    RAISE NOTICE '   - % investissements', investissement_count;
    RAISE NOTICE '   - % jalons de projet générés', jalon_count;
    RAISE NOTICE '📊 Rechargez votre page (Ctrl+F5) pour voir les nouvelles données!';
END $$;