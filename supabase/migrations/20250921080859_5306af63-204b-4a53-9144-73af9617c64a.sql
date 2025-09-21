-- ============================================================================
-- VIDANGE + RÉINSERTION DONNÉES DÉMO (robuste aux rôles et FK)
-- ============================================================================

-- 0) Sécurité: on utilise uniquement des IDs utilisateurs existants

-- 1) Purge des données opérationnelles (en cascade)
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

-- 2) Mise à jour de la fonction (ne pas dupliquer à l'update vers 'temp')
CREATE OR REPLACE FUNCTION public.generate_project_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Générer uniquement quand on passe vers 'en cours'
    IF NEW.statut = 'en cours' AND (OLD.statut IS DISTINCT FROM NEW.statut) THEN
        -- Insérer les jalons
        INSERT INTO jalon_projet (id_projet, id_jalon_agricole, date_previsionnelle, statut)
        SELECT NEW.id_projet, ja.id_jalon_agricole,
               NEW.date_debut_production + (ja.delai_apres_lancement || ' days')::interval,
               'Prévu'
        FROM projet_culture pc
        JOIN jalon_agricole ja ON pc.id_culture = ja.id_culture
        WHERE pc.id_projet = NEW.id_projet
        ON CONFLICT DO NOTHING;

        -- Insérer les coûts associés
        INSERT INTO cout_jalon_projet (id_projet, id_jalon_projet, type_depense, montant_par_hectare, montant_total, statut_paiement)
        SELECT jp.id_projet, jp.id_jalon_projet, cjr.type_depense, cjr.montant_par_hectare,
               cjr.montant_par_hectare * NEW.surface_ha, 'Non engagé'
        FROM jalon_projet jp
        JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
        JOIN projet_culture pc ON jp.id_projet = pc.id_projet
        JOIN cout_jalon_reference cjr ON (ja.id_jalon_agricole = cjr.id_jalon_agricole AND pc.id_culture = cjr.id_culture)
        WHERE jp.id_projet = NEW.id_projet
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$function$;

-- 3) Données de démonstration (utilise des IDs existants)
DO $$
DECLARE
  v_sup uuid;
  v_tech1 uuid;
  v_tech2 uuid;
  v_inv1 uuid;
  v_fin uuid;
  v_s1 uuid; v_s2 uuid; v_s3 uuid; v_s4 uuid;
BEGIN
  -- Récup rôles
  SELECT u.id_utilisateur INTO v_sup FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='superviseur' LIMIT 1;
  IF v_sup IS NULL THEN RAISE EXCEPTION 'Aucun superviseur disponible.'; END IF;

  SELECT u.id_utilisateur INTO v_tech1 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='technicien' ORDER BY random() LIMIT 1;
  IF v_tech1 IS NULL THEN RAISE EXCEPTION 'Aucun technicien disponible.'; END IF;
  SELECT u.id_utilisateur INTO v_tech2 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='technicien' AND u.id_utilisateur <> v_tech1 ORDER BY random() LIMIT 1;
  IF v_tech2 IS NULL THEN v_tech2 := v_tech1; END IF;

  SELECT u.id_utilisateur INTO v_inv1 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='investisseur' ORDER BY random() LIMIT 1;
  IF v_inv1 IS NULL THEN SELECT u.id_utilisateur INTO v_inv1 FROM utilisateur u ORDER BY random() LIMIT 1; END IF;

  SELECT u.id_utilisateur INTO v_fin FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='financier' ORDER BY random() LIMIT 1;

  -- 4 simples (agriculteurs démo)
  SELECT u.id_utilisateur INTO v_s1 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='simple' ORDER BY random() LIMIT 1;
  SELECT u.id_utilisateur INTO v_s2 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='simple' AND u.id_utilisateur <> v_s1 ORDER BY random() LIMIT 1;
  SELECT u.id_utilisateur INTO v_s3 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='simple' AND u.id_utilisateur NOT IN (v_s1,v_s2) ORDER BY random() LIMIT 1;
  SELECT u.id_utilisateur INTO v_s4 FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE r.nom_role='simple' AND u.id_utilisateur NOT IN (v_s1,v_s2,v_s3) ORDER BY random() LIMIT 1;
  IF v_s2 IS NULL THEN v_s2 := v_s1; END IF; IF v_s3 IS NULL THEN v_s3 := v_s1; END IF; IF v_s4 IS NULL THEN v_s4 := v_s1; END IF;

  -- 3.1 Terrains (8)
  INSERT INTO terrain (id_tantsaha, surface_proposee, surface_validee, acces_eau, acces_route, statut, id_commune, id_district, id_region, geom, id_technicien, id_superviseur, created_by)
  VALUES
  (v_s1, 2.5, 2.5, true, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326), v_tech1, v_sup, v_s1::text),
  (v_s2, 1.8, 1.8, true, false, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326), v_tech2, v_sup, v_s2::text),
  (v_s3, 3.2, 3.0, true, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326), v_tech1, v_sup, v_s3::text),
  (v_s4, 2.8, 2.8, false, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326), v_tech2, v_sup, v_s4::text),
  (v_s1, 4.5, 4.2, true, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((46.8 -19.1, 46.83 -19.1, 46.83 -19.13, 46.8 -19.13, 46.8 -19.1))', 4326), v_tech1, v_sup, v_s1::text),
  (v_s2, 1.5, 1.5, true, false, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((46.9 -19.2, 46.92 -19.2, 46.92 -19.22, 46.9 -19.22, 46.9 -19.2))', 4326), v_tech2, v_sup, v_s2::text),
  (v_s3, 3.8, 3.5, true, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.6 -18.8, 47.63 -18.8, 47.63 -18.83, 47.6 -18.83, 47.6 -18.8))', 4326), v_tech1, v_sup, v_s3::text),
  (v_s4, 2.2, 2.0, false, true, true, NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.15 -19.7, 47.17 -19.7, 47.17 -19.72, 47.15 -19.72, 47.15 -19.7))', 4326), v_tech2, v_sup, v_s4::text);

  -- 3.2 Projets (12)
  INSERT INTO projet (id_tantsaha, id_terrain, titre, description, surface_ha, statut, id_commune, id_district, id_region, geom, date_debut_production, id_technicien, id_superviseur, created_by)
  VALUES
  -- en financement (5)
  (v_s1, 1, 'Riziculture Intensive Analamanga', 'Production de riz SRI avec irrigation moderne', 2.5, 'en financement', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326), '2024-11-15', v_tech1, v_sup, v_s1::text),
  (v_s2, 2, 'Haricot Blanc Bio Vakinankaratra', 'Culture bio de haricot blanc pour export', 1.8, 'en financement', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326), '2024-12-01', v_tech2, v_sup, v_s2::text),
  (v_s3, 3, 'Manioc Transformation Itasy', 'Production de manioc avec unité de transformation', 3.0, 'en financement', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326), '2024-12-15', v_tech1, v_sup, v_s3::text),
  (v_s4, 4, 'Pois Bambara Durable', 'Culture traditionnelle améliorée de pois bambara', 2.8, 'en financement', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326), '2025-01-10', v_tech2, v_sup, v_s4::text),
  (v_s1, 5, 'Arachide Premium Itasy', 'Production d''arachide haut de gamme certifiée', 4.2, 'en financement', NULL, NULL, NULL, ST_GeomFromText('POLYGON((46.8 -19.1, 46.83 -19.1, 46.83 -19.13, 46.8 -19.13, 46.8 -19.1))', 4326), '2025-02-01', v_tech1, v_sup, v_s1::text),
  -- en cours (5)
  (v_s2, 6, 'Riz Pluvial Innovation', 'Système innovant de riziculture pluviale', 1.5, 'en cours', NULL, NULL, NULL, ST_GeomFromText('POLYGON((46.9 -19.2, 46.92 -19.2, 46.92 -19.22, 46.9 -19.22, 46.9 -19.2))', 4326), '2024-09-01', v_tech2, v_sup, v_s2::text),
  (v_s3, 7, 'Haricot Associé Multi-Culture', 'Association haricot-manioc-arachide', 3.5, 'en cours', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.6 -18.8, 47.63 -18.8, 47.63 -18.83, 47.6 -18.83, 47.6 -18.8))', 4326), '2024-08-15', v_tech1, v_sup, v_s3::text),
  (v_s4, 8, 'Manioc Séchage Solaire', 'Production avec séchage solaire intégré', 2.0, 'en cours', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.15 -19.7, 47.17 -19.7, 47.17 -19.72, 47.15 -19.72, 47.15 -19.7))', 4326), '2024-07-20', v_tech2, v_sup, v_s4::text),
  (v_s1, 1, 'Pois Bambara Coopératif', 'Projet coopératif de pois bambara', 2.5, 'en cours', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.5 -18.9, 47.51 -18.9, 47.51 -18.91, 47.5 -18.91, 47.5 -18.9))', 4326), '2024-09-10', v_tech1, v_sup, v_s1::text),
  (v_s2, 2, 'Arachide Export Premium', 'Production d''arachide pour marché export', 1.8, 'en cours', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.52 -18.92, 47.53 -18.92, 47.53 -18.93, 47.52 -18.93, 47.52 -18.92))', 4326), '2024-08-01', v_tech2, v_sup, v_s2::text),
  -- terminés (2)
  (v_s3, 3, 'Riz Traditionnel Amélioré', 'Première récolte de riz amélioré terminée', 3.0, 'terminé', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.0 -19.5, 47.02 -19.5, 47.02 -19.52, 47.0 -19.52, 47.0 -19.5))', 4326), '2024-03-01', v_tech1, v_sup, v_s3::text),
  (v_s4, 4, 'Haricot Blanc Pilot', 'Projet pilote de haricot blanc terminé avec succès', 2.8, 'terminé', NULL, NULL, NULL, ST_GeomFromText('POLYGON((47.1 -19.6, 47.12 -19.6, 47.12 -19.62, 47.1 -19.62, 47.1 -19.6))', 4326), '2024-02-15', v_tech2, v_sup, v_s4::text);

  -- 3.3 Cultures par projet (ids culture: 1=Riz, 5=Haricot Blanc, 3=Manioc, 8=Pois Bambara, 2=Arachide)
  INSERT INTO projet_culture (id_projet, id_culture, cout_exploitation_previsionnel, rendement_previsionnel, created_by) VALUES
  (1, 1, 850000, 4.5, v_s1::text),
  (2, 5, 650000, 2.8, v_s2::text),
  (3, 3, 750000, 12.0, v_s3::text),
  (4, 8, 420000, 1.8, v_s4::text),
  (5, 2, 680000, 2.2, v_s1::text),
  (6, 1, 780000, 4.2, v_s2::text),
  (7, 5, 620000, 2.5, v_s3::text),
  (8, 3, 680000, 11.5, v_s4::text),
  (9, 8, 380000, 1.6, v_s1::text),
  (10, 2, 640000, 2.0, v_s2::text),
  (11, 1, 820000, 4.8, v_s3::text),
  (12, 5, 680000, 3.2, v_s4::text);

  -- 3.4 Investissements (2 par projet en financement)
  INSERT INTO investissement (id_projet, id_investisseur, montant, date_decision_investir, date_paiement, statut_paiement, reference_paiement, created_by)
  SELECT p.id_projet, v_inv1, (p.surface_ha * 850000)::numeric, p.date_debut_production - INTERVAL '30 days', p.date_debut_production - INTERVAL '25 days', 'effectué', 'INV-'||p.id_projet||'-A', v_inv1::text
  FROM projet p WHERE p.statut = 'en financement';
  INSERT INTO investissement (id_projet, id_investisseur, montant, date_decision_investir, date_paiement, statut_paiement, reference_paiement, created_by)
  SELECT p.id_projet, v_inv1, (p.surface_ha * 550000)::numeric, p.date_debut_production - INTERVAL '20 days', p.date_debut_production - INTERVAL '15 days', 'effectué', 'INV-'||p.id_projet||'-B', v_inv1::text
  FROM projet p WHERE p.statut = 'en financement';

  -- 3.5 Paiements d'investissement (1 par investissement)
  INSERT INTO historique_paiement_invest (id_investissement, montant, date_paiement, methode_paiement, reference_transaction, numero_telephone, statut, created_by)
  SELECT i.id_investissement, i.montant, i.date_paiement, 'mvola', 'TXN-'||i.id_investissement, '0340000000', 'effectué', v_inv1::text
  FROM investissement i;

  -- 3.6 Déclencher la génération des jalons pour les projets 'en cours'
  UPDATE projet SET statut = 'temp_generation' WHERE statut = 'en cours';
  UPDATE projet SET statut = 'en cours' WHERE statut = 'temp_generation';

  -- 3.7 Marquer quelques jalons comme avancés
  WITH en_cours AS (
    SELECT id_projet FROM projet WHERE statut = 'en cours' ORDER BY id_projet LIMIT 3
  ), premiers AS (
    SELECT jp.id_jalon_projet
    FROM jalon_projet jp
    JOIN en_cours ec ON ec.id_projet = jp.id_projet
    ORDER BY jp.date_previsionnelle
    LIMIT 5
  )
  UPDATE jalon_projet SET statut = 'Terminé', date_reelle = CURRENT_DATE - INTERVAL '7 days'
  WHERE id_jalon_projet IN (SELECT id_jalon_projet FROM premiers);

  -- 3.8 Créer quelques paiements techniciens
  INSERT INTO historique_paiement (id_projet, montant, date_paiement, type_paiement, reference_paiement, id_technicien, id_responsable_financier, observation, statut_justificatif)
  SELECT p.id_projet, 300000, now() - INTERVAL '10 days', 'mobile_banking', 'PAY-TECH-'||p.id_projet, p.id_technicien, v_fin, 'Paiement initial jalon', 'valide'
  FROM projet p WHERE p.statut = 'en cours' ORDER BY p.id_projet LIMIT 3;
END $$;

-- 4) Vérifications
DO $$
DECLARE c1 int; c2 int; c3 int; c4 int; BEGIN
  SELECT count(*) INTO c1 FROM terrain; 
  SELECT count(*) INTO c2 FROM projet; 
  SELECT count(*) INTO c3 FROM investissement; 
  SELECT count(*) INTO c4 FROM jalon_projet; 
  RAISE NOTICE 'Terrains=% | Projets=% | Investissements=% | Jalons=%', c1, c2, c3, c4;
END $$;