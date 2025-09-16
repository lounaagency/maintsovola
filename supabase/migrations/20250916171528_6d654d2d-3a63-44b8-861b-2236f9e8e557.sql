-- Migration pour les cultures restantes et corrections de sécurité critiques

-- Phase 1: Créer les cultures restantes (Oignons, Coton, Tomates, Carottes)

-- 3. Oignons
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Oignons', 10.0, 1200000, 800000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite irrigation régulière.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Oignons');

-- Jalons pour les Oignons
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place de la pépinière'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation pépinière');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis en pépinière', 7, 'Semis des graines d''oignons', 'Production des plants'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis en pépinière');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation terrain définitif', 30, 'Labour et formation planches', 'Préparation du terrain de production'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation terrain définitif');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Repiquage', 45, 'Transplantation des plants', 'Mise en place définitive'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Repiquage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation et arrosage', 60, 'Apport d''engrais et irrigation', 'Entretien et nutrition'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Fertilisation et arrosage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement et sarclage', 75, 'Désherbage et traitement phytosanitaire', 'Protection et entretien'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Traitement et sarclage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte et séchage', 120, 'Récolte et séchage des bulbes', 'Collecte et conditionnement'
FROM culture c WHERE c.nom_culture = 'Oignons' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte et séchage');

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
WHERE c.nom_culture = 'Oignons'
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole);

-- 4. Coton
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Coton', 2.0, 900000, 1200000, 'Culture industrielle à cycle de 150 jours. Nécessite suivi phytosanitaire intensif.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Coton');

-- Jalons pour le Coton
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et hersage', 'Préparation du terrain'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 15, 'Semis en ligne du coton', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Démariage', 30, 'Éclaircissage des plants excédentaires', 'Ajustement de la densité'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Démariage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Premier sarclage', 45, 'Désherbage mécanique', 'Entretien cultural'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Premier sarclage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation', 60, 'Application d''engrais NPK', 'Apport nutritionnel'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Fertilisation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement insecticide', 90, 'Pulvérisation contre les ravageurs', 'Protection phytosanitaire'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Traitement insecticide');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 150, 'Récolte manuelle des capsules', 'Collecte du coton-graine'
FROM culture c WHERE c.nom_culture = 'Coton' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

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
WHERE c.nom_culture = 'Coton'
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole);

-- 5. Tomates
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Tomates', 20.0, 1500000, 600000, 'Culture légumière intensive à cycle de 90-120 jours. Nécessite tuteurage et irrigation.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Tomates');

-- Jalons pour les Tomates
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation pépinière', 0, 'Préparation des planches de pépinière', 'Mise en place pépinière'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation pépinière');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis', 7, 'Semis des graines de tomates', 'Production des plants'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation terrain', 30, 'Labour et installation irrigation', 'Préparation du terrain définitif'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation terrain');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Repiquage et tuteurage', 45, 'Transplantation et mise en place tuteurs', 'Installation définitive'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Repiquage et tuteurage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Entretien et fertilisation', 60, 'Arrosage, fertilisation et taille', 'Entretien cultural intensif'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Entretien et fertilisation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Traitement phytosanitaire', 75, 'Pulvérisation préventive et curative', 'Protection contre maladies'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Traitement phytosanitaire');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte échelonnée', 90, 'Récolte par passages successifs', 'Collecte des fruits mûrs'
FROM culture c WHERE c.nom_culture = 'Tomates' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte échelonnée');

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
WHERE c.nom_culture = 'Tomates'
AND NOT EXISTS (SELECT 1 FROM cout_jalon_reference cjr WHERE cjr.id_culture = c.id_culture AND cjr.id_jalon_agricole = ja.id_jalon_agricole);

-- 6. Carottes
INSERT INTO culture (nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne, fiche_technique)
SELECT 'Carottes', 15.0, 800000, 500000, 'Culture légumière-racine à cycle de 90 jours. Nécessite sol meuble et profond.'
WHERE NOT EXISTS (SELECT 1 FROM culture WHERE nom_culture = 'Carottes');

-- Jalons pour les Carottes
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Préparation du sol', 0, 'Labour profond et affinement', 'Préparation terrain meuble'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Préparation du sol');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Semis direct', 7, 'Semis en ligne des graines', 'Mise en place des semences'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Semis direct');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Éclaircissage', 30, 'Démariage pour ajuster densité', 'Optimisation de la densité'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Éclaircissage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Fertilisation', 45, 'Application d''engrais complet', 'Apport nutritionnel'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Fertilisation');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Sarclage et arrosage', 60, 'Désherbage et irrigation', 'Entretien et hydratation'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Sarclage et arrosage');

INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, action_a_faire, description)
SELECT c.id_culture, 'Récolte', 90, 'Récolte des racines', 'Collecte et tri des carottes'
FROM culture c WHERE c.nom_culture = 'Carottes' 
AND NOT EXISTS (SELECT 1 FROM jalon_agricole ja WHERE ja.id_culture = c.id_culture AND ja.nom_jalon = 'Récolte');

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
WHERE c.nom_culture = 'Carottes'
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

-- Nettoyer les doublons pour "Poids de Mbambara" (sans affecter les coûts déjà créés)
WITH doublons AS (
    SELECT id_jalon_agricole, 
           ROW_NUMBER() OVER (PARTITION BY id_culture, nom_jalon ORDER BY id_jalon_agricole) as rn
    FROM jalon_agricole ja
    JOIN culture c ON ja.id_culture = c.id_culture
    WHERE c.nom_culture = 'Poids de Mbambara'
)
DELETE FROM jalon_agricole 
WHERE id_jalon_agricole IN (
    SELECT id_jalon_agricole FROM doublons WHERE rn > 1
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