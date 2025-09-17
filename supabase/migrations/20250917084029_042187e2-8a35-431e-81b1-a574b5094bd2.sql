-- Corriger la fonction request_milestone_payment pour enlever la dépendance à vue_jalons_technicien
CREATE OR REPLACE FUNCTION public.request_milestone_payment(p_jalon_projet_id integer, p_technicien_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_projet_info RECORD;
    v_jalon_info RECORD;
    v_technicien_info RECORD;
BEGIN
    -- Récupérer les informations du jalon et du projet
    SELECT 
        jp.id_jalon_projet,
        jp.id_projet,
        jp.statut,
        ja.nom_jalon,
        p.titre as projet_titre,
        p.id_technicien,
        COALESCE(SUM(cjp.montant_total), 0) as montant_total
    INTO v_jalon_info
    FROM jalon_projet jp
    JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
    JOIN projet p ON jp.id_projet = p.id_projet
    LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
    WHERE jp.id_jalon_projet = p_jalon_projet_id
    GROUP BY jp.id_jalon_projet, jp.id_projet, jp.statut, ja.nom_jalon, p.titre, p.id_technicien;

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

    -- Récupérer les infos du technicien
    SELECT nom, prenoms INTO v_technicien_info
    FROM utilisateur 
    WHERE id_utilisateur = p_technicien_id;

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
        'Le technicien ' || v_technicien_info.nom || ' ' || COALESCE(v_technicien_info.prenoms, '') || 
        ' demande le paiement pour le jalon "' || v_jalon_info.nom_jalon || 
        '" du projet "' || v_jalon_info.projet_titre || '" (Montant: ' || 
        COALESCE(v_jalon_info.montant_total, 0) || ' Ar)',
        'payment_request',
        'jalon_projet',
        p_jalon_projet_id
    FROM utilisateur u
    JOIN role r ON u.id_role = r.id_role
    WHERE r.nom_role = 'financier';

    RETURN TRUE;
END;
$$;