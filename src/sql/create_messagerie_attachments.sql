
-- Create storage bucket for message attachments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'message-attachments') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('message-attachments', 'Message Attachments', true);
  
    -- Create RLS policy to allow public read access
    CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'message-attachments');
      
    -- Create RLS policy to allow authenticated users to upload
    CREATE POLICY "Authenticated Users Upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'message-attachments');
      
    -- Create RLS policy to allow users to update their own uploads
    CREATE POLICY "Users Update Own Uploads" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'message-attachments' AND auth.uid()::text = owner);
      
    -- Create RLS policy to allow users to delete their own uploads
    CREATE POLICY "Users Delete Own Uploads" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'message-attachments' AND auth.uid()::text = owner);
  END IF;
END $$;

-- Add pieces_jointes column to message table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'message' AND column_name = 'pieces_jointes'
  ) THEN
    ALTER TABLE message ADD COLUMN pieces_jointes TEXT[];
  END IF;
END $$;
