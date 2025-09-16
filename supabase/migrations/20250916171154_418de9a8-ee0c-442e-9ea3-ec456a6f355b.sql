-- Migration pour compléter les données agricoles manquantes
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
VALUES ('Maïs', 4.0, 800000, 500000, 'Culture céréalière à cycle de 120 jours. Nécessite un sol bien drainé et fertile.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour le Maïs
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Préparation du sol',
    0,
    'Labour profond, hersage et mise en forme des billons',
    'Préparation complète du terrain avant semis'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Semis',
    7,
    'Semis en ligne avec écartement de 75cm x 25cm',
    'Mise en place des semences de maïs'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Première fertilisation',
    30,
    'Application d''engrais NPK au pied des plants',
    'Apport nutritionnel pour la croissance'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Sarclage et buttage',
    45,
    'Désherbage mécanique et buttage des plants',
    'Entretien cultural et protection des racines'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Deuxième fertilisation',
    60,
    'Application d''urée pour la formation des épis',
    'Apport azoté pour le développement reproductif'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Traitement phytosanitaire',
    75,
    'Pulvérisation contre les ravageurs des épis',
    'Protection contre les insectes nuisibles'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT 
    c.id_culture,
    'Récolte',
    120,
    'Récolte manuelle des épis et séchage',
    'Collecte et conditionnement de la récolte'
FROM culture c WHERE c.nom_culture = 'Maïs'
ON CONFLICT DO NOTHING;

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
WHERE c.nom_culture = 'Maïs';

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
WHERE c.nom_culture = 'Maïs' AND ja.nom_jalon IN ('Semis', 'Première fertilisation', 'Deuxième fertilisation', 'Traitement phytosanitaire');

-- 2. Patate douce
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
VALUES ('Patate douce', 12.0, 600000, 400000, 'Culture de tubercule à cycle de 90-120 jours. Adaptée aux sols légers et bien drainés.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour la Patate douce
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour et formation de billons', 'Préparation du terrain pour plantation'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Plantation', 7, 'Plantation des boutures de patate douce', 'Mise en place du matériel végétal'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation de base', 15, 'Application de fumier organique', 'Apport nutritionnel de base'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Premier sarclage', 30, 'Désherbage et buttage léger', 'Entretien cultural précoce'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Deuxième sarclage', 60, 'Désherbage et buttage renforcé', 'Entretien pour formation des tubercules'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des tubercules', 'Collecte et tri des patates douces'
FROM culture c WHERE c.nom_culture = 'Patate douce' ON CONFLICT DO NOTHING;

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
WHERE c.nom_culture = 'Patate douce';

-- 3. Oignons
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
VALUES ('Oignons', 10.0, 1200000, 800000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite irrigation régulière.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour les Oignons
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place de la pépinière'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis en pépinière', 7, 'Semis des graines d''oignons', 'Production des plants'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation terrain définitif', 30, 'Labour et formation planches', 'Préparation du terrain de production'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Repiquage', 45, 'Transplantation des plants', 'Mise en place définitive'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation et arrosage', 60, 'Apport d''engrais et irrigation', 'Entretien et nutrition'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement et sarclage', 75, 'Désherbage et traitement phytosanitaire', 'Protection et entretien'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte et séchage', 120, 'Récolte et séchage des bulbes', 'Collecte et conditionnement'
FROM culture c WHERE c.nom_culture = 'Oignons' ON CONFLICT DO NOTHING;

-- Coûts de référence pour les Oignons
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation pépinière' THEN 60000
        WHEN 'Semis en pépinière' THEN 40000
        WHEN 'Préparation terrain définitif' THEN 100000
        WHEN 'Repiquage' THEN 150000
        WHEN 'Fertilisation et arrosage' THEN 80000
        WHEN 'Traitement et sarclage' THEN 70000
        WHEN 'Récolte et séchage' THEN 120000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Oignons';

-- 4. Coton
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
VALUES ('Coton', 2.0, 900000, 1200000, 'Culture industrielle à cycle de 150 jours. Nécessite suivi phytosanitaire intensif.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour le Coton
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et hersage', 'Préparation du terrain'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 15, 'Semis en ligne du coton', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Démariage', 30, 'Éclaircissage des plants excédentaires', 'Ajustement de la densité'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Premier sarclage', 45, 'Désherbage mécanique', 'Entretien cultural'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation', 60, 'Application d''engrais NPK', 'Apport nutritionnel'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement insecticide', 90, 'Pulvérisation contre les ravageurs', 'Protection phytosanitaire'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 150, 'Récolte manuelle des capsules', 'Collecte du coton-graine'
FROM culture c WHERE c.nom_culture = 'Coton' ON CONFLICT DO NOTHING;

-- Coûts de référence pour le Coton
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation du sol' THEN 100000
        WHEN 'Semis' THEN 60000
        WHEN 'Démariage' THEN 40000
        WHEN 'Premier sarclage' THEN 60000
        WHEN 'Fertilisation' THEN 40000
        WHEN 'Traitement insecticide' THEN 50000
        WHEN 'Récolte' THEN 200000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Coton';

-- 5. Tomates
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
VALUES ('Tomates', 20.0, 1500000, 600000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite tuteurage et irrigation.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour les Tomates
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place pépinière'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 7, 'Semis des graines de tomates', 'Production des plants'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation terrain', 30, 'Labour et installation irrigation', 'Préparation du terrain définitif'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Repiquage et tuteurage', 45, 'Transplantation et mise en place tuteurs', 'Installation définitive'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien et fertilisation', 60, 'Arrosage, fertilisation et taille', 'Entretien cultural intensif'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement phytosanitaire', 75, 'Pulvérisation préventive et curative', 'Protection contre maladies'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte échelonnée', 90, 'Récolte par passages successifs', 'Collecte des fruits mûrs'
FROM culture c WHERE c.nom_culture = 'Tomates' ON CONFLICT DO NOTHING;

-- Coûts de référence pour les Tomates
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation pépinière' THEN 80000
        WHEN 'Semis' THEN 50000
        WHEN 'Préparation terrain' THEN 120000
        WHEN 'Repiquage et tuteurage' THEN 200000
        WHEN 'Entretien et fertilisation' THEN 150000
        WHEN 'Traitement phytosanitaire' THEN 80000
        WHEN 'Récolte échelonnée' THEN 300000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Tomates';

-- 6. Carottes
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
VALUES ('Carottes', 15.0, 800000, 500000, 'Culture légumière-racine à cycle de 90 jours. Nécessite sol meuble et profond.')
ON CONFLICT (nom_culture) DO NOTHING;

-- Jalons pour les Carottes
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et affinement', 'Préparation terrain meuble'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis direct', 7, 'Semis en ligne des graines', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Éclaircissage', 30, 'Démariage pour ajuster densité', 'Optimisation de la densité'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation', 45, 'Application d''engrais complet', 'Apport nutritionnel'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Sarclage et arrosage', 60, 'Désherbage et irrigation', 'Entretien et hydratation'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des racines', 'Collecte et tri des carottes'
FROM culture c WHERE c.nom_culture = 'Carottes' ON CONFLICT DO NOTHING;

-- Coûts de référence pour les Carottes
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT c.id_culture, ja.id_jalon_agricole, 'Main d''œuvre', 
    CASE ja.nom_jalon
        WHEN 'Préparation du sol' THEN 100000
        WHEN 'Semis direct' THEN 60000
        WHEN 'Éclaircissage' THEN 80000
        WHEN 'Fertilisation' THEN 40000
        WHEN 'Sarclage et arrosage' THEN 70000
        WHEN 'Récolte' THEN 120000
    END, 'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Carottes';

-- Phase 3: Nettoyer les doublons existants pour Poids de Mbambara
-- Supprimer les jalons en double pour "Poids de Mbambara" (garder seulement le premier de chaque nom)
DELETE FROM jalon_agricole 
WHERE id_jalon_agricole NOT IN (
    SELECT MIN(id_jalon_agricole)
    FROM jalon_agricole ja2
    JOIN culture c ON ja2.id_culture = c.id_culture
    WHERE c.nom_culture = 'Poids de Mbambara'
    GROUP BY ja2.nom_jalon, ja2.id_culture
) AND id_culture IN (SELECT id_culture FROM culture WHERE nom_culture = 'Poids de Mbambara');

-- Créer les jalons manquants pour Voan-tsiroko si la culture existe
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour et préparation terrain', 'Préparation initiale'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol')
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 7, 'Semis des graines', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis')
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien', 45, 'Sarclage et entretien', 'Entretien cultural'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien')
ON CONFLICT DO NOTHING;

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des grains', 'Collecte de la récolte'
FROM culture c WHERE c.nom_culture = 'Voan-tsiroko'
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte')
ON CONFLICT DO NOTHING;

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

-- Mise à jour des couts de jalon projet existants pour recalculer les montants
UPDATE cout_jalon_projet 
SET montant_total = montant_par_hectare * (
    SELECT surface_ha 
    FROM projet 
    WHERE projet.id_projet = cout_jalon_projet.id_projet
)
WHERE montant_total = 0 OR montant_total IS NULL;