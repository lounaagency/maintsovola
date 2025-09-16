-- Corriger la vue vue_jalons_technicien pour calculer automatiquement les montants
DROP VIEW IF EXISTS vue_jalons_technicien;

CREATE VIEW vue_jalons_technicien AS
SELECT 
    jp.id_jalon_projet,
    jp.id_projet,
    jp.statut,
    jp.date_previsionnelle,
    jp.date_demande_paiement,
    p.titre AS projet_titre,
    p.surface_ha,
    p.id_technicien,
    ja.nom_jalon,
    -- Calcul du montant total en utilisant les coûts de référence directement
    COALESCE(
        SUM(cjp.montant_total),
        (
            SELECT SUM(cjr.montant_par_hectare * p.surface_ha)
            FROM cout_jalon_reference cjr
            WHERE cjr.id_jalon_agricole = ja.id_jalon_agricole
            AND cjr.id_culture IN (
                SELECT pc.id_culture 
                FROM projet_culture pc 
                WHERE pc.id_projet = jp.id_projet
            )
        ),
        0
    ) AS montant_total,
    -- Types de dépenses
    COALESCE(
        STRING_AGG(DISTINCT cjp.type_depense, ', '),
        (
            SELECT STRING_AGG(DISTINCT cjr.type_depense, ', ')
            FROM cout_jalon_reference cjr
            WHERE cjr.id_jalon_agricole = ja.id_jalon_agricole
            AND cjr.id_culture IN (
                SELECT pc.id_culture 
                FROM projet_culture pc 
                WHERE pc.id_projet = jp.id_projet
            )
        )
    ) AS types_depenses
FROM jalon_projet jp
JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
JOIN projet p ON jp.id_projet = p.id_projet
LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
GROUP BY 
    jp.id_jalon_projet, 
    jp.id_projet, 
    jp.statut, 
    jp.date_previsionnelle, 
    jp.date_demande_paiement, 
    p.titre, 
    p.surface_ha, 
    p.id_technicien, 
    ja.nom_jalon,
    ja.id_jalon_agricole;

-- Créer une fonction améliorée pour demander le paiement d'un jalon
CREATE OR REPLACE FUNCTION request_milestone_payment(
    p_jalon_projet_id INTEGER,
    p_technicien_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_jalon_info RECORD;
BEGIN
    -- Récupérer les informations du jalon
    SELECT * INTO v_jalon_info 
    FROM vue_jalons_technicien 
    WHERE id_jalon_projet = p_jalon_projet_id;

    -- Vérifications
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jalon non trouvé';
    END IF;

    IF v_jalon_info.id_technicien != p_technicien_id THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à demander le paiement de ce jalon';
    END IF;

    IF v_jalon_info.statut != 'Prévu' THEN
        RAISE EXCEPTION 'Ce jalon n''est pas dans un état permettant une demande de paiement (statut: %)', v_jalon_info.statut;
    END IF;

    -- Mettre à jour le statut du jalon
    UPDATE jalon_projet 
    SET 
        statut = 'En attente de paiement',
        date_demande_paiement = NOW(),
        demande_paiement_par = p_technicien_id
    WHERE id_jalon_projet = p_jalon_projet_id;

    -- Créer une notification pour les financiers
    INSERT INTO notification (
        id_destinataire, 
        titre, 
        message, 
        type, 
        entity_type, 
        entity_id
    )
    SELECT 
        u.id_utilisateur,
        'Nouvelle demande de paiement',
        'Le technicien ' || t.nom || ' ' || COALESCE(t.prenoms, '') || 
        ' demande le paiement pour le jalon "' || v_jalon_info.nom_jalon || 
        '" du projet "' || v_jalon_info.projet_titre || '" (Montant: ' || 
        COALESCE(v_jalon_info.montant_total, 0) || ' Ar)',
        'payment_request',
        'jalon_projet',
        p_jalon_projet_id
    FROM utilisateur u
    JOIN role r ON u.id_role = r.id_role
    CROSS JOIN utilisateur t
    WHERE r.nom_role = 'financier'
    AND t.id_utilisateur = p_technicien_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;