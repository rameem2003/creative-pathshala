
-- Update is_admin() to include gallery_manager for image uploads
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','content_manager','blog_manager','routine_manager','gallery_manager')
  )
$$;

-- Drop existing media policies to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "media_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "media_public_select" ON storage.objects;

-- Allow public to view/download media files
CREATE POLICY "media_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow authenticated admin users to list/view media files
CREATE POLICY "media_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'media' AND is_admin(auth.uid()));

-- Allow authenticated admin users to upload media files
CREATE POLICY "media_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND is_admin(auth.uid()));

-- Allow authenticated admin users to update/replace media files
CREATE POLICY "media_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND is_admin(auth.uid()));

-- Allow authenticated admin users to delete media files
CREATE POLICY "media_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND is_admin(auth.uid()));
