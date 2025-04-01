
-- Create project photos storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-photos') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('project-photos', 'Project Photos', true);
  
    -- Create RLS policy to allow public read access
    CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'project-photos');
      
    -- Create RLS policy to allow authenticated users to upload
    CREATE POLICY "Authenticated Users Upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'project-photos');
      
    -- Create RLS policy to allow users to delete their own uploads
    CREATE POLICY "Users Delete Own Uploads" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'project-photos' AND auth.uid()::text = owner);
  END IF;
END $$;

-- Add photos column to terrain table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'terrain' AND column_name = 'photos'
  ) THEN
    ALTER TABLE terrain ADD COLUMN photos TEXT;
  END IF;
END $$;

-- Add photos column to projet table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projet' AND column_name = 'photos'
  ) THEN
    ALTER TABLE projet ADD COLUMN photos TEXT;
  END IF;
END $$;
