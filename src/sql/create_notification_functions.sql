
-- Create a function to notify users when there's a new investment
CREATE OR REPLACE FUNCTION notify_new_investment()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
    existing_investors RECORD;
BEGIN
    -- Get project information
    SELECT 
        p.id_tantsaha, 
        p.titre,
        t.id_technicien,
        p.id_superviseur
    INTO project_record
    FROM projet p
    JOIN terrain t ON p.id_terrain = t.id_terrain
    WHERE p.id_projet = NEW.id_projet;
    
    -- Notify the farmer (project owner)
    INSERT INTO notification (
        id_expediteur,
        id_destinataire,
        titre,
        message,
        type,
        entity_id,
        entity_type,
        projet_id
    )
    VALUES (
        NEW.id_investisseur,
        project_record.id_tantsaha,
        'Nouvel investissement',
        'Un nouvel investissement de ' || NEW.montant || ' Ar a été réalisé sur votre projet "' || 
        COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '".',
        'info',
        NEW.id_investissement,
        'investissement',
        NEW.id_projet
    );
    
    -- Notify supervisor if available
    IF project_record.id_superviseur IS NOT NULL THEN
        INSERT INTO notification (
            id_expediteur,
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type,
            projet_id
        )
        VALUES (
            NEW.id_investisseur,
            project_record.id_superviseur,
            'Nouvel investissement',
            'Un nouvel investissement de ' || NEW.montant || ' Ar a été réalisé sur le projet "' || 
            COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '".',
            'info',
            NEW.id_investissement,
            'investissement',
            NEW.id_projet
        );
    END IF;
    
    -- Notify technician if available
    IF project_record.id_technicien IS NOT NULL THEN
        INSERT INTO notification (
            id_expediteur,
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type,
            projet_id
        )
        VALUES (
            NEW.id_investisseur,
            project_record.id_technicien,
            'Nouvel investissement',
            'Un nouvel investissement de ' || NEW.montant || ' Ar a été réalisé sur le projet "' || 
            COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '".',
            'info',
            NEW.id_investissement,
            'investissement',
            NEW.id_projet
        );
    END IF;
    
    -- Notify other investors (except the current one)
    FOR existing_investors IN 
        SELECT DISTINCT id_investisseur 
        FROM investissement 
        WHERE id_projet = NEW.id_projet 
        AND id_investisseur != NEW.id_investisseur
    LOOP
        INSERT INTO notification (
            id_expediteur,
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type,
            projet_id
        )
        VALUES (
            NEW.id_investisseur,
            existing_investors.id_investisseur,
            'Nouvel co-investissement',
            'Un nouvel investissement de ' || NEW.montant || ' Ar a été réalisé sur le projet "' || 
            COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '" dans lequel vous avez investi.',
            'info',
            NEW.id_investissement,
            'investissement',
            NEW.id_projet
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a new investment is inserted
CREATE TRIGGER trigger_notify_new_investment
AFTER INSERT ON investissement
FOR EACH ROW
EXECUTE FUNCTION notify_new_investment();
