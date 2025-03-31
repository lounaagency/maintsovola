
-- Check if the table exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification') THEN
        CREATE TABLE public.notification (
            id_notification SERIAL PRIMARY KEY,
            id_expediteur VARCHAR(255) REFERENCES public.utilisateur(id_utilisateur), -- Can be NULL for system notifications
            id_destinataire VARCHAR(255) NOT NULL REFERENCES public.utilisateur(id_utilisateur),
            titre VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            lu BOOLEAN DEFAULT FALSE,
            date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            type VARCHAR(50) DEFAULT 'info', -- 'info', 'validation', 'alerte', 'erreur'
            entity_id VARCHAR(255), -- ID of related entity (terrain, projet, etc.)
            entity_type VARCHAR(50), -- Type of entity ('terrain', 'projet', 'jalon', 'investissement')
            projet_id INT -- Reference to specific project if applicable
        );
        
        -- Add index for better query performance
        CREATE INDEX idx_notification_destinataire ON public.notification(id_destinataire);
        CREATE INDEX idx_notification_lu ON public.notification(lu);
        CREATE INDEX idx_notification_date ON public.notification(date_creation);
        
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
            
        -- Enable realtime functionality
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;
        ALTER TABLE public.notification REPLICA IDENTITY FULL;
    END IF;
END
$$;
