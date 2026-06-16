ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
ALTER TABLE public.gallery REPLICA IDENTITY FULL;