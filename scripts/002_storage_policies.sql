-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Dubilook', 'Dubilook', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to objects in the Dubilook bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'Dubilook' );

-- Policy to allow authenticated users to upload objects to the Dubilook bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Dubilook' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to update/delete their own objects (optional but good practice)
CREATE POLICY "User Update Own Objects"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'Dubilook' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "User Delete Own Objects"
ON storage.objects FOR DELETE
USING ( bucket_id = 'Dubilook' AND auth.uid()::text = (storage.foldername(name))[1] );
