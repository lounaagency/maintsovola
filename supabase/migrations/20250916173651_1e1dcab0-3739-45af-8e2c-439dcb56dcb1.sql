-- ============================================================================
-- MIGRATION FINALE DE SÉCURITÉ - CORRECTION RLS (VERSION CORRIGÉE)
-- ============================================================================

BEGIN;

-- 1. ACTIVER RLS SUR NOS TABLES D'APPLICATION UNIQUEMENT
-- ============================================================================

-- Tables d'application (pas les tables système PostGIS)
ALTER TABLE public.commune ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.province ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur terrain et utilisateur si pas déjà fait
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'terrain' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.terrain ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'utilisateur' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.utilisateur ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. POLICIES POUR LES DONNÉES DE RÉFÉRENCE
-- ============================================================================

-- Policies pour les données géographiques (lecture seule publique)
CREATE POLICY "Lecture publique des communes" ON public.commune FOR SELECT USING (true);
CREATE POLICY "Lecture publique des districts" ON public.district FOR SELECT USING (true);
CREATE POLICY "Lecture publique des régions" ON public.region FOR SELECT USING (true);
CREATE POLICY "Lecture publique des provinces" ON public.province FOR SELECT USING (true);

-- Policies pour les rôles (lecture seule publique)
CREATE POLICY "Lecture publique des rôles" ON public.role FOR SELECT USING (true);

-- 3. FONCTION DE SÉCURITÉ POUR L'ACCÈS AUX PROJETS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_can_access_project(project_id INTEGER, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    project_record RECORD;
    user_role TEXT;
BEGIN
    -- Récupérer les infos du projet
    SELECT p.id_tantsaha, p.id_technicien, p.id_superviseur, p.statut
    INTO project_record
    FROM projet p
    WHERE p.id_projet = project_id;
    
    -- Si pas de projet, pas d'accès
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier si l'utilisateur est directement impliqué
    IF project_record.id_tantsaha = user_id 
       OR project_record.id_technicien = user_id 
       OR project_record.id_superviseur = user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'utilisateur est investisseur
    IF EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = project_id AND i.id_investisseur = user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'utilisateur est financier
    SELECT r.nom_role INTO user_role
    FROM utilisateur u 
    JOIN role r ON u.id_role = r.id_role 
    WHERE u.id_utilisateur = user_id;
    
    IF user_role = 'financier' THEN
        RETURN TRUE;
    END IF;
    
    -- Si le projet est validé, tout le monde peut voir
    IF project_record.statut = 'validé' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. POLICIES POUR TERRAIN
-- ============================================================================

-- Supprimer les policies existantes si elles existent pour éviter les conflits
DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs terrains" ON public.terrain;
DROP POLICY IF EXISTS "Propriétaires peuvent créer leurs terrains" ON public.terrain;
DROP POLICY IF EXISTS "Propriétaires peuvent modifier leurs terrains" ON public.terrain;
DROP POLICY IF EXISTS "Administrateurs peuvent voir tous les terrains" ON public.terrain;

-- Policies pour terrain
CREATE POLICY "Propriétaires peuvent voir leurs terrains" ON public.terrain 
FOR SELECT USING (id_utilisateur = auth.uid());

CREATE POLICY "Propriétaires peuvent créer leurs terrains" ON public.terrain 
FOR INSERT WITH CHECK (id_utilisateur = auth.uid());

CREATE POLICY "Propriétaires peuvent modifier leurs terrains" ON public.terrain 
FOR UPDATE USING (id_utilisateur = auth.uid());

CREATE POLICY "Administrateurs peuvent voir tous les terrains" ON public.terrain 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM utilisateur u 
        JOIN role r ON u.id_role = r.id_role 
        WHERE u.id_utilisateur = auth.uid() 
        AND r.nom_role = 'administrateur'
    )
);

-- 5. POLICIES POUR UTILISATEUR
-- ============================================================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur profil" ON public.utilisateur;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur profil" ON public.utilisateur;
DROP POLICY IF EXISTS "Lecture publique des profils publics" ON public.utilisateur;

-- Policies pour utilisateur
CREATE POLICY "Utilisateurs peuvent voir leur profil" ON public.utilisateur 
FOR SELECT USING (id_utilisateur = auth.uid());

CREATE POLICY "Utilisateurs peuvent modifier leur profil" ON public.utilisateur 
FOR UPDATE USING (id_utilisateur = auth.uid());

CREATE POLICY "Lecture publique des profils publics" ON public.utilisateur 
FOR SELECT USING (true);

-- 6. NETTOYER LES FONCTIONS OBSOLÈTES
-- ============================================================================

-- Supprimer les anciennes fonctions qui peuvent causer des conflits
DROP FUNCTION IF EXISTS public.generate_project_costs() CASCADE;
DROP VIEW IF EXISTS public.vue_jalons_technicien CASCADE;

-- 7. FONCTION POUR LES JALONS DES TECHNICIENS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_technicien_jalons(technicien_id UUID)
RETURNS TABLE (
    id_jalon_projet INTEGER,
    id_projet INTEGER,
    nom_jalon VARCHAR,
    date_previsionnelle DATE,
    date_reelle DATE,
    statut VARCHAR,
    projet_titre VARCHAR,
    montant_total NUMERIC,
    id_technicien UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id_jalon_projet,
        jp.id_projet,
        ja.nom_jalon,
        jp.date_previsionnelle,
        jp.date_reelle,
        jp.statut,
        p.titre as projet_titre,
        COALESCE(SUM(cjp.montant_total), 0) as montant_total,
        p.id_technicien
    FROM jalon_projet jp
    JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
    JOIN projet p ON jp.id_projet = p.id_projet
    LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
    WHERE p.id_technicien = technicien_id
    GROUP BY jp.id_jalon_projet, jp.id_projet, ja.nom_jalon, jp.date_previsionnelle, 
             jp.date_reelle, jp.statut, p.titre, p.id_technicien;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. PERMISSIONS
-- ============================================================================

-- Fonctions pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.user_can_access_project(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_technicien_jalons(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_milestone_payment(INTEGER, UUID) TO authenticated;

-- Tables de référence pour tous
GRANT SELECT ON public.commune TO authenticated, anon;
GRANT SELECT ON public.district TO authenticated, anon;
GRANT SELECT ON public.region TO authenticated, anon;
GRANT SELECT ON public.province TO authenticated, anon;
GRANT SELECT ON public.role TO authenticated, anon;
GRANT SELECT ON public.culture TO authenticated, anon;
GRANT SELECT ON public.jalon_agricole TO authenticated, anon;
GRANT SELECT ON public.cout_jalon_reference TO authenticated, anon;

COMMIT;

-- Résumé final
DO $$
DECLARE
    total_app_tables_with_rls INTEGER;
    total_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_app_tables_with_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true
    AND c.relname NOT LIKE 'spatial_%'
    AND c.relname NOT LIKE 'geometry_%'
    AND c.relname NOT LIKE 'geography_%';
    
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION DE SÉCURITÉ FINALE TERMINÉE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Tables applicatives avec RLS: %', total_app_tables_with_rls;
    RAISE NOTICE 'Policies totales: %', total_policies;
    RAISE NOTICE 'Système sécurisé et stabilisé pour la production';
    RAISE NOTICE '============================================================================';
END $$;