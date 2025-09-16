-- Migration pour compléter les données agricoles manquantes (version corrigée)
-- Phase 1: Compléter les coûts de référence manquants pour les cultures existantes

-- Remplir les coûts manquants pour Lentille (basés sur les légumineuses similaires)
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT 
    c.id_culture,
    ja.id_jalon_agricole,
    'Main d''œuvre' as type_depense,
    CASE 
        WHEN ja.nom_jalon LIKE '%Préparation%' THEN 80000
        WHEN ja.nom_jalon LIKE '%Semis%' THEN 60000
        WHEN ja.nom_jalon LIKE '%Fertilisation%' THEN 40000
        WHEN ja.nom_jalon LIKE '%Entretien%' THEN 50000
        WHEN ja.nom_jalon LIKE '%Récolte%' THEN 70000
        ELSE 45000
    END as montant_par_hectare,
    'Ar/ha' as unite
FROM culture c
CROSS JOIN jalon_agricole ja
WHERE c.nom_culture = 'Lentille'
AND ja.id_culture = c.id_culture
AND NOT EXISTS (
    SELECT 1 FROM cout_jalon_reference cjr 
    WHERE cjr.id_culture = c.id_culture 
    AND cjr.id_jalon_agricole = ja.id_jalon_agricole
);

-- Remplir les coûts manquants pour Poids de Mbambara
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT 
    c.id_culture,
    ja.id_jalon_agricole,
    'Main d''œuvre' as type_depense,
    CASE 
        WHEN ja.nom_jalon LIKE '%Préparation%' THEN 75000
        WHEN ja.nom_jalon LIKE '%Semis%' THEN 55000
        WHEN ja.nom_jalon LIKE '%Fertilisation%' THEN 35000
        WHEN ja.nom_jalon LIKE '%Entretien%' THEN 45000
        WHEN ja.nom_jalon LIKE '%Récolte%' THEN 65000
        ELSE 40000
    END as montant_par_hectare,
    'Ar/ha' as unite
FROM culture c
CROSS JOIN jalon_agricole ja
WHERE c.nom_culture = 'Poids de Mbambara'
AND ja.id_culture = c.id_culture
AND NOT EXISTS (
    SELECT 1 FROM cout_jalon_reference cjr 
    WHERE cjr.id_culture = c.id_culture 
    AND cjr.id_jalon_agricole = ja.id_jalon_agricole
);

-- Remplir les coûts manquants pour Tsiasisa
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT 
    c.id_culture,
    ja.id_jalon_agricole,
    'Main d''œuvre' as type_depense,
    CASE 
        WHEN ja.nom_jalon LIKE '%Préparation%' THEN 70000
        WHEN ja.nom_jalon LIKE '%Semis%' THEN 50000
        WHEN ja.nom_jalon LIKE '%Fertilisation%' THEN 30000
        WHEN ja.nom_jalon LIKE '%Entretien%' THEN 40000
        WHEN ja.nom_jalon LIKE '%Récolte%' THEN 60000
        ELSE 35000
    END as montant_par_hectare,
    'Ar/ha' as unite
FROM culture c
CROSS JOIN jalon_agricole ja
WHERE c.nom_culture = 'Tsiasisa'
AND ja.id_culture = c.id_culture
AND NOT EXISTS (
    SELECT 1 FROM cout_jalon_reference cjr 
    WHERE cjr.id_culture = c.id_culture 
    AND cjr.id_jalon_agricole = ja.id_jalon_agricole
);

-- Phase 2: Créer les nouvelles cultures complètes
-- 1. Maïs
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Maïs', 4.0, 800000, 500000, 'Culture céréalière à cycle de 120 jours. Nécessite un sol bien drainé et fertile.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Maïs');

-- Jalons pour le Maïs
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Préparation du sol',
    0,
    'Labour profond, hersage et mise en forme des billons',
    'Préparation complète du terrain avant semis'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Semis',
    7,
    'Semis en ligne avec écartement de 75cm x 25cm',
    'Mise en place des semences de maïs'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Première fertilisation',
    30,
    'Application d''engrais NPK au pied des plants',
    'Apport nutritionnel pour la croissance'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Première fertilisation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Sarclage et buttage',
    45,
    'Désherbage mécanique et buttage des plants',
    'Entretien cultural et protection des racines'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Sarclage et buttage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Deuxième fertilisation',
    60,
    'Application d''urée pour la formation des épis',
    'Apport azoté pour le développement reproductif'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Deuxième fertilisation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Traitement phytosanitaire',
    75,
    'Pulvérisation contre les ravageurs des épis',
    'Protection contre les insectes nuisibles'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Traitement phytosanitaire');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Récolte',
    120,
    'Récolte manuelle des épis et séchage',
    'Collecte et conditionnement de la récolte'
FROM culture c 
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

-- Coûts de référence pour le Maïs
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation du sol' THEN 120000
        WHEN 'Semis' THEN 80000
        WHEN 'Première fertilisation' THEN 50000
        WHEN 'Sarclage et buttage' THEN 70000
        WHEN 'Deuxième fertilisation' THEN 40000
        WHEN 'Traitement phytosanitaire' THEN 30000
        WHEN 'Récolte' THEN 100000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Maïs'
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole AND cjr.type_depense = 'Main d''œuvre');

INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Intrants', 
    CASE ja.nom_jalon
        WHEN 'Semis' THEN 60000
        WHEN 'Première fertilisation' THEN 80000
        WHEN 'Deuxième fertilisation' THEN 70000
        WHEN 'Traitement phytosanitaire' THEN 40000
        ELSE 0
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Maïs' 
AND ja.nom_jalon IN ('Semis', 'Première fertilisation', 'Deuxième fertilisation', 'Traitement phytosanitaire')
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole AND cjr.type_depense = 'Intrants');

-- 2. Patate douce
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Patate douce', 12.0, 600000, 400000, 'Culture de tubercule à cycle de 90-120 jours. Adaptée aux sols légers et bien drainés.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Patate douce');

-- Jalons pour la Patate douce
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour et formation de billons', 'Préparation du terrain pour plantation'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Plantation', 7, 'Plantation des boutures de patate douce', 'Mise en place du matériel végétal'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Plantation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation de base', 15, 'Application de fumier organique', 'Apport nutritionnel de base'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Fertilisation de base');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Premier sarclage', 30, 'Désherbage et buttage léger', 'Entretien cultural précoce'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Premier sarclage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Deuxième sarclage', 60, 'Désherbage et buttage renforcé', 'Entretien pour formation des tubercules'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Deuxième sarclage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des tubercules', 'Collecte et tri des patates douces'
FROM culture c WHERE c.nom_culture = 'Patate douce' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

-- Coûts de référence pour la Patate douce
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation du sol' THEN 80000
        WHEN 'Plantation' THEN 90000
        WHEN 'Fertilisation de base' THEN 40000
        WHEN 'Premier sarclage' THEN 60000
        WHEN 'Deuxième sarclage' THEN 60000
        WHEN 'Récolte' THEN 120000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Patate douce'
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole);

-- Continuer avec les autres cultures dans une deuxième migration pour éviter les timeouts...
-- Mise à jour des couts de jalon projet existants pour recalculer les montants
UPDATE cout_jalon_projet 
SET montant_total = montant_par_hectare * (
    SELECT surface_ha 
    FROM projet 
    WHERE projet.id_projet = cout_jalon_projet.id_projet
)
WHERE montant_total = 0 OR montant_total IS NULL;