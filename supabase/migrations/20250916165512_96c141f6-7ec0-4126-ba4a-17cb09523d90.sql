-- Corriger la vue vue_jalons_technicien pour calculer automatiquement les montants
-- à partir des coûts de référence quand cout_jalon_projet n'existe pas

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
    -- Calcul automatique du montant total
    COALESCE(
        -- Si des coûts spécifiques existent dans cout_jalon_projet, les utiliser
        SUM(cjp.montant_total),
        -- Sinon, calculer automatiquement depuis les coûts de référence
        (
            SELECT SUM(cjr.montant_par_hectare * p.surface_ha)
            FROM cout_jalon_reference cjr
            JOIN projet_culture pc ON (pc.id_culture = cjr.id_culture AND pc.id_projet = p.id_projet)
            WHERE cjr.id_jalon_agricole = ja.id_jalon_agricole
        ),
        -- Valeur par défaut si aucun coût n'est trouvé
        0
    ) AS montant_total,
    -- Types de dépenses (soit spécifiques, soit depuis les références)
    COALESCE(
        STRING_AGG(DISTINCT cjp.type_depense, ', '),
        (
            SELECT STRING_AGG(DISTINCT cjr.type_depense, ', ')
            FROM cout_jalon_reference cjr
            JOIN projet_culture pc ON (pc.id_culture = cjr.id_culture AND pc.id_projet = p.id_projet)
            WHERE cjr.id_jalon_agricole = ja.id_jalon_agricole
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

-- Créer une fonction pour demander le paiement d'un jalon
CREATE OR REPLACE FUNCTION request_milestone_payment(
    p_jalon_projet_id INTEGER,
    p_technicien_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que le jalon appartient bien au technicien
    IF NOT EXISTS (
        SELECT 1 FROM vue_jalons_technicien 
        WHERE id_jalon_projet = p_jalon_projet_id 
        AND id_technicien = p_technicien_id
        AND statut = 'Prévu'
    ) THEN
        RAISE EXCEPTION 'Jalon non trouvé ou non autorisé pour ce technicien';
    END IF;

    -- Mettre à jour le statut du jalon et enregistrer la demande
    UPDATE jalon_projet 
    SET 
        statut = 'En attente de paiement',
        date_demande_paiement = NOW(),
        demande_paiement_par = p_technicien_id
    WHERE id_jalon_projet = p_jalon_projet_id;

    -- Créer une notification pour le financier
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
        'Demande de paiement pour le jalon "' || vj.nom_jalon || '" du projet "' || vj.projet_titre || '"',
        'payment_request',
        'jalon_projet',
        p_jalon_projet_id
    FROM utilisateur u
    JOIN role r ON u.id_role = r.id_role
    CROSS JOIN vue_jalons_technicien vj
    WHERE r.nom_role = 'financier'
    AND vj.id_jalon_projet = p_jalon_projet_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;