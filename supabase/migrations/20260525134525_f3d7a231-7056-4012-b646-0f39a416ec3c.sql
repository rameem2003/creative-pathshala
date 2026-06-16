ALTER TABLE public.videos REPLICA IDENTITY FULL;
ALTER TABLE public.blogs REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.videos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;