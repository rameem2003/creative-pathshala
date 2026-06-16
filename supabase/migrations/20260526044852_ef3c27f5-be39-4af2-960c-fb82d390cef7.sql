
-- Add is_active to profiles for activate/deactivate admins
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Helper: can manage a given section
CREATE OR REPLACE FUNCTION public.can_manage_section(_user_id uuid, _section text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role = 'super_admin'
        OR (_section = 'content'    AND ur.role = 'content_manager')
        OR (_section = 'notice'     AND ur.role = 'routine_manager')
        OR (_section = 'blog'       AND ur.role = 'blog_manager')
        OR (_section = 'gallery'    AND ur.role = 'gallery_manager')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

-- ============ NOTICES (notice manager + super_admin) ============
DROP POLICY IF EXISTS notices_admin_insert ON public.notices;
DROP POLICY IF EXISTS notices_admin_update ON public.notices;
DROP POLICY IF EXISTS notices_admin_delete ON public.notices;
CREATE POLICY notices_section_insert ON public.notices FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'notice'));
CREATE POLICY notices_section_update ON public.notices FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'notice'));
CREATE POLICY notices_section_delete ON public.notices FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'notice'));

-- ============ ROUTINES (notice manager + super_admin) ============
DROP POLICY IF EXISTS routines_admin_insert ON public.routines;
DROP POLICY IF EXISTS routines_admin_update ON public.routines;
DROP POLICY IF EXISTS routines_admin_delete ON public.routines;
CREATE POLICY routines_section_insert ON public.routines FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'notice'));
CREATE POLICY routines_section_update ON public.routines FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'notice'));
CREATE POLICY routines_section_delete ON public.routines FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'notice'));

-- ============ BLOGS (blog manager + super_admin) ============
DROP POLICY IF EXISTS blogs_admin_insert ON public.blogs;
DROP POLICY IF EXISTS blogs_admin_update ON public.blogs;
DROP POLICY IF EXISTS blogs_admin_delete ON public.blogs;
CREATE POLICY blogs_section_insert ON public.blogs FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'blog'));
CREATE POLICY blogs_section_update ON public.blogs FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'blog'));
CREATE POLICY blogs_section_delete ON public.blogs FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'blog'));

-- ============ VIDEOS (blog manager + super_admin) ============
DROP POLICY IF EXISTS videos_admin_insert ON public.videos;
DROP POLICY IF EXISTS videos_admin_update ON public.videos;
DROP POLICY IF EXISTS videos_admin_delete ON public.videos;
CREATE POLICY videos_section_insert ON public.videos FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'blog'));
CREATE POLICY videos_section_update ON public.videos FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'blog'));
CREATE POLICY videos_section_delete ON public.videos FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'blog'));

-- ============ GALLERY (gallery manager + super_admin) ============
DROP POLICY IF EXISTS gallery_admin_insert ON public.gallery;
DROP POLICY IF EXISTS gallery_admin_update ON public.gallery;
DROP POLICY IF EXISTS gallery_admin_delete ON public.gallery;
CREATE POLICY gallery_section_insert ON public.gallery FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'gallery'));
CREATE POLICY gallery_section_update ON public.gallery FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'gallery'));
CREATE POLICY gallery_section_delete ON public.gallery FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'gallery'));

-- ============ SITE SETTINGS (content manager + super_admin) ============
DROP POLICY IF EXISTS settings_admin_insert ON public.site_settings;
DROP POLICY IF EXISTS settings_admin_update ON public.site_settings;
DROP POLICY IF EXISTS settings_admin_delete ON public.site_settings;
CREATE POLICY settings_section_insert ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.can_manage_section(auth.uid(), 'content'));
CREATE POLICY settings_section_update ON public.site_settings FOR UPDATE TO authenticated USING (public.can_manage_section(auth.uid(), 'content'));
CREATE POLICY settings_section_delete ON public.site_settings FOR DELETE TO authenticated USING (public.can_manage_section(auth.uid(), 'content'));

-- ============ ADMISSIONS & RESULTS (super_admin only writes; admins still read) ============
DROP POLICY IF EXISTS admissions_admin_update ON public.admissions;
DROP POLICY IF EXISTS admissions_admin_delete ON public.admissions;
CREATE POLICY admissions_super_update ON public.admissions FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY admissions_super_delete ON public.admissions FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS results_admin_insert ON public.results;
DROP POLICY IF EXISTS results_admin_update ON public.results;
DROP POLICY IF EXISTS results_admin_delete ON public.results;
CREATE POLICY results_super_insert ON public.results FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY results_super_update ON public.results FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY results_super_delete ON public.results FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ PROFILES (super_admin can view/update all) ============
CREATE POLICY profiles_super_admin_read ON public.profiles FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY profiles_super_admin_update ON public.profiles FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ USER_ROLES (super_admin manages) ============
CREATE POLICY user_roles_super_read ON public.user_roles FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY user_roles_super_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY user_roles_super_update ON public.user_roles FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY user_roles_super_delete ON public.user_roles FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
