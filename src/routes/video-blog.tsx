import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, BookOpen, ArrowRight, Video, Newspaper, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/video-blog")({
  head: () => ({
    meta: [
      { title: "ভিডিও ও ব্লগ — Canvas Pathsala" },
      { name: "description", content: "Class ভিত্তিক Video Tutorial এবং শিক্ষা ও IT সম্পর্কিত Blog Post।" },
    ],
  }),
  component: () => (<Layout><VideoBlog /></Layout>),
});

type Vid = { id: string; title: string; description: string | null; youtube_url: string; thumbnail_url: string | null; class_level: string; subject: string };
type Blog = { id: string; title: string; slug: string; excerpt: string | null; content?: string | null; thumbnail_url: string | null; category: string | null; published_at: string | null };

const ytThumb = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
};
const ytId = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

function VideoBlog() {
  const [videos, setVideos] = useState<Vid[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [blogCat, setBlogCat] = useState<string>("all");
  const [playing, setPlaying] = useState<Vid | null>(null);
  const [readingBlog, setReadingBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const load = async () => {
      const [v, b] = await Promise.all([
        supabase.from("videos").select("*").eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("blogs").select("id,title,slug,excerpt,content,thumbnail_url,category,published_at").eq("is_published", true).order("published_at", { ascending: false }),
      ]);
      setVideos((v.data as Vid[]) ?? []);
      setBlogs((b.data as Blog[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("video_blog_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "blogs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setPlaying(null); setReadingBlog(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const classes = Array.from(new Set(videos.map((v) => v.class_level)));
  const filtered = classFilter === "all" ? videos : videos.filter((v) => v.class_level === classFilter);
  const blogCategories = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean) as string[]));
  const filteredBlogs = blogCat === "all" ? blogs : blogs.filter((b) => b.category === blogCat);

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl">ভিডিও ও ব্লগ</h1>
        <p className="mt-4 text-muted-foreground text-lg">Class ভিত্তিক Video Tutorial এবং শিক্ষা ও IT সংক্রান্ত Blog।</p>
      </header>

      <section className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground"><Video className="w-5 h-5" /></div>
          <div>
            <h2 className="text-2xl">Video Tutorial</h2>
            <p className="text-sm text-muted-foreground">শ্রেণি ও বিষয় অনুযায়ী ভিডিও।</p>
          </div>
        </div>

        {classes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Chip active={classFilter === "all"} onClick={() => setClassFilter("all")}>সব</Chip>
            {classes.map((c) => <Chip key={c} active={classFilter === c} onClick={() => setClassFilter(c)}>{c}</Chip>)}
          </div>
        )}

        {loading ? <Spinner /> : filtered.length === 0 ? <Empty>এখনো কোনো ভিডিও যোগ করা হয়নি।</Empty> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => {
              const thumb = v.thumbnail_url || ytThumb(v.youtube_url);
              return (
                <article key={v.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition group">
                  <button onClick={() => setPlaying(v)} className="block w-full text-left aspect-video bg-muted relative overflow-hidden">
                    {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center"><PlayCircle className="w-16 h-16 text-primary/60" /></div>}
                    <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                      <PlayCircle className="w-16 h-16 text-white" />
                    </div>
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-background/90 text-primary backdrop-blur-sm">{v.subject}</span>
                  </button>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">{v.class_level}</p>
                    <h3 className="font-bold text-foreground leading-snug mb-2 line-clamp-2">{v.title}</h3>
                    {v.description && <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground"><Newspaper className="w-5 h-5" /></div>
          <div>
            <h2 className="text-2xl">Blog – Educational ও IT সম্পর্কিত পোস্ট</h2>
            <p className="text-sm text-muted-foreground">শিক্ষা, পরীক্ষা, IT, Career ও Freelancing সংক্রান্ত পোস্ট।</p>
          </div>
        </div>
        {blogCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Chip active={blogCat === "all"} onClick={() => setBlogCat("all")}>সব</Chip>
            {blogCategories.map((c) => <Chip key={c} active={blogCat === c} onClick={() => setBlogCat(c)}>{c}</Chip>)}
          </div>
        )}
        {loading ? <Spinner /> : filteredBlogs.length === 0 ? <Empty>এখনো কোনো ব্লগ পোস্ট করা হয়নি।</Empty> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((b) => (
              <article key={b.id} onClick={() => setReadingBlog(b)} className="cursor-pointer rounded-2xl border border-border bg-card overflow-hidden hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition group">
                <div className="aspect-[16/10] bg-gradient-to-br from-accent via-muted to-primary/20 grid place-items-center overflow-hidden">
                  {b.thumbnail_url ? <img src={b.thumbnail_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <BookOpen className="w-14 h-14 text-primary/60" />}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {b.category && <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-accent text-primary">{b.category}</span>}
                    {b.published_at && <span className="text-[11px] text-muted-foreground">{new Date(b.published_at).toLocaleDateString("bn-BD")}</span>}
                  </div>
                  <h3 className="font-bold text-foreground leading-snug mb-2 line-clamp-2">{b.title}</h3>
                  {b.excerpt && <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{b.excerpt}</p>}
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Read More <ArrowRight className="w-4 h-4" /></span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {playing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in" onClick={() => setPlaying(null)}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlaying(null)} className="absolute -top-12 right-0 text-white/90 hover:text-white inline-flex items-center gap-1 text-sm"><X className="w-5 h-5" /> Close</button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
              {ytId(playing.youtube_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId(playing.youtube_url)}?autoplay=1&rel=0`}
                  title={playing.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white">Invalid YouTube URL</div>
              )}
            </div>
            <div className="mt-3 text-white">
              <h3 className="font-bold text-lg">{playing.title}</h3>
              <p className="text-sm text-white/70">{playing.class_level} • {playing.subject}</p>
            </div>
          </div>
        </div>
      )}

      {readingBlog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-start md:place-items-center p-4 overflow-y-auto animate-in fade-in" onClick={() => setReadingBlog(null)}>
          <article className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReadingBlog(null)} className="absolute top-3 right-3 z-10 grid place-items-center w-9 h-9 rounded-full bg-background/90 hover:bg-background border border-border"><X className="w-4 h-4" /></button>
            {readingBlog.thumbnail_url && <img src={readingBlog.thumbnail_url} alt={readingBlog.title} className="w-full h-64 object-cover" />}
            <div className="p-6 md:p-8">
              {readingBlog.category && <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-accent text-primary mb-3">{readingBlog.category}</span>}
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{readingBlog.title}</h1>
              {readingBlog.published_at && <p className="text-xs text-muted-foreground mb-6">{new Date(readingBlog.published_at).toLocaleDateString("bn-BD")}</p>}
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">{readingBlog.content || readingBlog.excerpt}</div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "bg-card border border-border hover:border-primary/50"}`}>{children}</button>
  );
}
function Spinner() { return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>; }
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{children}</div>;
}