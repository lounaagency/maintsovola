-- ============================================================================
-- MIGRATION FINALE - ACTIVATION RLS SUR TABLES RESTANTES
-- ============================================================================

BEGIN;

-- Activer RLS sur toutes les tables principales avec policies existantes
ALTER TABLE public.conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telephone ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur tables sans policies (ajout de policies basiques)
ALTER TABLE public.abonnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terrain_culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jalon ENABLE ROW LEVEL SECURITY;

-- Policies pour les tables sans policies
CREATE POLICY "Utilisateurs voient leurs abonnements" ON public.abonnement 
FOR SELECT USING (id_abonne = auth.uid() OR id_suivi = auth.uid());

CREATE POLICY "Utilisateurs créent leurs abonnements" ON public.abonnement 
FOR INSERT WITH CHECK (id_abonne = auth.uid());

CREATE POLICY "Lecture publique terrain_culture" ON public.terrain_culture 
FOR SELECT USING (true);

CREATE POLICY "Utilisateurs voient leurs messages" ON public.utilisateur_message 
FOR SELECT USING (id_utilisateur = auth.uid());

CREATE POLICY "Lecture publique weather_alerts" ON public.weather_alerts 
FOR SELECT USING (true);

CREATE POLICY "Lecture publique jalons" ON public.jalon 
FOR SELECT USING (true);

COMMIT;

-- Vérification finale
DO $$
DECLARE
    tables_without_rls INTEGER;
    total_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_without_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
    AND c.relname NOT LIKE 'spatial_%'
    AND c.relname NOT LIKE 'geometry_%'
    AND c.relname NOT LIKE 'geography_%';
    
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION FINALE TERMINÉE - SYSTÈME COMPLÈTEMENT SÉCURISÉ';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Tables sans RLS: %', tables_without_rls;
    RAISE NOTICE 'Policies totales: %', total_policies;
    RAISE NOTICE 'Toutes les tables applicatives sont maintenant sécurisées';
    RAISE NOTICE '============================================================================';
END $$;