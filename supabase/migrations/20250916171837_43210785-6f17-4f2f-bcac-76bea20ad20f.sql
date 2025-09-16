-- Migration simplifiée pour les cultures restantes et sécurité (sans suppression de doublons)

-- Phase 1: Créer les cultures restantes (Oignons, Coton, Tomates, Carottes)

-- 3. Oignons
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Oignons', 10.0, 1200000, 800000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite irrigation régulière.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Oignons');

-- 4. Coton
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Coton', 2.0, 900000, 1200000, 'Culture industrielle à cycle de 150 jours. Nécessite suivi phytosanitaire intensif.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Coton');

-- 5. Tomates
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Tomates', 20.0, 1500000, 600000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite tuteurage et irrigation.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Tomates');

-- 6. Carottes
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Carottes', 15.0, 800000, 500000, 'Culture légumière-racine à cycle de 90 jours. Nécessite sol meuble et profond.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Carottes');

-- Jalons standardisés pour les nouvelles cultures
-- Oignons
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place de la pépinière'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation pépinière');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis et repiquage', 30, 'Semis en pépinière puis repiquage', 'Production et plantation des plants'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis et repiquage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien cultural', 60, 'Fertilisation, arrosage et sarclage', 'Entretien général de la culture'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien cultural');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte et séchage', 120, 'Récolte et séchage des bulbes', 'Collecte et conditionnement'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte et séchage');

-- Coton
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et hersage', 'Préparation du terrain'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis et démariage', 20, 'Semis puis éclaircissage des plants', 'Mise en place et ajustement de la densité'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis et démariage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien et protection', 60, 'Sarclage, fertilisation et traitement phytosanitaire', 'Entretien et protection de la culture'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien et protection');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 150, 'Récolte manuelle des capsules', 'Collecte du coton-graine'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

-- Tomates
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place pépinière'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation pépinière');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis et repiquage', 30, 'Semis puis transplantation avec tuteurage', 'Production de plants et installation'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis et repiquage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien intensif', 60, 'Arrosage, fertilisation, taille et traitement', 'Entretien cultural intensif'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien intensif');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte échelonnée', 90, 'Récolte par passages successifs', 'Collecte des fruits mûrs'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte échelonnée');

-- Carottes
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et affinement', 'Préparation terrain meuble'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis direct', 7, 'Semis en ligne des graines', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis direct');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien cultural', 45, 'Éclaircissage, fertilisation et arrosage', 'Entretien général'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien cultural');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des racines', 'Collecte et tri des carottes'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

-- Coûts de référence pour toutes les nouvelles cultures
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE 
        WHEN ja.nom_jalon LIKE '%Préparation%' THEN 
            CASE c.nom_culture
                WHEN 'Oignons' THEN 60000
                WHEN 'Coton' THEN 100000
                WHEN 'Tomates' THEN 80000
                WHEN 'Carottes' THEN 100000
            END
        WHEN ja.nom_jalon LIKE '%Semis%' THEN 
            CASE c.nom_culture
                WHEN 'Oignons' THEN 120000
                WHEN 'Coton' THEN 80000
                WHEN 'Tomates' THEN 150000
                WHEN 'Carottes' THEN 60000
            END
        WHEN ja.nom_jalon LIKE '%Entretien%' THEN 
            CASE c.nom_culture
                WHEN 'Oignons' THEN 100000
                WHEN 'Coton' THEN 120000
                WHEN 'Tomates' THEN 180000
                WHEN 'Carottes' THEN 80000
            END
        WHEN ja.nom_jalon LIKE '%Récolte%' THEN 
            CASE c.nom_culture
                WHEN 'Oignons' THEN 120000
                WHEN 'Coton' THEN 200000
                WHEN 'Tomates' THEN 300000
                WHEN 'Carottes' THEN 120000
            END
        ELSE 80000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture IN ('Oignons', 'Coton', 'Tomates', 'Carottes')
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole);

-- Phase 2: Corrections de sécurité critiques - Activer RLS sur les tables importantes
ALTER TABLE culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE jalon_agricole ENABLE ROW LEVEL SECURITY;
ALTER TABLE cout_jalon_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE cout_jalon_projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_paiement ENABLE ROW LEVEL SECURITY;
ALTER TABLE jalon_projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet_culture ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS basiques pour les nouvelles tables
CREATE POLICY "Tout le monde peut voir les cultures" ON culture FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut voir les jalons agricoles" ON jalon_agricole FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut voir les coûts de référence" ON cout_jalon_reference FOR SELECT USING (true);

-- Politiques pour cout_jalon_projet et historique_paiement (accès limité aux parties prenantes du projet)
CREATE POLICY "Voir les coûts des projets impliqués" ON cout_jalon_projet FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projet p 
        WHERE p.id_projet = cout_jalon_projet.id_projet 
        AND (p.id_tantsaha = auth.uid() OR p.id_technicien = auth.uid() OR p.id_superviseur = auth.uid()
             OR EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = p.id_projet AND i.id_investisseur = auth.uid())
             OR EXISTS (SELECT 1 FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
                       WHERE u.id_utilisateur = auth.uid() AND r.nom_role = 'financier'))
    )
);

CREATE POLICY "Voir l'historique des paiements des projets impliqués" ON historique_paiement FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projet p 
        WHERE p.id_projet = historique_paiement.id_projet 
        AND (p.id_tantsaha = auth.uid() OR p.id_technicien = auth.uid() OR p.id_superviseur = auth.uid()
             OR EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = p.id_projet AND i.id_investisseur = auth.uid())
             OR EXISTS (SELECT 1 FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
                       WHERE u.id_utilisateur = auth.uid() AND r.nom_role = 'financier'))
    )
);

-- Politiques pour projet_culture
CREATE POLICY "Voir les cultures des projets visibles" ON projet_culture FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projet p 
        WHERE p.id_projet = projet_culture.id_projet 
        AND (p.statut = 'validé' OR p.id_tantsaha = auth.uid() 
             OR EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = p.id_projet AND i.id_investisseur = auth.uid()))
    )
);

-- Créer les jalons manquants pour Voan-tsiroko si la culture existe
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour et préparation terrain', 'Préparation initiale'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 7, 'Semis des graines', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien', 45, 'Sarclage et entretien', 'Entretien cultural'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des grains', 'Collecte de la récolte'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

-- Coûts de référence pour Voan-tsiroko
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation du sol' THEN 80000
        WHEN 'Semis' THEN 50000
        WHEN 'Entretien' THEN 45000
        WHEN 'Récolte' THEN 65000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (
    SELECT 1 FROM cout_jalon_reference cjr 
    WHERE cjr.id_culture = c.id_culture 
    AND cjr.id_jalon_agricole = ja.id_jalon_agricole
);