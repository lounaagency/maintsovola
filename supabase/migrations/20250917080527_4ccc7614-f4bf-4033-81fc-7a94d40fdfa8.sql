-- CORRECTION CRITIQUE 1: Ajouter la politique RLS manquante pour INSERT sur historique_paiement
CREATE POLICY "Financiers peuvent créer des paiements" 
ON public.historique_paiement 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM utilisateur u 
        JOIN role r ON u.id_role = r.id_role 
        WHERE u.id_utilisateur = auth.uid() 
        AND r.nom_role = 'financier'
    )
);

-- CORRECTION CRITIQUE 2: Corriger get_financial_summary pour retourner un objet unique
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS TABLE(budget_total numeric, montant_engage numeric, montant_utilise numeric, solde_disponible numeric, jalons_en_attente integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result_budget_total numeric := 0;
    result_montant_engage numeric := 0;
    result_montant_utilise numeric := 0;
    result_solde_disponible numeric := 0;
    result_jalons_en_attente integer := 0;
BEGIN
    -- Budget total basé sur les investissements
    SELECT COALESCE(SUM(i.montant), 0)
    INTO result_budget_total
    FROM investissement i;
    
    -- Montant engagé (jalons confirmés mais non payés)
    SELECT COALESCE(SUM(cjp.montant_total), 0)
    INTO result_montant_engage
    FROM jalon_projet jp
    JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
    WHERE jp.statut = 'En cours';
    
    -- Montant utilisé (paiements effectués)
    SELECT COALESCE(SUM(hp.montant), 0)
    INTO result_montant_utilise
    FROM historique_paiement hp;
    
    -- Solde disponible
    result_solde_disponible := result_budget_total - result_montant_utilise;
    
    -- Jalons en attente de paiement
    SELECT COUNT(*)::INTEGER
    INTO result_jalons_en_attente
    FROM jalon_projet jp
    WHERE jp.statut IN ('En attente de paiement', 'Prévu');
    
    -- Retourner une seule ligne
    RETURN QUERY SELECT 
        result_budget_total,
        result_montant_engage,
        result_montant_utilise,
        result_solde_disponible,
        result_jalons_en_attente;
END;
$$;