
-- Étape 1: Modifier les statuts des jalons pour inclure les nouveaux états
ALTER TABLE jalon_projet 
DROP CONSTRAINT IF EXISTS statut_check;

ALTER TABLE jalon_projet 
ADD CONSTRAINT statut_check 
CHECK (statut IN ('Prévu', 'En attente de paiement', 'Payé', 'En cours', 'Terminé', 'Retardé'));

-- Étape 2: Modifier les statuts de paiement pour être plus clairs
ALTER TABLE cout_jalon_projet 
DROP CONSTRAINT IF EXISTS statut_paiement_check;

ALTER TABLE cout_jalon_projet 
ADD CONSTRAINT statut_paiement_check 
CHECK (statut_paiement IN ('Non demandé', 'Demandé', 'Payé'));

-- Étape 3: Ajouter une colonne pour tracker les demandes de paiement
ALTER TABLE jalon_projet 
ADD COLUMN IF NOT EXISTS date_demande_paiement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS demande_paiement_par UUID REFERENCES auth.users(id);

-- Étape 4: Modifier la fonction de génération des jalons pour calculer automatiquement les montants
CREATE OR REPLACE FUNCTION generate_project_milestones()
RETURNS TRIGGER AS $$
DECLARE
    culture_record RECORD;
    jalon_record RECORD;
    cout_record RECORD;
    date_lancement DATE;
    date_jalon DATE;
    jalon_projet_id INTEGER;
BEGIN
    -- Vérifier que c'est bien un passage à "en_cours"
    IF NEW.statut = 'en_cours' AND OLD.statut != 'en_cours' THEN
        date_lancement := NEW.date_debut_production;
        
        -- Pour chaque culture du projet
        FOR culture_record IN 
            SELECT pc.id_culture 
            FROM projet_culture pc 
            WHERE pc.id_projet = NEW.id_projet
        LOOP
            -- Pour chaque jalon associé à cette culture
            FOR jalon_record IN 
                SELECT ja.* 
                FROM jalon_agricole ja 
                WHERE ja.id_culture = culture_record.id_culture
            LOOP
                -- Calculer la date prévue du jalon
                date_jalon := date_lancement + (jalon_record.delai_apres_lancement || ' days')::INTERVAL;
                
                -- Créer le jalon pour ce projet
                INSERT INTO jalon_projet (
                    id_projet, 
                    id_jalon_agricole, 
                    date_previsionnelle, 
                    statut, 
                    created_by
                ) VALUES (
                    NEW.id_projet,
                    jalon_record.id_jalon_agricole,
                    date_jalon,
                    'Prévu',
                    NEW.created_by
                )
                RETURNING id_jalon_projet INTO jalon_projet_id;
                
                -- Générer les coûts associés à ce jalon pour ce projet avec calcul automatique
                FOR cout_record IN 
                    SELECT * 
                    FROM cout_jalon_reference cjr 
                    WHERE cjr.id_jalon_agricole = jalon_record.id_jalon_agricole 
                    AND cjr.id_culture = culture_record.id_culture
                LOOP
                    INSERT INTO cout_jalon_projet (
                        id_projet,
                        id_jalon_projet,
                        type_depense,
                        montant_par_hectare,
                        montant_total,
                        statut_paiement,
                        created_by
                    ) VALUES (
                        NEW.id_projet,
                        jalon_projet_id,
                        cout_record.type_depense,
                        cout_record.montant_par_hectare,
                        cout_record.montant_par_hectare * NEW.surface_ha,
                        'Non demandé',
                        NEW.created_by
                    );
                END LOOP;
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 5: Créer une fonction pour gérer les demandes de paiement
CREATE OR REPLACE FUNCTION request_milestone_payment(
    p_jalon_projet_id INTEGER,
    p_technicien_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que le jalon est en statut "Prévu"
    IF NOT EXISTS (
        SELECT 1 FROM jalon_projet 
        WHERE id_jalon_projet = p_jalon_projet_id 
        AND statut = 'Prévu'
    ) THEN
        RAISE EXCEPTION 'Le jalon doit être en statut Prévu pour demander un paiement';
    END IF;
    
    -- Mettre à jour le jalon
    UPDATE jalon_projet 
    SET 
        statut = 'En attente de paiement',
        date_demande_paiement = NOW(),
        demande_paiement_par = p_technicien_id
    WHERE id_jalon_projet = p_jalon_projet_id;
    
    -- Mettre à jour le statut de paiement des coûts associés
    UPDATE cout_jalon_projet 
    SET statut_paiement = 'Demandé'
    WHERE id_jalon_projet = p_jalon_projet_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Étape 6: Créer une fonction pour confirmer le paiement
CREATE OR REPLACE FUNCTION confirm_milestone_payment(
    p_jalon_projet_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que le jalon est en attente de paiement
    IF NOT EXISTS (
        SELECT 1 FROM jalon_projet 
        WHERE id_jalon_projet = p_jalon_projet_id 
        AND statut = 'En attente de paiement'
    ) THEN
        RAISE EXCEPTION 'Le jalon doit être en attente de paiement';
    END IF;
    
    -- Mettre à jour le jalon
    UPDATE jalon_projet 
    SET statut = 'Payé'
    WHERE id_jalon_projet = p_jalon_projet_id;
    
    -- Mettre à jour le statut de paiement des coûts associés
    UPDATE cout_jalon_projet 
    SET statut_paiement = 'Payé'
    WHERE id_jalon_projet = p_jalon_projet_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Étape 7: Créer une vue pour les jalons avec montants calculés pour les techniciens
CREATE OR REPLACE VIEW vue_jalons_technicien AS
SELECT 
    jp.id_jalon_projet,
    jp.id_projet,
    jp.statut,
    jp.date_previsionnelle,
    jp.date_demande_paiement,
    p.titre as projet_titre,
    p.surface_ha,
    p.id_technicien,
    ja.nom_jalon,
    SUM(cjp.montant_total) as montant_total,
    STRING_AGG(cjp.type_depense, ', ') as types_depenses
FROM jalon_projet jp
JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
JOIN projet p ON jp.id_projet = p.id_projet
LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
GROUP BY 
    jp.id_jalon_projet, jp.id_projet, jp.statut, jp.date_previsionnelle, 
    jp.date_demande_paiement, p.titre, p.surface_ha, p.id_technicien, ja.nom_jalon;

-- Étape 8: Créer une vue pour les demandes de paiement pour les financiers
CREATE OR REPLACE VIEW vue_demandes_paiement_financier AS
SELECT 
    jp.id_jalon_projet,
    jp.id_projet,
    jp.date_demande_paiement,
    jp.demande_paiement_par as id_technicien,
    p.titre as projet_titre,
    u.nom as technicien_nom,
    u.prenoms as technicien_prenoms,
    ja.nom_jalon,
    SUM(cjp.montant_total) as montant_demande,
    p.surface_ha
FROM jalon_projet jp
JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
JOIN projet p ON jp.id_projet = p.id_projet
JOIN utilisateur u ON jp.demande_paiement_par = u.id_utilisateur
LEFT JOIN cout_jalon_projet cjp ON jp.id_jalon_projet = cjp.id_jalon_projet
WHERE jp.statut = 'En attente de paiement'
GROUP BY 
    jp.id_jalon_projet, jp.id_projet, jp.date_demande_paiement, 
    jp.demande_paiement_par, p.titre, u.nom, u.prenoms, ja.nom_jalon, p.surface_ha
ORDER BY jp.date_demande_paiement DESC;
