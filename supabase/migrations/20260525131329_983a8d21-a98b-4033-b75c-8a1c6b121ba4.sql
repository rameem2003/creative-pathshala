
INSERT INTO public.site_settings (key, value) VALUES
('courses_header', '{"badge":"আমাদের কোর্সসমূহ","title":"আমাদের কোর্সসমূহ","description":"Play Group থেকে Class 8 পর্যন্ত প্রতিটি স্তরের জন্য সাজানো বিশেষ কোর্স।"}'::jsonb),
('courses_features', '{"items":[{"icon":"FileText","label":"Weekly Sheet System"},{"icon":"ClipboardList","label":"Model Test"},{"icon":"CheckCircle2","label":"Homework Monitoring"},{"icon":"BookOpenCheck","label":"নিয়মিত মূল্যায়ন"}]}'::jsonb),
('courses_items', '{"items":[
  {"id":"playkg","title":"Play – KG","grade":"প্রাথমিক স্তর","description":"ছোটদের জন্য মজাদার ও গুণগত শিক্ষা।","subjects":["বাংলা","English","Math","ছড়া ও গল্প","Drawing"],"image_url":"","is_published":true,"sort_order":1},
  {"id":"class1to5","title":"Class 1 – 5","grade":"প্রাইমারি স্তর","description":"প্রাইমারি লেভেলে শক্ত ভিত্তি গঠনের জন্য সাজানো কোর্স।","subjects":["বাংলা","English","Math","বিজ্ঞান","সমাজ","ধর্ম"],"image_url":"","is_published":true,"sort_order":2},
  {"id":"class6to8","title":"Class 6 – 8","grade":"জুনিয়র সেকেন্ডারি","description":"জুনিয়র সেকেন্ডারি স্তরের পূর্ণাঙ্গ একাডেমিক প্রস্তুতি।","subjects":["বাংলা","English","Math","বিজ্ঞান","ICT","সমাজ","ধর্ম"],"image_url":"","is_published":true,"sort_order":3}
]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
