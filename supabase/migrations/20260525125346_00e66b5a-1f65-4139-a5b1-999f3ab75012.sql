
-- Storage bucket for site media (hero images, banners, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Admin write
CREATE POLICY "media_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "media_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

-- Seed default home content into site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('home_hero', '{"badge":"বিশ্বস্ত একাডেমিক কোচিং","title_1":"Canvas","title_2":"Pathshala","tagline":"\"শিক্ষা হোক সহজ, আনন্দময় ও লক্ষ্যভিত্তিক।\"","description":"Play Group থেকে Class 8, SSC, HSC এবং Diploma পর্যন্ত শিক্ষার্থীদের জন্য একটি আধুনিক ও বিশ্বস্ত একাডেমিক কোচিং প্রতিষ্ঠান।","description_2":"অভিজ্ঞ শিক্ষক, সাপ্তাহিক পরীক্ষা এবং মানসম্মত শিক্ষা ব্যবস্থার মাধ্যমে শিক্ষার্থীদের সুন্দর ভবিষ্যৎ গড়ে তোলা আমাদের লক্ষ্য।","image_url":"","cta_primary_text":"ভর্তি হোন","cta_primary_link":"/admission","cta_secondary_text":"যোগাযোগ করুন","cta_secondary_link":"/contact","admission_banner":"🎓 ভর্তি চলছে! Play Group থেকে Class 8 | SSC | HSC | Diploma — সীমিত আসন।"}'::jsonb),
  ('home_stats', '{"items":[{"value":"৯+","label":"ক্লাস ও কোর্স"},{"value":"১৫+","label":"অভিজ্ঞ শিক্ষক"},{"value":"৫০০+","label":"সফল শিক্ষার্থী"},{"value":"১০০%","label":"অভিভাবক সন্তুষ্টি"}]}'::jsonb),
  ('home_features', '{"heading":"আমাদের বৈশিষ্ট্য","subheading":"যে কারণে অভিভাবকরা ক্যানভাস পাঠশালার ওপর আস্থা রাখেন","items":[{"title":"অভিজ্ঞ শিক্ষক","desc":"প্রতিটি বিষয়ে দক্ষ ও যোগ্য শিক্ষক মণ্ডলী।"},{"title":"সাপ্তাহিক পরীক্ষা","desc":"প্রতি সপ্তাহে পড়া যাচাই করার ব্যবস্থা।"},{"title":"অভিভাবক ফলোআপ","desc":"নিয়মিত অভিভাবকদের সাথে যোগাযোগ ও আপডেট।"},{"title":"মানসম্মত শিক্ষা","desc":"আধুনিক ও পরিকল্পিত পাঠদান পদ্ধতি।"}]}'::jsonb),
  ('home_cta', '{"heading":"আজই আপনার সন্তানের ভর্তি নিশ্চিত করুন","description":"সীমিত আসনে দ্রুত যোগাযোগ করুন। আমাদের শিক্ষকরা আপনার সন্তানের সঠিক পাঠপরিকল্পনায় সাহায্য করবেন।","primary_text":"ভর্তি হোন","primary_link":"/admission","secondary_text":"যোগাযোগ করুন","secondary_link":"/contact"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable realtime for site_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
