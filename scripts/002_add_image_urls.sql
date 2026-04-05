-- Migration: Add image_urls column to listings table
-- Date: 2026-04-05

-- 1. Add the image_urls column as an array of text
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 2. Migrate existing single image_url data into the array
UPDATE public.listings 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

-- 3. Ensure the column is never null (empty array default)
ALTER TABLE public.listings 
ALTER COLUMN image_urls SET DEFAULT '{}';
