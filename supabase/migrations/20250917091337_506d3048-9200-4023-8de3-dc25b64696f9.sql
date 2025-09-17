-- PHASE 1: VIDANGE DES DONNÉES OPÉRATIONNELLES
-- Supprimer les likes sur commentaires
TRUNCATE TABLE aimer_commentaire RESTART IDENTITY CASCADE;

-- Supprimer les likes sur projets
TRUNCATE TABLE aimer_projet RESTART IDENTITY CASCADE;

-- Supprimer les commentaires des projets
TRUNCATE TABLE commentaire RESTART IDENTITY CASCADE;

-- Supprimer l'historique des paiements agricoles
TRUNCATE TABLE historique_paiement RESTART IDENTITY CASCADE;

-- Supprimer l'historique des paiements d'investissements
TRUNCATE TABLE historique_paiement_invest RESTART IDENTITY CASCADE;

-- Supprimer les coûts par jalon de projet
TRUNCATE TABLE cout_jalon_projet RESTART IDENTITY CASCADE;

-- Supprimer les jalons spécifiques aux projets
TRUNCATE TABLE jalon_projet RESTART IDENTITY CASCADE;

-- Supprimer les relations projet-jalon (ancienne table)
TRUNCATE TABLE projet_jalon RESTART IDENTITY CASCADE;

-- Supprimer les cultures par projet
TRUNCATE TABLE projet_culture RESTART IDENTITY CASCADE;

-- Supprimer les investissements dans les projets
TRUNCATE TABLE investissement RESTART IDENTITY CASCADE;

-- Supprimer les projets agricoles
TRUNCATE TABLE projet RESTART IDENTITY CASCADE;

-- Supprimer les cultures par terrain
TRUNCATE TABLE terrain_culture RESTART IDENTITY CASCADE;

-- Supprimer les terrains agricoles
TRUNCATE TABLE terrain RESTART IDENTITY CASCADE;

-- PHASE 2: CRÉATION DE 18 AGRICULTEURS DANS LES RÉGIONS FIANARANTSOA ET TOLIARA
DO $$
DECLARE
    role_agriculteur_id INTEGER;
    user_ids UUID[] := ARRAY[
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
    ];
BEGIN
    -- Récupérer l'ID du rôle agriculteur
    SELECT id_role INTO role_agriculteur_id FROM role WHERE nom_role = 'agriculteur';
    
    -- Créer les 18 agriculteurs avec des UUIDs générés
    INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, id_role, photo_profil, created_at)
    VALUES 
    -- Région Amoron'i Mania (2 agriculteurs)
    (user_ids[1], 'Rakotomavo', 'Hery', 'hery.rakotomavo@example.mg', role_agriculteur_id, '/cultures/riz.jpeg', NOW()),
    (user_ids[2], 'Razafy', 'Hanta', 'hanta.razafy@example.mg', role_agriculteur_id, '/cultures/manioc.jpg', NOW()),
    
    -- Région Haute Matsiatra (3 agriculteurs)
    (user_ids[3], 'Randriamampionona', 'Jean', 'jean.randriamampionona@example.mg', role_agriculteur_id, '/cultures/arachide.jpg', NOW()),
    (user_ids[4], 'Rasolofo', 'Naina', 'naina.rasolofo@example.mg', role_agriculteur_id, '/cultures/haricot_blanc.jpg', NOW()),
    (user_ids[5], 'Rakotonirina', 'Fara', 'fara.rakotonirina@example.mg', role_agriculteur_id, '/cultures/pois_bambara.jpg', NOW()),
    
    -- Région Vatovavy-Fitovinany (2 agriculteurs)
    (user_ids[6], 'Rabe', 'Lanto', 'lanto.rabe@example.mg', role_agriculteur_id, '/cultures/riz.jpeg', NOW()),
    (user_ids[7], 'Raharimina', 'Vola', 'vola.raharimina@example.mg', role_agriculteur_id, '/cultures/manioc.jpg', NOW()),
    
    -- Région Atsimo-Atsinanana (2 agriculteurs)
    (user_ids[8], 'Rakotozafy', 'Mamy', 'mamy.rakotozafy@example.mg', role_agriculteur_id, '/cultures/arachide.jpg', NOW()),
    (user_ids[9], 'Ratsimba', 'Haja', 'haja.ratsimba@example.mg', role_agriculteur_id, '/cultures/haricot_blanc.jpg', NOW()),
    
    -- Région Ihorombe (1 agriculteur)
    (user_ids[10], 'Razafindrakoto', 'Solo', 'solo.razafindrakoto@example.mg', role_agriculteur_id, '/cultures/pois_bambara.jpg', NOW()),
    
    -- Région Atsimo-Andrefana (3 agriculteurs)
    (user_ids[11], 'Ramaroson', 'Koto', 'koto.ramaroson@example.mg', role_agriculteur_id, '/cultures/riz.jpeg', NOW()),
    (user_ids[12], 'Rakotoarisoa', 'Miora', 'miora.rakotoarisoa@example.mg', role_agriculteur_id, '/cultures/manioc.jpg', NOW()),
    (user_ids[13], 'Randriamanantena', 'Zo', 'zo.randriamanantena@example.mg', role_agriculteur_id, '/cultures/arachide.jpg', NOW()),
    
    -- Région Menabe (2 agriculteurs)
    (user_ids[14], 'Rasoamampionona', 'Tahina', 'tahina.rasoamampionona@example.mg', role_agriculteur_id, '/cultures/haricot_blanc.jpg', NOW()),
    (user_ids[15], 'Rafanomezantsoa', 'Bako', 'bako.rafanomezantsoa@example.mg', role_agriculteur_id, '/cultures/pois_bambara.jpg', NOW()),
    
    -- Région Androy (2 agriculteurs)
    (user_ids[16], 'Razanakolona', 'Fidy', 'fidy.razanakolona@example.mg', role_agriculteur_id, '/cultures/riz.jpeg', NOW()),
    (user_ids[17], 'Rakotondrabe', 'Tsiry', 'tsiry.rakotondrabe@example.mg', role_agriculteur_id, '/cultures/manioc.jpg', NOW()),
    
    -- Région Anosy (1 agriculteur)
    (user_ids[18], 'Ramanantsoa', 'Nivo', 'nivo.ramanantsoa@example.mg', role_agriculteur_id, '/cultures/arachide.jpg', NOW());

END $$;

-- PHASE 3: GÉNÉRATION DE 50 PROJETS DIVERSIFIÉS
DO $$
DECLARE
    -- Variables pour les IDs
    agriculteurs UUID[];
    techniciens UUID[];
    superviseurs UUID[];
    investisseurs UUID[];
    
    -- Variables pour la génération
    current_agriculteur UUID;
    current_technicien UUID;
    current_superviseur UUID;
    current_investisseur UUID;
    current_region INTEGER;
    current_district INTEGER;
    current_commune INTEGER;
    current_culture INTEGER;
    current_surface NUMERIC;
    current_titre VARCHAR;
    current_statut VARCHAR;
    terrain_id INTEGER;
    projet_id INTEGER;
    
    -- Compteurs
    projet_counter INTEGER := 0;
    i INTEGER;
    
    -- Arrays pour les cultures
    cultures_ids INTEGER[];
    photos_array TEXT[] := ARRAY['/cultures/riz.jpeg', '/cultures/manioc.jpg', '/cultures/arachide.jpg', '/cultures/haricot_blanc.jpg', '/cultures/pois_bambara.jpg'];
    
BEGIN
    -- Récupérer tous les utilisateurs par rôle
    SELECT ARRAY_AGG(id_utilisateur) INTO agriculteurs 
    FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
    WHERE r.nom_role = 'agriculteur';
    
    SELECT ARRAY_AGG(id_utilisateur) INTO techniciens 
    FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
    WHERE r.nom_role = 'technicien';
    
    SELECT ARRAY_AGG(id_utilisateur) INTO superviseurs 
    FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
    WHERE r.nom_role = 'superviseur';
    
    SELECT ARRAY_AGG(id_utilisateur) INTO investisseurs 
    FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
    WHERE r.nom_role = 'investisseur';
    
    -- Récupérer les IDs des cultures
    SELECT ARRAY_AGG(id_culture) INTO cultures_ids FROM culture;
    
    -- Vérification des données
    IF array_length(agriculteurs, 1) = 0 THEN
        RAISE EXCEPTION 'Aucun agriculteur trouvé';
    END IF;
    
    -- Génération des 50 projets
    FOR i IN 1..50 LOOP
        -- Sélection aléatoire des données
        current_agriculteur := agriculteurs[1 + (random() * array_length(agriculteurs, 1))::integer % array_length(agriculteurs, 1)];
        current_technicien := CASE WHEN array_length(techniciens, 1) > 0 THEN techniciens[1 + (random() * array_length(techniciens, 1))::integer % array_length(techniciens, 1)] ELSE NULL END;
        current_superviseur := CASE WHEN array_length(superviseurs, 1) > 0 THEN superviseurs[1 + (random() * array_length(superviseurs, 1))::integer % array_length(superviseurs, 1)] ELSE NULL END;
        current_culture := cultures_ids[1 + (random() * array_length(cultures_ids, 1))::integer % array_length(cultures_ids, 1)];
        
        -- Sélection de région/district/commune des provinces Fianarantsoa et Toliara
        SELECT id_region INTO current_region FROM region WHERE id_province IN (3, 4) ORDER BY random() LIMIT 1;
        SELECT id_district INTO current_district FROM district WHERE id_region = current_region ORDER BY random() LIMIT 1;
        SELECT id_commune INTO current_commune FROM commune WHERE id_district = current_district ORDER BY random() LIMIT 1;
        
        -- Surface aléatoire entre 0.5 et 5 hectares
        current_surface := 0.5 + (random() * 4.5);
        current_surface := ROUND(current_surface, 2);
        
        -- Génération du titre du projet
        SELECT nom_culture INTO current_titre FROM culture WHERE id_culture = current_culture;
        current_titre := 'Culture de ' || current_titre || ' - ' || i;
        
        -- Détermination du statut selon la répartition
        CASE 
            WHEN i <= 12 THEN current_statut := 'en_attente_validation';
            WHEN i <= 27 THEN current_statut := 'en_financement';
            WHEN i <= 40 THEN current_statut := 'validé';
            ELSE current_statut := 'en_cours';
        END CASE;
        
        -- Création du terrain validé
        INSERT INTO terrain (
            id_utilisateur, surface_proposee_ha, surface_validee_ha, 
            acces_eau, acces_route, id_region, id_district, id_commune,
            statut, created_at, created_by
        ) VALUES (
            current_agriculteur, current_surface, current_surface,
            (random() > 0.3), (random() > 0.2), current_region, current_district, current_commune,
            true, NOW(), current_agriculteur::text
        ) RETURNING id_terrain INTO terrain_id;
        
        -- Création du projet
        INSERT INTO projet (
            titre, description, surface_ha, statut,
            id_tantsaha, id_technicien, id_superviseur,
            id_terrain, id_region, id_district, id_commune,
            photos, created_at, created_by,
            date_validation, date_debut_production
        ) VALUES (
            current_titre,
            'Projet de culture sur ' || current_surface || ' hectares dans la région.',
            current_surface,
            current_statut,
            current_agriculteur,
            current_technicien,
            current_superviseur,
            terrain_id,
            current_region,
            current_district,
            current_commune,
            photos_array[1 + (random() * array_length(photos_array, 1))::integer % array_length(photos_array, 1)],
            NOW(),
            current_agriculteur::text,
            CASE WHEN current_statut IN ('validé', 'en_cours') THEN NOW() - INTERVAL '1 month' * random() ELSE NULL END,
            CASE WHEN current_statut = 'en_cours' THEN NOW() - INTERVAL '15 days' * random() ELSE NULL END
        ) RETURNING id_projet INTO projet_id;
        
        -- Insertion de la culture du projet
        INSERT INTO projet_culture (
            id_projet, id_culture, cout_exploitation_previsionnel, 
            rendement_previsionnel, created_at, created_by
        ) VALUES (
            projet_id, current_culture,
            current_surface * (800000 + random() * 400000), -- Coût entre 800k et 1.2M par hectare
            current_surface * (2 + random() * 3), -- Rendement 2-5 tonnes par hectare
            NOW(), current_agriculteur::text
        );
        
        -- Génération des investissements selon le statut
        IF current_statut IN ('en_financement', 'validé', 'en_cours') AND array_length(investisseurs, 1) > 0 THEN
            DECLARE
                cout_total NUMERIC;
                montant_investissement NUMERIC;
                nb_investisseurs INTEGER;
                j INTEGER;
            BEGIN
                cout_total := current_surface * (800000 + random() * 400000);
                
                -- Déterminer le montant selon le statut
                CASE current_statut
                    WHEN 'en_financement' THEN 
                        montant_investissement := cout_total * (0.3 + random() * 0.5); -- 30% à 80%
                        nb_investisseurs := 1 + (random() * 2)::integer; -- 1-3 investisseurs
                    WHEN 'validé' THEN 
                        montant_investissement := cout_total * (0.95 + random() * 0.05); -- 95% à 100%
                        nb_investisseurs := 1 + (random() * 3)::integer; -- 1-4 investisseurs
                    WHEN 'en_cours' THEN 
                        montant_investissement := cout_total; -- 100%
                        nb_investisseurs := 1 + (random() * 3)::integer; -- 1-4 investisseurs
                END CASE;
                
                -- Créer les investissements
                FOR j IN 1..nb_investisseurs LOOP
                    current_investisseur := investisseurs[1 + (random() * array_length(investisseurs, 1))::integer % array_length(investisseurs, 1)];
                    INSERT INTO investissement (
                        id_projet, id_investisseur, montant,
                        date_decision_investir, statut_paiement,
                        created_at, created_by
                    ) VALUES (
                        projet_id, current_investisseur, 
                        montant_investissement / nb_investisseurs,
                        NOW() - INTERVAL '1 month' * random(),
                        CASE WHEN current_statut IN ('validé', 'en_cours') THEN 'payé' ELSE 'en_attente' END,
                        NOW(), current_investisseur::text
                    );
                END LOOP;
            END;
        END IF;
        
        projet_counter := projet_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Génération terminée: % projets créés', projet_counter;
END $$;

-- PHASE 4: GÉNÉRATION DES JALONS POUR LES PROJETS EN COURS
DO $$
DECLARE
    projet_en_cours RECORD;
    jalon_agricole RECORD;
    jalon_projet_id INTEGER;
BEGIN
    -- Pour chaque projet en cours, générer les jalons
    FOR projet_en_cours IN 
        SELECT p.id_projet, p.surface_ha, p.date_debut_production, pc.id_culture
        FROM projet p
        JOIN projet_culture pc ON p.id_projet = pc.id_projet
        WHERE p.statut = 'en_cours' AND p.date_debut_production IS NOT NULL
    LOOP
        -- Créer les jalons pour ce projet
        FOR jalon_agricole IN
            SELECT * FROM jalon_agricole 
            WHERE id_culture = projet_en_cours.id_culture
            ORDER BY delai_apres_lancement
        LOOP
            INSERT INTO jalon_projet (
                id_projet, id_jalon_agricole, date_previsionnelle,
                statut, created_at
            ) VALUES (
                projet_en_cours.id_projet,
                jalon_agricole.id_jalon_agricole,
                projet_en_cours.date_debut_production + INTERVAL '1 day' * jalon_agricole.delai_apres_lancement,
                CASE 
                    WHEN projet_en_cours.date_debut_production + INTERVAL '1 day' * jalon_agricole.delai_apres_lancement < NOW() 
                    THEN CASE WHEN random() > 0.7 THEN 'Terminé' ELSE 'En cours' END
                    ELSE 'Prévu'
                END,
                NOW()
            ) RETURNING id_jalon_projet INTO jalon_projet_id;
            
            -- Créer les coûts associés aux jalons
            INSERT INTO cout_jalon_projet (
                id_projet, id_jalon_projet, type_depense,
                montant_par_hectare, montant_total, statut_paiement,
                created_at
            )
            SELECT 
                projet_en_cours.id_projet, jalon_projet_id, cjr.type_depense,
                cjr.montant_par_hectare, 
                cjr.montant_par_hectare * projet_en_cours.surface_ha,
                'Non engagé',
                NOW()
            FROM cout_jalon_reference cjr
            WHERE cjr.id_jalon_agricole = jalon_agricole.id_jalon_agricole 
            AND cjr.id_culture = projet_en_cours.id_culture;
        END LOOP;
    END LOOP;
END $$;

-- PHASE 5: GÉNÉRATION DE DONNÉES D'INTERACTION (LIKES ET COMMENTAIRES)
DO $$
DECLARE
    projet_record RECORD;
    utilisateur_id UUID;
    nb_likes INTEGER;
    nb_commentaires INTEGER;
    i INTEGER;
    utilisateurs_actifs UUID[];
BEGIN
    -- Récupérer tous les utilisateurs actifs
    SELECT ARRAY_AGG(id_utilisateur) INTO utilisateurs_actifs FROM utilisateur;
    
    -- Pour chaque projet, générer des interactions
    FOR projet_record IN SELECT id_projet FROM projet LOOP
        -- Générer des likes (2-15 par projet)
        nb_likes := 2 + (random() * 13)::integer;
        FOR i IN 1..nb_likes LOOP
            utilisateur_id := utilisateurs_actifs[1 + (random() * array_length(utilisateurs_actifs, 1))::integer % array_length(utilisateurs_actifs, 1)];
            INSERT INTO aimer_projet (id_projet, id_utilisateur, created_at, created_by)
            VALUES (projet_record.id_projet, utilisateur_id, NOW(), utilisateur_id::text)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        -- Générer des commentaires (1-8 par projet)
        nb_commentaires := 1 + (random() * 7)::integer;
        FOR i IN 1..nb_commentaires LOOP
            utilisateur_id := utilisateurs_actifs[1 + (random() * array_length(utilisateurs_actifs, 1))::integer % array_length(utilisateurs_actifs, 1)];
            INSERT INTO commentaire (id_projet, id_utilisateur, texte, date_creation, date_modification, created_by)
            VALUES (
                projet_record.id_projet, 
                utilisateur_id,
                CASE (random() * 5)::integer
                    WHEN 0 THEN 'Très intéressant ce projet !'
                    WHEN 1 THEN 'Bonne chance pour la récolte.'
                    WHEN 2 THEN 'J''ai hâte de voir les résultats.'
                    WHEN 3 THEN 'Excellent choix de culture pour cette région.'
                    ELSE 'Projet prometteur, félicitations !'
                END,
                NOW() - INTERVAL '1 day' * (random() * 30),
                NOW() - INTERVAL '1 day' * (random() * 30),
                utilisateur_id::text
            );
        END LOOP;
    END LOOP;
END $$;

-- PHASE 6: MISE À JOUR DES SÉQUENCES
SELECT setval('terrain_id_terrain_seq', COALESCE((SELECT MAX(id_terrain) FROM terrain), 1));
SELECT setval('projet_id_projet_seq', COALESCE((SELECT MAX(id_projet) FROM projet), 1));
SELECT setval('projet_culture_id_projet_culture_seq', COALESCE((SELECT MAX(id_projet_culture) FROM projet_culture), 1));
SELECT setval('investissement_id_investissement_seq', COALESCE((SELECT MAX(id_investissement) FROM investissement), 1));
SELECT setval('jalon_projet_id_jalon_projet_seq', COALESCE((SELECT MAX(id_jalon_projet) FROM jalon_projet), 1));
SELECT setval('cout_jalon_projet_id_cout_jalon_projet_seq', COALESCE((SELECT MAX(id_cout_jalon_projet) FROM cout_jalon_projet), 1));
SELECT setval('aimer_projet_id_aimer_projet_seq', COALESCE((SELECT MAX(id_aimer_projet) FROM aimer_projet), 1));
SELECT setval('commentaire_id_commentaire_seq', COALESCE((SELECT MAX(id_commentaire) FROM commentaire), 1));

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '=== GÉNÉRATION TERMINÉE AVEC SUCCÈS ===';
    RAISE NOTICE 'Données vidées et 50 projets de test générés';
    RAISE NOTICE '18 nouveaux agriculteurs créés dans les régions de Fianarantsoa et Toliara';
    RAISE NOTICE 'NOTE: Les mots de passe devront être configurés via l''interface d''authentification';
    RAISE NOTICE 'Répartition: 12 en attente, 15 en financement, 13 validés, 10 en cours';
END $$;