import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import heroImg from "@/assets/hero-academic.png";
import {
  Sparkles,
  ArrowRight,
  Phone,
  GraduationCap,
  Star,
  MapPin,
  Calendar,
  Target,
  BookOpenCheck,
  Info,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canvas Pathsala — হোম" },
      {
        name: "description",
        content:
          "Play Group থেকে Class 8 পর্যন্ত বিশ্বস্ত একাডেমিক কোচিং প্রতিষ্ঠান। স্মার্ট শিক্ষাই সুন্দর ভবিষ্যৎ।",
      },
      { property: "og:title", content: "Canvas Pathsala" },
      { property: "og:description", content: "স্মার্ট শিক্ষাই সুন্দর ভবিষ্যৎ" },
    ],
  }),
  component: () => (
    <Layout>
      <Home />
    </Layout>
  ),
});

function Home() {
  const { data } = useSiteSettings([
    "home_hero",
    "home_stats",
    "home_features",
    "home_cta",
    "about_intro",
  ]);
  const hero = data.home_hero ?? {};
  const stats = (data.home_stats?.items ?? []) as { value: string; label: string }[];
  const features = data.home_features ?? { heading: "আমাদের বৈশিষ্ট্য", subheading: "", items: [] };
  const cta = data.home_cta ?? {};
  const aboutIntro = data.about_intro ?? {};
  const heroImage = hero.image_url || heroImg;

  return (
    <>
      {/* Admission Open Banner */}
      <div className="bg-[image:var(--gradient-warm)] text-primary-foreground text-center text-sm py-2.5 px-4 font-semibold">
        {hero.admission_banner ??
          "🎓 ভর্তি চলছে! Play Group থেকে Class 8 | SSC | HSC | Diploma — সীমিত আসন।"}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.03]" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        <div className="container mx-auto px-4 pt-10 pb-12 lg:pt-14 lg:pb-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
          {/* Left Side - Text Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent border border-border text-sm font-medium text-accent-foreground">
              <Sparkles className="w-4 h-4 text-primary" />{" "}
              {hero.badge ?? "বিশ্বস্ত একাডেমিক কোচিং"}
            </div>

            {/* Main Title */}
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[3.2rem] leading-[1.12] font-extrabold tracking-tight">
              <span className="text-foreground">{hero.title_1 ?? "Canvas"}</span>{" "}
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                {hero.title_2 ?? "Pathsala"}
              </span>
            </h1>

            {/* Subtitle / Tagline */}
            <p className="mt-3 text-xl lg:text-[1.35rem] text-primary font-semibold italic tracking-wide leading-snug">
              {hero.tagline ?? '"শিক্ষা হোক সহজ, আনন্দময় ও লক্ষ্যভিত্তিক।"'}
            </p>

            {/* Description */}
            {hero.description && (
              <p className="mt-5 text-base lg:text-[1.05rem] text-muted-foreground leading-[1.85]">
                {hero.description}
              </p>
            )}
            {hero.description_2 && (
              <p className="mt-3 text-base lg:text-[1.05rem] text-muted-foreground leading-[1.85]">
                {hero.description_2}
              </p>
            )}

            {/* Quick Info Chips */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>West Nakhalpara, Tejgaon, Dhaka 1215</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                Play Group – Class 8 | SSC | HSC | Diploma
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-primary shrink-0" />
                ৫০০+ সফল শিক্ষার্থী
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={(hero.cta_primary_link ?? "/admission") as never}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[var(--shadow-soft)] hover:opacity-90 active:scale-[0.98] transition"
              >
                {hero.cta_primary_text ?? "ভর্তি হোন"} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={(hero.cta_secondary_link ?? "/contact") as never}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-border bg-card text-sm font-semibold hover:bg-muted hover:border-primary/30 active:scale-[0.98] transition"
              >
                <Phone className="w-4 h-4 text-primary" />{" "}
                {hero.cta_secondary_text ?? "যোগাযোগ করুন"}
              </Link>
            </div>
          </div>

          {/* Right Side - Large Image */}
          <div className="order-1 lg:order-2 relative w-full">
            <div className="relative w-full">
              {/* Background Glow */}
              <div className="absolute -inset-3 lg:-inset-5 bg-[image:var(--gradient-hero)] opacity-10 blur-[50px] rounded-[2.5rem] pointer-events-none" />

              {/* Main Image */}
              <img
                src={heroImage}
                alt="Canvas Pathsala — আধুনিক শ্রেণিকক্ষ ও শিক্ষার্থীরা"
                width={1200}
                height={675}
                className="relative rounded-[2rem] shadow-[var(--shadow-card)] w-full h-auto object-cover aspect-[16/10]"
              />

              {/* Floating Badge — Top Left */}
              <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-3 py-2 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">ভর্তি চলছে</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">সীমিত আসন!</p>
                  </div>
                </div>
              </div>

              {/* Bottom Right Floating Stats */}
              <div className="absolute bottom-4 right-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-tight">১৫+</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">অভিজ্ঞ শিক্ষক</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {aboutIntro.image_url && (
            <div className="lg:col-span-2 order-1 lg:order-1">
              <div className="rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
                <img
                  src={aboutIntro.image_url}
                  alt={aboutIntro.title ?? "আমাদের সম্পর্কে"}
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          )}
          <div
            className={`order-2 lg:order-2 ${aboutIntro.image_url ? "lg:col-span-3" : "lg:col-span-5 text-center max-w-3xl mx-auto"}`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-3">
              <Info className="w-3.5 h-3.5" /> {aboutIntro.badge ?? "আমাদের সম্পর্কে"}
            </div>
            <h2 className="text-3xl lg:text-4xl">{aboutIntro.title ?? "আমাদের সম্পর্কে"}</h2>
            <p className="mt-10 text-muted-foreground leading-[1.9] whitespace-pre-line line-clamp-[8]">
              {aboutIntro.description ??
                "Canvas Pathsala একটি আধুনিক ও বিশ্বস্ত একাডেমিক কোচিং প্রতিষ্ঠান,যেখানে Play Group থেকে SSC, HSC ও Diploma পর্যন্ত শিক্ষার্থীদের মানসম্মত শিক্ষা প্রদান করা হয়। অভিজ্ঞ শিক্ষক, নিয়মিত পরীক্ষা এবং আধুনিক শিক্ষা ব্যবস্থার মাধ্যমে শিক্ষার্থীদের ভবিষ্যৎ গড়ে তোলাই আমাদের লক্ষ্য।"}
            </p>
            <div className="mt-6">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-(--shadow-soft) hover:opacity-90 hover:translate-x-0.5 active:scale-[0.98] transition"
              >
                বিস্তারিত দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-muted/60 border-y border-border">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }, i) => (
            <div key={`${label}-${i}`} className="text-center">
              <div className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-card border border-border text-primary mb-3">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl lg:text-4xl">{features.heading}</h2>
          {features.subheading && (
            <p className="mt-3 text-muted-foreground">{features.subheading}</p>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(features.items as { title: string; desc: string }[]).map(({ title, desc }, i) => (
            <article
              key={`${title}-${i}`}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition"
            >
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground mb-4 shadow-[var(--shadow-soft)]">
                <BookOpenCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-[image:var(--gradient-hero)] p-10 lg:p-14 text-center text-primary-foreground shadow-[var(--shadow-card)]">
          <h2 className="text-3xl lg:text-4xl">
            {cta.heading ?? "আজই আপনার সন্তানের ভর্তি নিশ্চিত করুন"}
          </h2>
          <p className="mt-3 opacity-90 max-w-2xl mx-auto">{cta.description ?? ""}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={(cta.primary_link ?? "/admission") as never}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card text-primary font-semibold hover:bg-card/90 transition"
            >
              {cta.primary_text ?? "ভর্তি হোন"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={(cta.secondary_link ?? "/contact") as never}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-foreground/30 font-semibold hover:bg-primary-foreground/10 transition"
            >
              {cta.secondary_text ?? "যোগাযোগ করুন"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
