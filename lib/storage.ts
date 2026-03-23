/**
 * Storage utility for Supabase Image Transformation
 */

/**
 * Gets a transformed/resized image URL from Supabase Storage
 * @param url Original public URL of the image
 * @param options Transformation options (width, height, quality, format)
 * @returns Transformed URL
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: { 
    width?: number; 
    height?: number; 
    quality?: number; 
    format?: 'origin' | 'webp' | 'png';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  if (!url) return '';
  
  // If not a Supabase storage URL, return as is
  if (!url.includes('/storage/v1/object/public/')) return url;

  const { width, height, quality = 80, format = 'webp', resize = 'cover' } = options;
  
  // Convert object URL to render URL
  // Example: https://project.supabase.co/storage/v1/object/public/bucket/path
  // To: https://project.supabase.co/storage/v1/render/image/public/bucket/path
  const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  params.append('resize', resize);
  
  return `${renderUrl}?${params.toString()}`;
}
