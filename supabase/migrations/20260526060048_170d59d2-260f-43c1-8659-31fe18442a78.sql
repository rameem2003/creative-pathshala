
-- Update can_manage_section to support distinct routine + video sections
CREATE OR REPLACE FUNCTION public.can_manage_section(_user_id uuid, _section text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role = 'super_admin'
        OR (_section = 'content' AND ur.role = 'content_manager')
        OR (_section = 'notice'  AND ur.role = 'routine_manager')
        OR (_section = 'routine' AND ur.role = 'routine_manager')
        OR (_section = 'blog'    AND ur.role = 'blog_manager')
        OR (_section = 'video'   AND ur.role = 'blog_manager')
        OR (_section = 'gallery' AND ur.role = 'gallery_manager')
      )
  )
$$;

-- Re-scope routines policies to 'routine'
DROP POLICY IF EXISTS routines_section_insert ON public.routines;
DROP POLICY IF EXISTS routines_section_update ON public.routines;
DROP POLICY IF EXISTS routines_section_delete ON public.routines;
CREATE POLICY routines_section_insert ON public.routines FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'routine'));
CREATE POLICY routines_section_update ON public.routines FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'routine'));
CREATE POLICY routines_section_delete ON public.routines FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'routine'));

-- Re-scope videos policies to 'video'
DROP POLICY IF EXISTS videos_section_insert ON public.videos;
DROP POLICY IF EXISTS videos_section_update ON public.videos;
DROP POLICY IF EXISTS videos_section_delete ON public.videos;
CREATE POLICY videos_section_insert ON public.videos FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'video'));
CREATE POLICY videos_section_update ON public.videos FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'video'));
CREATE POLICY videos_section_delete ON public.videos FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'video'));

-- Split admissions insert into anon-only and authenticated-with-link policies
DROP POLICY IF EXISTS "admissions_public_insert" ON public.admissions;

CREATE POLICY "admissions_anon_insert" ON public.admissions
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND length(trim(student_name)) BETWEEN 2 AND 100
    AND length(trim(parent_name)) BETWEEN 2 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(class_applying)) BETWEEN 1 AND 50
    AND status = 'pending'
    AND admin_notes IS NULL
  );

CREATE POLICY "admissions_authenticated_insert" ON public.admissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND length(trim(student_name)) BETWEEN 2 AND 100
    AND length(trim(parent_name)) BETWEEN 2 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(class_applying)) BETWEEN 1 AND 50
    AND status = 'pending'
    AND admin_notes IS NULL
  );

-- Revoke direct EXECUTE on SECURITY DEFINER helpers; RLS still uses them internally
REVOKE EXECUTE ON FUNCTION public.can_manage_section(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
