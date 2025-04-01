
-- Create notification table
CREATE TABLE IF NOT EXISTS public.notification (
    id_notification SERIAL PRIMARY KEY,
    id_expediteur UUID REFERENCES public.utilisateur(id_utilisateur), -- Can be NULL for system notifications
    id_destinataire UUID NOT NULL REFERENCES public.utilisateur(id_utilisateur),
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'validation', 'alerte', 'erreur'
    entity_id INTEGER, -- ID of related entity (terrain, projet, etc.)
    entity_type VARCHAR(50), -- Type of entity ('terrain', 'projet', 'jalon', 'investissement')
    projet_id INT -- Reference to specific project if applicable
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_destinataire ON public.notification(id_destinataire);
CREATE INDEX IF NOT EXISTS idx_notification_lu ON public.notification(lu);
CREATE INDEX IF NOT EXISTS idx_notification_date ON public.notification(date_creation);

-- Enable row-level security
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- Policy for reading notifications - users can only see their own notifications
CREATE POLICY notification_read_policy ON public.notification 
    FOR SELECT 
    USING (id_destinataire = auth.uid());

-- Policy for updating notifications - users can only update their own notifications
CREATE POLICY notification_update_policy ON public.notification 
    FOR UPDATE 
    USING (id_destinataire = auth.uid());

-- Enable realtime functionality for the notification table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;

-- Set replica identity to full to ensure complete row data is available in realtime events
ALTER TABLE public.notification REPLICA IDENTITY FULL;

-- Create functions for automated notifications based on business rules

-- 1. Terrain added notification to supervisors
CREATE OR REPLACE FUNCTION notify_terrain_added()
RETURNS TRIGGER AS $$
BEGIN
    -- Find all supervisors
    INSERT INTO public.notification (
        id_expediteur, 
        id_destinataire, 
        titre, 
        message, 
        type, 
        entity_id, 
        entity_type
    )
    SELECT
        NEW.id_utilisateur,
        u.id_utilisateur,
        'Nouveau terrain ajouté',
        'Un nouveau terrain a été ajouté et est en attente de validation.',
        'info',
        NEW.id_terrain::VARCHAR,
        'terrain'
    FROM public.utilisateur u
    JOIN public.role r ON u.id_role = r.id_role
    WHERE r.nom_role = 'superviseur';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER terrain_added_notification
AFTER INSERT ON public.terrain
FOR EACH ROW
EXECUTE PROCEDURE notify_terrain_added();

-- 2. Technicien assignment notification
CREATE OR REPLACE FUNCTION notify_technicien_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the technicien field was actually updated
    IF OLD.id_technicien IS DISTINCT FROM NEW.id_technicien AND NEW.id_technicien IS NOT NULL THEN
        INSERT INTO public.notification (
            id_expediteur,
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type
        )
        VALUES (
            current_setting('request.jwt.claims', true)::json->>'sub', -- Current user (supervisor)
            NEW.id_technicien,
            'Terrain assigné',
            'Un terrain vous a été assigné. Il est en attente de votre descente sur place.',
            'info',
            NEW.id_terrain::VARCHAR,
            'terrain'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER technicien_assigned_notification
AFTER UPDATE ON public.terrain
FOR EACH ROW
EXECUTE PROCEDURE notify_technicien_assigned();

-- 3. Terrain validation notification
CREATE OR REPLACE FUNCTION notify_terrain_validated()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the validation status changed from non-validated to validated
    IF OLD.statut_validation IS DISTINCT FROM NEW.statut_validation AND NEW.statut_validation = 'valide' THEN
        INSERT INTO public.notification (
            id_expediteur,
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type
        )
        VALUES (
            NEW.id_technicien, -- Technicien who validated
            NEW.id_utilisateur, -- Farmer who owns the terrain
            'Terrain validé',
            'Votre terrain a été validé et est maintenant disponible pour créer un projet.',
            'success',
            NEW.id_terrain::VARCHAR,
            'terrain'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER terrain_validated_notification
AFTER UPDATE ON public.terrain
FOR EACH ROW
EXECUTE PROCEDURE notify_terrain_validated();

-- 4. Project creation notification
CREATE OR REPLACE FUNCTION notify_project_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Get terrain information to notify appropriate people
    DECLARE
        terrain_record RECORD;
    BEGIN
        SELECT id_utilisateur, id_superviseur, id_technicien 
        INTO terrain_record
        FROM public.terrain
        WHERE id_terrain = NEW.id_terrain;
        
        -- Notify supervisors
        IF terrain_record.id_superviseur IS NOT NULL THEN
            INSERT INTO public.notification (
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
                NEW.id_tantsaha, -- Farmer who created the project
                terrain_record.id_superviseur,
                'Nouveau projet créé',
                'Un nouveau projet a été soumis et est en attente de validation.',
                'info',
                NEW.id_projet::VARCHAR,
                'projet',
                NEW.id_projet
            );
        END IF;
        
        -- Notify technicians
        IF terrain_record.id_technicien IS NOT NULL THEN
            INSERT INTO public.notification (
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
                NEW.id_tantsaha,
                terrain_record.id_technicien,
                'Nouveau projet créé',
                'Un nouveau projet a été soumis et est en attente de validation.',
                'info',
                NEW.id_projet::VARCHAR,
                'projet',
                NEW.id_projet
            );
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER project_created_notification
AFTER INSERT ON public.projet
FOR EACH ROW
EXECUTE PROCEDURE notify_project_created();

-- 5. Project validation notification
CREATE OR REPLACE FUNCTION notify_project_validated()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the status changed to validated
    IF OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'validé' THEN
        INSERT INTO public.notification (
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
            current_setting('request.jwt.claims', true)::json->>'sub', -- Current user (supervisor or technician)
            NEW.id_tantsaha, -- Farmer who owns the project
            'Projet validé',
            'Votre projet a été validé et est maintenant en levée de fonds.',
            'success',
            NEW.id_projet::VARCHAR,
            'projet',
            NEW.id_projet
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER project_validated_notification
AFTER UPDATE ON public.projet
FOR EACH ROW
EXECUTE PROCEDURE notify_project_validated();

-- 6. New investment notification
CREATE OR REPLACE FUNCTION notify_new_investment()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
BEGIN
    -- Get project information
    SELECT p.id_tantsaha, p.id_superviseur, t.id_technicien, p.titre
    INTO project_record
    FROM public.projet p
    JOIN public.terrain t ON p.id_terrain = t.id_terrain
    WHERE p.id_projet = NEW.id_projet;
    
    -- Notify farmer
    INSERT INTO public.notification (
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
        'success',
        NEW.id_investissement::VARCHAR,
        'investissement',
        NEW.id_projet
    );
    
    -- Notify supervisor if available
    IF project_record.id_superviseur IS NOT NULL THEN
        INSERT INTO public.notification (
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
            NEW.id_investissement::VARCHAR,
            'investissement',
            NEW.id_projet
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_project_fully_funded()
RETURNS TRIGGER AS $$
DECLARE
    total_investment DECIMAL;
    funding_goal DECIMAL;
    id_tantsaha UUID;
    id_technicien UUID;
    projet_titre TEXT;
BEGIN
    -- Calculer l'investissement total et obtenir l'objectif de financement
    SELECT SUM(i.montant), p.cout_total, p.id_tantsaha, t.id_technicien, p.titre
    INTO total_investment, funding_goal, id_tantsaha, id_technicien, projet_titre
    FROM public.investissement i
    JOIN public.projet p ON i.id_projet = p.id_projet
    JOIN public.terrain t ON p.id_terrain = t.id_terrain
    WHERE i.id_projet = NEW.id_projet
    GROUP BY p.id_projet, t.id_terrain;
    
    -- Vérifier si le financement est complété
    IF total_investment >= funding_goal AND OLD.statut != 'en_production' AND NEW.statut = 'en_production' THEN
        -- Notifier le tantsaha (agriculteur)
        INSERT INTO public.notification (
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type,
            projet_id
        )
        VALUES (
            id_tantsaha,
            'Financement complété',
            'Votre projet "' || COALESCE(projet_titre, 'Projet #' || NEW.id_projet) || 
            '" a atteint son objectif de financement et entre en phase de production.',
            'success',
            NEW.id_projet::VARCHAR,
            'projet',
            NEW.id_projet
        );
        
        -- Notifier le technicien si présent
        IF id_technicien IS NOT NULL THEN
            INSERT INTO public.notification (
                id_destinataire,
                titre,
                message,
                type,
                entity_id,
                entity_type,
                projet_id
            )
            VALUES (
                id_technicien,
                'Projet en production',
                'Le projet "' || COALESCE(projet_titre, 'Projet #' || NEW.id_projet) || 
                '" a atteint son objectif de financement et entre en phase de production.',
                'info',
                NEW.id_projet::VARCHAR,
                'projet',
                NEW.id_projet
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER project_fully_funded_notification
AFTER UPDATE ON public.projet
FOR EACH ROW
EXECUTE PROCEDURE notify_project_fully_funded();

-- 8 & 10. Jalon completion and intervention report notifications
CREATE OR REPLACE FUNCTION notify_jalon_update()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
BEGIN
    -- Get project information
    SELECT p.id_tantsaha, t.id_technicien, p.titre, j.nom
    INTO project_record
    FROM public.projet p
    JOIN public.terrain t ON p.id_terrain = t.id_terrain
    JOIN public.jalon j ON NEW.id_jalon = j.id_jalon
    WHERE p.id_projet = NEW.id_projet;
    
    -- Notification for jalon completion
    IF OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'Terminé' THEN
        -- Notify farmer
        INSERT INTO public.notification (
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
            project_record.id_technicien,
            project_record.id_tantsaha,
            'Jalon complété',
            'Le jalon "' || project_record.nom || '" a été complété pour votre projet "' || 
            COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '".',
            'success',
            NEW.id_projet_jalon::VARCHAR,
            'jalon',
            NEW.id_projet
        );
    END IF;
    
    -- Notification for intervention report
    IF OLD.date_reelle_execution IS NULL AND NEW.date_reelle_execution IS NOT NULL THEN
        -- Notify farmer about the intervention report
        INSERT INTO public.notification (
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
            project_record.id_technicien,
            project_record.id_tantsaha,
            'Rapport d''intervention',
            'Un rapport d''intervention a été ajouté pour le jalon "' || project_record.nom || 
            '" de votre projet "' || COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || '".',
            'info',
            NEW.id_projet_jalon::VARCHAR,
            'jalon',
            NEW.id_projet
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER jalon_update_notification
AFTER UPDATE ON public.projet_jalon
FOR EACH ROW
EXECUTE PROCEDURE notify_jalon_update();

-- 9. Project completion notification
CREATE OR REPLACE FUNCTION notify_project_completed()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
    investor RECORD;
BEGIN
    -- Only notify if the status changed to completed
    IF OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'terminé' THEN
        -- Get project information
        SELECT p.id_tantsaha, t.id_technicien, p.titre
        INTO project_record
        FROM public.projet p
        JOIN public.terrain t ON p.id_terrain = t.id_terrain
        WHERE p.id_projet = NEW.id_projet;
        
        -- Notify farmer
        INSERT INTO public.notification (
            id_destinataire,
            titre,
            message,
            type,
            entity_id,
            entity_type,
            projet_id
        )
        VALUES (
            project_record.id_tantsaha,
            'Projet terminé',
            'Votre projet "' || COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || 
            '" est terminé. La récolte est prête.',
            'success',
            NEW.id_projet::VARCHAR,
            'projet',
            NEW.id_projet
        );
        
        -- Notify technician
        IF project_record.id_technicien IS NOT NULL THEN
            INSERT INTO public.notification (
                id_destinataire,
                titre,
                message,
                type,
                entity_id,
                entity_type,
                projet_id
            )
            VALUES (
                project_record.id_technicien,
                'Projet terminé',
                'Le projet "' || COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || 
                '" est terminé. La récolte est prête.',
                'success',
                NEW.id_projet::VARCHAR,
                'projet',
                NEW.id_projet
            );
        END IF;
        
        -- Notify all investors
        FOR investor IN 
            SELECT DISTINCT id_investisseur 
            FROM public.investissement 
            WHERE id_projet = NEW.id_projet
        LOOP
            INSERT INTO public.notification (
                id_destinataire,
                titre,
                message,
                type,
                entity_id,
                entity_type,
                projet_id
            )
            VALUES (
                investor.id_investisseur,
                'Projet terminé',
                'Le projet "' || COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || 
                '" dans lequel vous avez investi est terminé. La récolte est prête.',
                'success',
                NEW.id_projet::VARCHAR,
                'projet',
                NEW.id_projet
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER project_completed_notification
AFTER UPDATE ON public.projet
FOR EACH ROW
EXECUTE PROCEDURE notify_project_completed();

-- 11. Jalon update notification for investors
CREATE OR REPLACE FUNCTION notify_investors_jalon_update()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
    investor RECORD;
BEGIN
    -- Only notify if the status changed to completed
    IF OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'Terminé' THEN
        -- Get project information
        SELECT p.titre, j.nom
        INTO project_record
        FROM public.projet p
        JOIN public.jalon j ON NEW.id_jalon = j.id_jalon
        WHERE p.id_projet = NEW.id_projet;
        
        -- Notify all investors of this project
        FOR investor IN 
            SELECT DISTINCT id_investisseur 
            FROM public.investissement 
            WHERE id_projet = NEW.id_projet
        LOOP
            INSERT INTO public.notification (
                id_destinataire,
                titre,
                message,
                type,
                entity_id,
                entity_type,
                projet_id
            )
            VALUES (
                investor.id_investisseur,
                'Mise à jour du projet',
                'Le projet "' || COALESCE(project_record.titre, 'Projet #' || NEW.id_projet) || 
                '" dans lequel vous avez investi a atteint le jalon "' || project_record.nom || '".',
                'info',
                NEW.id_projet_jalon::VARCHAR,
                'jalon',
                NEW.id_projet
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER investors_jalon_update_notification
AFTER UPDATE ON public.projet_jalon
FOR EACH ROW
EXECUTE PROCEDURE notify_investors_jalon_update();
