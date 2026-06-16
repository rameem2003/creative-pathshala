
-- Add PDF URL to routines
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS pdf_url text;

-- Results table
CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  class_level text NOT NULL,
  exam_name text,
  exam_date date,
  description text,
  pdf_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_public_read" ON public.results FOR SELECT USING (is_published = true);
CREATE POLICY "results_admin_read" ON public.results FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "results_admin_insert" ON public.results FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "results_admin_update" ON public.results FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "results_admin_delete" ON public.results FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER tr_results_updated BEFORE UPDATE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_results_class_published ON public.results (class_level, published_at DESC) WHERE is_published = true;

-- Realtime
ALTER TABLE public.notices REPLICA IDENTITY FULL;
ALTER TABLE public.routines REPLICA IDENTITY FULL;
ALTER TABLE public.results REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.routines; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.results; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
