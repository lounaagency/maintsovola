
-- Create notification table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
    CREATE TYPE notification_type_enum AS ENUM ('info', 'validation', 'alerte', 'erreur', 'assignment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type_enum') THEN
    CREATE TYPE entity_type_enum AS ENUM ('terrain', 'projet', 'jalon', 'investissement');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification') THEN
    CREATE TABLE notification (
      id_notification SERIAL PRIMARY KEY,
      id_expediteur UUID REFERENCES auth.users(id),
      id_destinataire UUID REFERENCES auth.users(id) NOT NULL,
      titre VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      lu BOOLEAN DEFAULT false,
      date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      type notification_type_enum DEFAULT 'info',
      entity_id TEXT,
      entity_type entity_type_enum,
      projet_id INTEGER
    );
    
    -- Add index for faster queries on destinataire and lu status
    CREATE INDEX notification_destinataire_idx ON notification(id_destinataire);
    CREATE INDEX notification_lu_idx ON notification(lu);
    CREATE INDEX notification_date_creation_idx ON notification(date_creation);
  END IF;
END$$;

-- Enable row level security
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read their own notifications" ON notification;
  DROP POLICY IF EXISTS "Users can create notifications" ON notification;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notification;
  
  -- Create new policies
  CREATE POLICY "Users can read their own notifications" 
    ON notification FOR SELECT 
    USING (id_destinataire = auth.uid());
    
  CREATE POLICY "Users can create notifications" 
    ON notification FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Users can update their own notifications" 
    ON notification FOR UPDATE 
    USING (id_destinataire = auth.uid());
END$$;

-- Create index to enable realtime subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'notification_realtime_idx'
  ) THEN
    CREATE INDEX notification_realtime_idx ON notification (id_destinataire);
  END IF;
END$$;
