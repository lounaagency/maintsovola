-- ============================================================================
-- PHASE 1: CORRECTIONS BASE DE DONNÉES - SYSTÈME DE VALIDATION PAIEMENTS
-- ============================================================================

BEGIN;

-- 1. Ajouter les colonnes manquantes à historique_paiement
ALTER TABLE public.historique_paiement 
ADD COLUMN IF NOT EXISTS statut_justificatif VARCHAR DEFAULT 'en_attente' CHECK (statut_justificatif IN ('en_attente', 'valide', 'rejete')),
ADD COLUMN IF NOT EXISTS justificatif_url TEXT,
ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS valide_par UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS commentaire_validation TEXT;

-- 2. Créer une fonction pour valider/rejeter les justificatifs
CREATE OR REPLACE FUNCTION validate_payment_justification(
    p_payment_id INTEGER,
    p_status VARCHAR,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que l'utilisateur est financier
    IF NOT EXISTS (
        SELECT 1 FROM utilisateur u 
        JOIN role r ON u.id_role = r.id_role 
        WHERE u.id_utilisateur = auth.uid() 
        AND r.nom_role = 'financier'
    ) THEN
        RAISE EXCEPTION 'Seuls les financiers peuvent valider les justificatifs';
    END IF;

    -- Vérifier que le statut est valide
    IF p_status NOT IN ('valide', 'rejete') THEN
        RAISE EXCEPTION 'Statut invalide. Utilisez "valide" ou "rejete"';
    END IF;

    -- Mettre à jour le paiement
    UPDATE public.historique_paiement 
    SET 
        statut_justificatif = p_status,
        date_validation = NOW(),
        valide_par = auth.uid(),
        commentaire_validation = p_comment,
        modified_at = NOW()
    WHERE id_historique_paiement = p_payment_id;

    -- Vérifier que la mise à jour a eu lieu
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paiement non trouvé ou non autorisé';
    END IF;

    -- Créer une notification pour le technicien si nécessaire
    INSERT INTO public.notification (
        id_destinataire,
        titre,
        message,
        type,
        entity_type,
        entity_id
    )
    SELECT 
        hp.id_technicien,
        CASE 
            WHEN p_status = 'valide' THEN 'Justificatif validé'
            ELSE 'Justificatif rejeté'
        END,
        CASE 
            WHEN p_status = 'valide' THEN 'Votre justificatif de paiement a été validé pour le montant de ' || hp.montant || ' Ar'
            ELSE 'Votre justificatif de paiement a été rejeté. Raison: ' || COALESCE(p_comment, 'Non spécifiée')
        END,
        CASE 
            WHEN p_status = 'valide' THEN 'payment_validated'
            ELSE 'payment_rejected'
        END,
        'historique_paiement',
        p_payment_id
    FROM public.historique_paiement hp
    WHERE hp.id_historique_paiement = p_payment_id
    AND hp.id_technicien IS NOT NULL;

    RETURN TRUE;
END;
$$;

-- 3. Créer une fonction pour obtenir les statistiques financières réelles
CREATE OR REPLACE FUNCTION get_financial_summary()
RETURNS TABLE(
    budget_total NUMERIC,
    montant_engage NUMERIC,
    montant_utilise NUMERIC,
    solde_disponible NUMERIC,
    jalons_en_attente INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Budget total basé sur les investissements
        COALESCE(SUM(DISTINCT i.montant), 0) as budget_total,
        -- Montant engagé (jalons confirmés mais non payés)
        COALESCE(SUM(DISTINCT CASE WHEN jp.statut = 'En cours' THEN cjp.montant_total ELSE 0 END), 0) as montant_engage,
        -- Montant utilisé (paiements effectués)
        COALESCE(SUM(DISTINCT hp.montant), 0) as montant_utilise,
        -- Solde disponible
        COALESCE(SUM(DISTINCT i.montant), 0) - COALESCE(SUM(DISTINCT hp.montant), 0) as solde_disponible,
        -- Jalons en attente de paiement
        COUNT(DISTINCT CASE WHEN jp.statut IN ('En attente de paiement', 'Prévu') THEN jp.id_jalon_projet END)::INTEGER as jalons_en_attente
    FROM investissement i
    FULL OUTER JOIN projet p ON i.id_projet = p.id_projet
    FULL OUTER JOIN jalon_projet jp ON p.id_projet = jp.id_projet
    FULL OUTER JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
    FULL OUTER JOIN historique_paiement hp ON p.id_projet = hp.id_projet;
END;
$$;

-- 4. Créer une fonction pour obtenir les prévisions financières
CREATE OR REPLACE FUNCTION get_financial_forecasts()
RETURNS TABLE(
    periode TEXT,
    montant_prevu NUMERIC,
    montant_engage NUMERIC,
    ecart NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(jp.date_previsionnelle, 'YYYY-MM') as periode,
        COALESCE(SUM(cjp.montant_total), 0) as montant_prevu,
        COALESCE(SUM(CASE WHEN jp.statut IN ('En cours', 'Terminé') THEN cjp.montant_total ELSE 0 END), 0) as montant_engage,
        COALESCE(SUM(cjp.montant_total), 0) - COALESCE(SUM(CASE WHEN jp.statut IN ('En cours', 'Terminé') THEN cjp.montant_total ELSE 0 END), 0) as ecart
    FROM jalon_projet jp
    LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
    WHERE jp.date_previsionnelle >= CURRENT_DATE - INTERVAL '6 months'
    AND jp.date_previsionnelle <= CURRENT_DATE + INTERVAL '6 months'
    GROUP BY TO_CHAR(jp.date_previsionnelle, 'YYYY-MM')
    ORDER BY periode;
END;
$$;

-- 5. Mettre à jour la politique RLS pour historique_paiement
DROP POLICY IF EXISTS "Voir l'historique des paiements des projets impliqués" ON public.historique_paiement;

CREATE POLICY "Voir l'historique des paiements des projets impliqués" ON public.historique_paiement
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projet p
        WHERE p.id_projet = historique_paiement.id_projet 
        AND (
            p.id_tantsaha = auth.uid() 
            OR p.id_technicien = auth.uid() 
            OR p.id_superviseur = auth.uid()
            OR EXISTS (
                SELECT 1 FROM investissement i 
                WHERE i.id_projet = p.id_projet AND i.id_investisseur = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM utilisateur u 
                JOIN role r ON u.id_role = r.id_role 
                WHERE u.id_utilisateur = auth.uid() AND r.nom_role = 'financier'
            )
        )
    )
);

-- 6. Créer une policy pour la mise à jour (validation) par les financiers
CREATE POLICY "Financiers peuvent valider les paiements" ON public.historique_paiement
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM utilisateur u 
        JOIN role r ON u.id_role = r.id_role 
        WHERE u.id_utilisateur = auth.uid() AND r.nom_role = 'financier'
    )
);

COMMIT;

RAISE NOTICE 'Migration système financier terminée avec succès';
RAISE NOTICE 'Colonnes ajoutées: statut_justificatif, justificatif_url, date_validation, valide_par, commentaire_validation';
RAISE NOTICE 'Fonctions créées: validate_payment_justification, get_financial_summary, get_financial_forecasts';
RAISE NOTICE 'Politiques RLS mises à jour pour les financiers';