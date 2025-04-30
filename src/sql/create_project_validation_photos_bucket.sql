
-- Create storage bucket for project validation photos if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'projet-photos') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('projet-photos', 'Photos des projets', true);
  
    -- Create RLS policy to allow public read access
    CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'projet-photos');
      
    -- Create RLS policy to allow authenticated users to upload
    CREATE POLICY "Authenticated Users Upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'projet-photos');
      
    -- Create RLS policy to allow users to update their own uploads
    CREATE POLICY "Users Update Own Uploads" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'projet-photos' AND auth.uid()::text = owner);
      
    -- Create RLS policy to allow users to delete their own uploads
    CREATE POLICY "Users Delete Own Uploads" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'projet-photos' AND auth.uid()::text = owner);
  END IF;
END $$;

-- Add validation related columns to projet table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projet' AND column_name = 'date_validation'
  ) THEN
    ALTER TABLE projet ADD COLUMN date_validation DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projet' AND column_name = 'rapport_validation'
  ) THEN
    ALTER TABLE projet ADD COLUMN rapport_validation TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projet' AND column_name = 'photos_validation'
  ) THEN
    ALTER TABLE projet ADD COLUMN photos_validation TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projet' AND column_name = 'id_validateur'
  ) THEN
    ALTER TABLE projet ADD COLUMN id_validateur UUID REFERENCES auth.users(id);
  END IF;
END $$;


-- Create storage bucket for project validation photos if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'projet-contracts') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('projet-contracts', 'Contrats agriculteur', true);
  
    -- Create RLS policy to allow public read access
    CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'projet-contracts');
      
    -- Create RLS policy to allow authenticated users to upload
    CREATE POLICY "Authenticated Users Upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'projet-contracts');
      
    -- Create RLS policy to allow users to update their own uploads
    CREATE POLICY "Users Update Own Uploads" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'projet-contracts' AND auth.uid()::text = owner);
      
    -- Create RLS policy to allow users to delete their own uploads
    CREATE POLICY "Users Delete Own Uploads" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'projet-contracts' AND auth.uid()::text = owner);
  END IF;
END $$;