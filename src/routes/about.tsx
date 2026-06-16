import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import {
  Target,
  Compass,
  ShieldCheck,
  Heart,
  GraduationCap,
  Headphones,
  Award,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, any> = {
  Target,
  Compass,
  ShieldCheck,
  Heart,
  GraduationCap,
  Headphones,
  Award,
  Users,
  Image: ImageIcon,
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — Canvas Pathsala" },
      { name: "description", content: "Canvas Pathsala এর পরিচিতি, লক্ষ্য ও উদ্দেশ্য।" },
    ],
  }),
  component: () => (
    <Layout>
      <About />
    </Layout>
  ),
});

function About() {
  const { data, loading } = useSiteSettings([
    "about_intro",
    "about_pillars",
    "about_quote",
    "about_teachers_header",
    "about_teachers",
    "about_gallery_header",
    "about_gallery",
  ]);

  const intro = data.about_intro ?? {};
  const pillars: any[] = data.about_pillars?.items ?? [];
  const quote = data.about_quote ?? {};
  const tHead = data.about_teachers_header ?? {};
  const teachers: any[] = data.about_teachers?.items ?? [];
  const gHead = data.about_gallery_header ?? {};

  return (
    <div className="container mx-auto px-4 py-16 lg:py-20">
      <header className="max-w-3xl mx-auto text-center mb-14">
        {intro.badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-3">
            {intro.badge}
          </div>
        )}
        <h1 className="text-4xl lg:text-5xl">{intro.title ?? "আমাদের সম্পর্কে"}</h1>
        {intro.description && <p className="mt-4 text-center text-[18px]">{intro.description}</p>}
        {intro.image_url && (
          <div className="mt-8 rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
            <img
              src={intro.image_url}
              alt={intro.title ?? "About"}
              className="w-full max-h-[420px] object-cover"
            />
          </div>
        )}
      </header>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {pillars.map((p, i) => {
          const Icon = ICON_MAP[p.icon] ?? Target;
          return (
            <article
              key={i}
              className="p-7 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] transition"
            >
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground mb-4 shadow-[var(--shadow-soft)]">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </article>
          );
        })}
      </div>

      {(quote.title || quote.description) && (
        <section className="mt-16 max-w-4xl mx-auto p-8 lg:p-10 rounded-3xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-card)]">
          {quote.title && <h2 className="text-2xl lg:text-3xl">{quote.title}</h2>}
          {quote.description && (
            <p className="mt-3 opacity-90 leading-relaxed whitespace-pre-line">
              {quote.description}
            </p>
          )}
        </section>
      )}

      <TeachersSection header={tHead} teachers={teachers} />
      <GallerySection header={gHead} />
      {loading && <div className="text-center text-xs text-muted-foreground mt-8">Loading…</div>}
    </div>
  );
}

function TeachersSection({ header, teachers }: { header: any; teachers: any[] }) {
  return (
    <section className="mt-20 max-w-6xl mx-auto">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-3">
          <Users className="w-4 h-4" /> {header.badge ?? "শিক্ষক মন্ডলী"}
        </div>
        <h2 className="text-3xl lg:text-4xl">{header.title ?? "আমাদের অভিজ্ঞ শিক্ষকবৃন্দ"}</h2>
        {header.description && <p className="mt-3 text-muted-foreground">{header.description}</p>}
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {teachers.map((t) => (
          <article
            key={t.name}
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition text-center"
          >
            {t.image_url ? (
              <img
                src={t.image_url}
                alt={t.name}
                className="mx-auto w-20 h-20 rounded-full object-cover mb-4 shadow-[var(--shadow-soft)]"
              />
            ) : (
              <div className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-[image:var(--gradient-hero)] text-primary-foreground text-2xl font-bold mb-4 shadow-[var(--shadow-soft)]">
                {t.name?.charAt(0)}
              </div>
            )}
            <h3 className="text-lg">{t.name}</h3>
            <p className="text-sm font-semibold text-primary mt-1">{t.role}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.subject}</p>
            <p className="text-xs text-muted-foreground mt-2">অভিজ্ঞতা: {t.exp}</p>
          </article>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: GraduationCap,
            title: "শিক্ষকদের পরিচিতি",
            desc: "দেশের স্বনামধন্য বিশ্ববিদ্যালয়ের গ্র্যাজুয়েট ও অভিজ্ঞ শিক্ষকবৃন্দ।",
          },
          {
            icon: Award,
            title: "শিক্ষাদানের মান",
            desc: "আধুনিক পদ্ধতি ও সৃজনশীল উপস্থাপনায় পাঠদান।",
          },
          {
            icon: Headphones,
            title: "শিক্ষার্থী সাপোর্ট",
            desc: "প্রতিটি শিক্ষার্থীর সমস্যার সমাধানে নিয়মিত সাপোর্ট সিস্টেম।",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <article key={title} className="p-6 rounded-2xl border border-border bg-card">
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-accent text-primary mb-4">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

type GalleryItem = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  category: string | null;
};

const GALLERY_CATEGORIES = [
  "Classroom Activities",
  "Prize Giving Ceremony",
  "Student Events",
  "Educational Programs",
  "Campus Photos",
];

function GallerySection({ header }: { header: any }) {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("gallery")
        .select("id,title,caption,image_url,category")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setItems((data as GalleryItem[]) ?? []);
    };
    load();
    const ch = supabase
      .channel("gallery_about_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const categoriesPresent = Array.from(new Set(items.map((i) => i.category || "Other")));
  const ordered = [
    ...GALLERY_CATEGORIES.filter((c) => categoriesPresent.includes(c)),
    ...categoriesPresent.filter((c) => !GALLERY_CATEGORIES.includes(c)),
  ];

  return (
    <section className="mt-20 max-w-6xl mx-auto">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-3">
          <ImageIcon className="w-4 h-4" /> {header.badge ?? "📸 গ্যালারি"}
        </div>
        <h2 className="text-3xl lg:text-4xl">{header.title ?? "আমাদের পাঠশালার মুহূর্তসমূহ"}</h2>
        {header.description && <p className="mt-3 text-muted-foreground">{header.description}</p>}
      </header>

      {ordered.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gradient-to-br from-accent to-muted border border-border grid place-items-center"
            >
              <ImageIcon className="w-10 h-10 text-primary/40" />
            </div>
          ))}
        </div>
      ) : (
        ordered.map((cat) => {
          const imgs = items.filter((i) => (i.category || "Other") === cat);
          if (imgs.length === 0) return null;
          return (
            <div key={cat} className="mb-10">
              <h3 className="text-xl mb-4">{cat}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imgs.map((it) => (
                  <a
                    key={it.id}
                    href={it.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-2xl bg-muted border border-border overflow-hidden block hover:shadow-[var(--shadow-card)] hover:-translate-y-1 hover:scale-[1.02] transition group relative"
                  >
                    <img
                      src={it.image_url}
                      alt={it.title ?? cat}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {(it.title || it.caption) && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition">
                        {it.title || it.caption}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
