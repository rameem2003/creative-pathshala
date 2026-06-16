
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','content_manager','blog_manager','routine_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''));
  IF new.email = 'creativecanvasit@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'user');
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'creativecanvasit@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- NOTICES
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  file_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_public_read" ON public.notices FOR SELECT USING (is_published = true);
CREATE POLICY "notices_admin_read" ON public.notices FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "notices_admin_insert" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "notices_admin_update" ON public.notices FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "notices_admin_delete" ON public.notices FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_notices_updated BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOGS
CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  thumbnail_url text,
  category text DEFAULT 'general',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blogs_public_read" ON public.blogs FOR SELECT USING (is_published = true);
CREATE POLICY "blogs_admin_read" ON public.blogs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "blogs_admin_insert" ON public.blogs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "blogs_admin_update" ON public.blogs FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "blogs_admin_delete" ON public.blogs FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_blogs_updated BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VIDEOS
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  thumbnail_url text,
  class_level text NOT NULL,
  subject text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read" ON public.videos FOR SELECT USING (is_published = true);
CREATE POLICY "videos_admin_read" ON public.videos FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "videos_admin_insert" ON public.videos FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "videos_admin_update" ON public.videos FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "videos_admin_delete" ON public.videos FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_videos_updated BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GALLERY
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  caption text,
  category text DEFAULT 'general',
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_public_read" ON public.gallery FOR SELECT USING (is_published = true);
CREATE POLICY "gallery_admin_read" ON public.gallery FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "gallery_admin_insert" ON public.gallery FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "gallery_admin_update" ON public.gallery FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "gallery_admin_delete" ON public.gallery FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_gallery_updated BEFORE UPDATE ON public.gallery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ADMISSIONS
CREATE TYPE public.admission_status AS ENUM ('pending','approved','rejected','contacted');

CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  parent_name text NOT NULL,
  phone text NOT NULL,
  email text,
  class_applying text NOT NULL,
  address text,
  notes text,
  status public.admission_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admissions_public_insert" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "admissions_user_read_own" ON public.admissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admissions_admin_read" ON public.admissions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admissions_admin_update" ON public.admissions FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admissions_admin_delete" ON public.admissions FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_admissions_updated BEFORE UPDATE ON public.admissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROUTINES
CREATE TABLE public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  class_level text NOT NULL,
  shift text NOT NULL DEFAULT 'সকাল',
  schedule_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routines_public_read" ON public.routines FOR SELECT USING (is_active = true);
CREATE POLICY "routines_admin_read" ON public.routines FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "routines_admin_insert" ON public.routines FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "routines_admin_update" ON public.routines FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "routines_admin_delete" ON public.routines FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tr_routines_updated BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "settings_admin_update" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "settings_admin_delete" ON public.site_settings FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- INDEXES
CREATE INDEX idx_notices_published ON public.notices(is_published, published_at DESC);
CREATE INDEX idx_blogs_published ON public.blogs(is_published, published_at DESC);
CREATE INDEX idx_videos_class_subject ON public.videos(class_level, subject) WHERE is_published = true;
CREATE INDEX idx_admissions_status ON public.admissions(status, created_at DESC);
CREATE INDEX idx_routines_class_shift ON public.routines(class_level, shift) WHERE is_active = true;
