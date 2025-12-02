-- Create branding storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true);

-- Allow authenticated users to upload branding files
CREATE POLICY "Admin users can upload branding files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow authenticated users to update branding files
CREATE POLICY "Admin users can update branding files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow everyone to view branding files (public bucket)
CREATE POLICY "Anyone can view branding files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'branding');