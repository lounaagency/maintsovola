
-- Script d'épuration des données opérationnelles
-- Supprime uniquement les données d'activité agricole (terrains, projets, investissements)
-- Conserve : tables de référence, communication, utilisateurs opérationnelles, contact public

-- Commencer une transaction pour sécuriser l'opération
BEGIN;

-- =============================================================================
-- SECTION 1: SUPPRESSION DES TABLES D'INTERACTION AGRICOLE
-- =============================================================================

-- Supprimer les likes sur commentaires
TRUNCATE TABLE aimer_commentaire RESTART IDENTITY CASCADE;

-- Supprimer les likes sur projets
TRUNCATE TABLE aimer_projet RESTART IDENTITY CASCADE;

-- Supprimer les commentaires des projets
TRUNCATE TABLE commentaire RESTART IDENTITY CASCADE;

-- =============================================================================
-- SECTION 2: SUPPRESSION DES TABLES FINANCIÈRES AGRICOLES
-- =============================================================================

-- Supprimer l'historique des paiements agricoles
TRUNCATE TABLE historique_paiement RESTART IDENTITY CASCADE;

-- Supprimer l'historique des paiements d'investissements
TRUNCATE TABLE historique_paiement_invest RESTART IDENTITY CASCADE;

-- Supprimer les coûts par jalon de projet
TRUNCATE TABLE cout_jalon_projet RESTART IDENTITY CASCADE;

-- =============================================================================
-- SECTION 3: SUPPRESSION DES TABLES DE PROJETS AGRICOLES
-- =============================================================================

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

-- =============================================================================
-- SECTION 4: SUPPRESSION DES TABLES DE TERRAIN
-- =============================================================================

-- Supprimer les cultures par terrain
TRUNCATE TABLE terrain_culture RESTART IDENTITY CASCADE;

-- Supprimer les terrains agricoles
TRUNCATE TABLE terrain RESTART IDENTITY CASCADE;

-- =============================================================================
-- SECTION 5: REMISE À ZÉRO DES SÉQUENCES
-- =============================================================================

-- Remettre à zéro les séquences pour repartir avec des IDs à 1
ALTER SEQUENCE aimer_commentaire_id_aimer_commentaire_seq RESTART WITH 1;
ALTER SEQUENCE aimer_projet_id_aimer_projet_seq RESTART WITH 1;
ALTER SEQUENCE commentaire_id_commentaire_seq RESTART WITH 1;
ALTER SEQUENCE historique_paiement_id_historique_paiement_seq RESTART WITH 1;
ALTER SEQUENCE historique_paiement_invest_id_paiement_seq RESTART WITH 1;
ALTER SEQUENCE cout_jalon_projet_id_cout_jalon_projet_seq RESTART WITH 1;
ALTER SEQUENCE jalon_projet_id_jalon_projet_seq RESTART WITH 1;
ALTER SEQUENCE projet_culture_id_projet_culture_seq RESTART WITH 1;
ALTER SEQUENCE investissement_id_investissement_seq RESTART WITH 1;
ALTER SEQUENCE projet_id_projet_seq RESTART WITH 1;
ALTER SEQUENCE terrain_culture_id_seq RESTART WITH 1;
ALTER SEQUENCE terrain_id_terrain_seq RESTART WITH 1;

-- =============================================================================
-- TABLES CONSERVÉES (NON MODIFIÉES)
-- =============================================================================

-- Tables de référence géographique et administrative :
-- - province, region, district, commune
-- - spatial_ref_sys, geometry_columns, geography_columns

-- Tables de référence utilisateur et système :
-- - role, utilisateur, site_utilisateur

-- Tables de référence agricole :
-- - culture, jalon_agricole, jalon, cout_jalon_reference

-- Tables de communication (CONSERVÉES) :
-- - message, conversation, notification

-- Tables utilisateurs opérationnelles (CONSERVÉES) :
-- - abonnement, telephone

-- Tables de contact public (CONSERVÉES) :
-- - job_application, job_posting, public_contact

-- Tables vues et fonctions (automatiquement mises à jour) :
-- - popular_cultures, utilisateurs_par_role, v_terrain_complet
-- - vue_projet_detaille, vue_suivi_financier_projet, vue_suivi_jalons_projet

-- Valider la transaction
COMMIT;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Épuration terminée avec succès. Tables d''activité agricole vidées, tables de référence et communication conservées.';
END $$;
