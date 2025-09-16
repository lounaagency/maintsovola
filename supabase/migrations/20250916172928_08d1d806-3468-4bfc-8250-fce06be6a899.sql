-- ============================================================================
-- MIGRATION COMPLÈTE DE STABILISATION - CORRIGÉE
-- ============================================================================

BEGIN;

-- 1. DÉDUPLICATION SÉCURISÉE DE jalon_agricole
-- ============================================================================

-- Créer une table temporaire des doublons avec canonique (plus petit ID)
CREATE TEMP TABLE jalon_duplicates AS 
WITH duplicates AS (
    SELECT id_culture, nom_jalon, array_agg(id_jalon_agricole ORDER BY id_jalon_agricole) as ids
    FROM jalon_agricole
    GROUP BY id_culture, nom_jalon
    HAVING COUNT(*) > 1
),
canonical_mapping AS (
    SELECT 
        unnest(ids[2:]) as duplicate_id,
        ids[1] as canonical_id
    FROM duplicates
)
SELECT * FROM canonical_mapping;

-- Mettre à jour les références vers les IDs canoniques dans cout_jalon_reference
UPDATE cout_jalon_reference 
SET id_jalon_agricole = jd.canonical_id
FROM jalon_duplicates jd
WHERE cout_jalon_reference.id_jalon_agricole = jd.duplicate_id;

-- Mettre à jour les références vers les IDs canoniques dans jalon_projet
UPDATE jalon_projet 
SET id_jalon_agricole = jd.canonical_id
FROM jalon_duplicates jd
WHERE jalon_projet.id_jalon_agricole = jd.duplicate_id;

-- Supprimer les doublons (maintenant sécurisé car toutes les références sont mises à jour)
DELETE FROM jalon_agricole 
WHERE id_jalon_agricole IN (SELECT duplicate_id FROM jalon_duplicates);

-- 2. DÉDUPLICATION DE cout_jalon_reference
-- ============================================================================

-- Identifier et supprimer les doublons dans cout_jalon_reference
CREATE TEMP TABLE cout_duplicates AS
WITH duplicates AS (
    SELECT 
        id_culture, 
        id_jalon_agricole, 
        type_depense,
        array_agg(id_cout_jalon_reference ORDER BY id_cout_jalon_reference) as ids
    FROM cout_jalon_reference
    GROUP BY id_culture, id_jalon_agricole, type_depense
    HAVING COUNT(*) > 1
),
to_delete AS (
    SELECT unnest(ids[2:]) as duplicate_id
    FROM duplicates
)
SELECT * FROM to_delete;

-- Supprimer les doublons (garder seulement le plus ancien)
DELETE FROM cout_jalon_reference 
WHERE id_cout_jalon_reference IN (SELECT duplicate_id FROM cout_duplicates);

-- 3. CONTRAINTES D'UNICITÉ ET INDEX POUR COHÉRENCE FUTURE
-- ============================================================================

-- Contraintes d'unicité
DO $$ 
BEGIN
    -- Culture
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'culture_nom_culture_unique') THEN
        ALTER TABLE culture ADD CONSTRAINT culture_nom_culture_unique UNIQUE (nom_culture);
    END IF;
    
    -- Jalon agricole
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jalon_agricole_culture_nom_unique') THEN
        ALTER TABLE jalon_agricole ADD CONSTRAINT jalon_agricole_culture_nom_unique UNIQUE (id_culture, nom_jalon);
    END IF;
    
    -- Cout jalon reference
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cout_jalon_reference_unique') THEN
        ALTER TABLE cout_jalon_reference ADD CONSTRAINT cout_jalon_reference_unique UNIQUE (id_culture, id_jalon_agricole, type_depense);
    END IF;
    
    -- Cout jalon projet
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cout_jalon_projet_unique') THEN
        ALTER TABLE cout_jalon_projet ADD CONSTRAINT cout_jalon_projet_unique UNIQUE (id_jalon_projet, type_depense);
    END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_jalon_projet_projet_id ON jalon_projet(id_projet);
CREATE INDEX IF NOT EXISTS idx_cout_jalon_projet_jalon_id ON cout_jalon_projet(id_jalon_projet);
CREATE INDEX IF NOT EXISTS idx_cout_jalon_reference_culture_jalon ON cout_jalon_reference(id_culture, id_jalon_agricole);

-- 4. HARMONISATION DES TRIGGERS ET FONCTIONS
-- ============================================================================

-- Supprimer l'ancien trigger conflictuel s'il existe
DROP TRIGGER IF EXISTS trigger_generate_project_costs ON projet;

-- Remplacer la fonction generate_project_milestones par une version robuste et sécurisée
CREATE OR REPLACE FUNCTION public.generate_project_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si le statut passe à 'en_cours', générer jalons et coûts automatiquement
    IF NEW.statut = 'en_cours' AND (OLD.statut IS NULL OR OLD.statut != 'en_cours') THEN
        
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
$$;

-- S'assurer que le trigger project_status_change_trigger existe et fonctionne
DROP TRIGGER IF EXISTS project_status_change_trigger ON projet;
CREATE TRIGGER project_status_change_trigger
    AFTER UPDATE OF statut ON projet
    FOR EACH ROW
    WHEN (NEW.statut IS DISTINCT FROM OLD.statut)
    EXECUTE FUNCTION generate_project_milestones();

-- 5. RLS POLICIES POUR jalon_projet
-- ============================================================================

-- Activer RLS sur jalon_projet si pas déjà fait
ALTER TABLE jalon_projet ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: voir les jalons des projets où on est impliqué
DROP POLICY IF EXISTS "Voir les jalons des projets impliqués" ON jalon_projet;
CREATE POLICY "Voir les jalons des projets impliqués" ON jalon_projet 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projet p 
        WHERE p.id_projet = jalon_projet.id_projet 
        AND (p.id_tantsaha = auth.uid() 
             OR p.id_technicien = auth.uid() 
             OR p.id_superviseur = auth.uid()
             OR EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = p.id_projet AND i.id_investisseur = auth.uid())
             OR EXISTS (SELECT 1 FROM utilisateur u JOIN role r ON u.id_role = r.id_role 
                       WHERE u.id_utilisateur = auth.uid() AND r.nom_role = 'financier'))
    )
);

-- Politique UPDATE: techniciens et superviseurs peuvent modifier les jalons de leurs projets
DROP POLICY IF EXISTS "Modifier les jalons des projets assignés" ON jalon_projet;
CREATE POLICY "Modifier les jalons des projets assignés" ON jalon_projet 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM projet p 
        WHERE p.id_projet = jalon_projet.id_projet 
        AND (p.id_technicien = auth.uid() OR p.id_superviseur = auth.uid())
    )
);

-- 6. COMPLÉTER LES COÛTS MANQUANTS POUR HARICOT BLANC
-- ============================================================================

-- Ajouter le coût de référence "Récolte" pour Haricot Blanc s'il manque
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite)
SELECT 
    c.id_culture, 
    ja.id_jalon_agricole, 
    'Main d''œuvre', 
    70000, 
    'Ar/ha'
FROM culture c
JOIN jalon_agricole ja ON c.id_culture = ja.id_culture
WHERE c.nom_culture = 'Haricot Blanc' 
AND ja.nom_jalon = 'Récolte'
AND NOT EXISTS (
    SELECT 1 FROM cout_jalon_reference cjr 
    WHERE cjr.id_culture = c.id_culture 
    AND cjr.id_jalon_agricole = ja.id_jalon_agricole 
    AND cjr.type_depense = 'Main d''œuvre'
);

COMMIT;

-- Résumé final avec vérifications
DO $$
DECLARE
    total_cultures INTEGER;
    total_jalons INTEGER;
    total_costs INTEGER;
    jalon_duplicates INTEGER;
    cost_duplicates INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_cultures FROM culture;
    SELECT COUNT(*) INTO total_jalons FROM jalon_agricole;
    SELECT COUNT(*) INTO total_costs FROM cout_jalon_reference;
    
    -- Vérifier les doublons
    SELECT COUNT(*) INTO jalon_duplicates
    FROM (
        SELECT id_culture, nom_jalon, COUNT(*) 
        FROM jalon_agricole 
        GROUP BY id_culture, nom_jalon 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    SELECT COUNT(*) INTO cost_duplicates
    FROM (
        SELECT id_culture, id_jalon_agricole, type_depense, COUNT(*) 
        FROM cout_jalon_reference 
        GROUP BY id_culture, id_jalon_agricole, type_depense 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Cultures: %', total_cultures;
    RAISE NOTICE 'Jalons agricoles: % (doublons: %)', total_jalons, jalon_duplicates;
    RAISE NOTICE 'Coûts de référence: % (doublons: %)', total_costs, cost_duplicates;
    RAISE NOTICE 'Système stabilisé et prêt pour production';
    RAISE NOTICE '============================================================================';
END $$;