-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing images
CREATE POLICY "listing_images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "listing_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images');
