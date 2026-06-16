
INSERT INTO public.site_settings (key, value) VALUES
('about_intro', '{"badge":"আমাদের সম্পর্কে","title":"আমাদের সম্পর্কে","description":"Canvas Pathshala একটি আধুনিক ও বিশ্বস্ত একাডেমিক কোচিং প্রতিষ্ঠান, যেখানে Play Group থেকে Class 8 পর্যন্ত শিক্ষার্থীদের সুন্দর ভবিষ্যৎ গড়ে তোলার লক্ষ্যে কাজ করা হয়।","image_url":""}'::jsonb),
('about_pillars', '{"items":[
  {"icon":"Target","title":"আমাদের লক্ষ্য","desc":"প্রতিটি শিক্ষার্থীর মেধা বিকাশে সহায়তা করে দেশের যোগ্য নাগরিক হিসেবে গড়ে তোলা।"},
  {"icon":"Compass","title":"আমাদের উদ্দেশ্য","desc":"আধুনিক, পরিকল্পিত ও আনন্দময় পাঠদানের মাধ্যমে শিক্ষাকে সহজ ও কার্যকর করা।"},
  {"icon":"ShieldCheck","title":"কেন আমাদের নির্বাচন করবেন","desc":"অভিজ্ঞ শিক্ষক, সাপ্তাহিক মূল্যায়ন, নিয়মিত অভিভাবক ফলোআপ ও নিরাপদ পরিবেশ।"},
  {"icon":"Heart","title":"আমাদের অঙ্গীকার","desc":"প্রতিটি শিক্ষার্থীর প্রতি ব্যক্তিগত যত্ন ও সর্বোচ্চ মানের শিক্ষা নিশ্চিত করা।"}
]}'::jsonb),
('about_quote', '{"title":"\"স্মার্ট শিক্ষাই সুন্দর ভবিষ্যৎ\"","description":"আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যেই অসাধারণ সম্ভাবনা লুকিয়ে আছে। সঠিক দিকনির্দেশনা ও মানসম্মত শিক্ষার মাধ্যমে সেই সম্ভাবনাকে বাস্তবে রূপ দিতে Canvas Pathshala সর্বদা প্রতিশ্রুতিবদ্ধ।"}'::jsonb),
('about_teachers_header', '{"badge":"শিক্ষক মন্ডলী","title":"আমাদের অভিজ্ঞ শিক্ষকবৃন্দ","description":"দক্ষ ও অভিজ্ঞ শিক্ষকদের নেতৃত্বে মানসম্মত পাঠদান।"}'::jsonb),
('about_teachers', '{"items":[
  {"name":"মোঃ রফিকুল ইসলাম","role":"প্রধান শিক্ষক","subject":"গণিত ও বিজ্ঞান","exp":"১৫+ বছর","image_url":""},
  {"name":"ফারজানা আক্তার","role":"সিনিয়র শিক্ষক","subject":"ইংরেজি","exp":"১০+ বছর","image_url":""},
  {"name":"আব্দুল্লাহ আল মামুন","role":"শিক্ষক","subject":"বাংলা ও সমাজ","exp":"৮+ বছর","image_url":""},
  {"name":"নুসরাত জাহান","role":"শিক্ষক","subject":"প্রাথমিক স্তর","exp":"৬+ বছর","image_url":""},
  {"name":"মোঃ সাইফুল ইসলাম","role":"শিক্ষক","subject":"ICT","exp":"৭+ বছর","image_url":""},
  {"name":"সুমাইয়া রহমান","role":"শিক্ষক","subject":"Play – KG","exp":"৫+ বছর","image_url":""}
]}'::jsonb),
('about_gallery_header', '{"badge":"গ্যালারি","title":"আমাদের পাঠশালার মুহূর্তসমূহ","description":"Classroom Activities, Prize Giving, Student Events ও Educational Program।"}'::jsonb),
('about_gallery', '{"categories":[
  {"title":"শ্রেণিকক্ষ কার্যক্রম","images":[]},
  {"title":"পুরস্কার বিতরণ অনুষ্ঠান","images":[]},
  {"title":"শিক্ষার্থীদের বিভিন্ন কার্যক্রম","images":[]},
  {"title":"শিক্ষামূলক প্রোগ্রাম","images":[]}
]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
