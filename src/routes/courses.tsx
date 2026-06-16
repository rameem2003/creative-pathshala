import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { BookOpenCheck, FileText, ClipboardList, CheckCircle2, ArrowRight, GraduationCap, Award } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "কোর্সসমূহ — Canvas Pathsala" },
      { name: "description", content: "Play–KG, Class 1–5 এবং Class 6–8 এর সম্পূর্ণ একাডেমিক কোর্স।" },
    ],
  }),
  component: () => (
    <Layout>
      <Courses />
    </Layout>
  ),
});

const ICON_MAP: Record<string, any> = { FileText, ClipboardList, CheckCircle2, BookOpenCheck, GraduationCap, Award };
const GRADIENTS = [
  "from-[oklch(0.65_0.18_240)] to-[oklch(0.75_0.15_220)]",
  "from-[oklch(0.55_0.20_255)] to-[oklch(0.68_0.18_235)]",
  "from-[oklch(0.45_0.22_260)] to-[oklch(0.60_0.20_245)]",
  "from-[oklch(0.55_0.22_290)] to-[oklch(0.70_0.18_270)]",
];

function Courses() {
  const { data, loading } = useSiteSettings(["courses_header", "courses_features", "courses_items"]);
  const header = data.courses_header ?? {};
  const features: { icon: string; label: string }[] = data.courses_features?.items ?? [];
  const allCourses: any[] = data.courses_items?.items ?? [];
  const groups = allCourses
    .filter((c) => c.is_published !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="max-w-2xl mx-auto text-center mb-12">
        {header.badge && <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary mb-2">{header.badge}</span>}
        <h1 className="text-4xl lg:text-5xl">{header.title ?? "আমাদের কোর্সসমূহ"}</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          {header.description ?? "Play Group থেকে Class 8 পর্যন্ত প্রতিটি স্তরের জন্য সাজানো বিশেষ কোর্স।"}
        </p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">কোনো কোর্স পাওয়া যায়নি।</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {groups.map((g, i) => (
            <article key={g.id ?? g.title} className="rounded-2xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)] hover:-translate-y-1 transition">
              {g.image_url ? (
                <div className="relative h-40 overflow-hidden">
                  <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} opacity-80 mix-blend-multiply`} />
                  <div className="absolute inset-0 p-6 text-primary-foreground flex flex-col justify-end">
                    {g.grade && <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{g.grade}</p>}
                    <h2 className="text-3xl font-bold mt-1">{g.title}</h2>
                  </div>
                </div>
              ) : (
                <div className={`bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-6 text-primary-foreground`}>
                  {g.grade && <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{g.grade}</p>}
                  <h2 className="text-3xl font-bold mt-1">{g.title}</h2>
                </div>
              )}
              <div className="p-6 space-y-5">
                {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                {g.subjects?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-foreground">বিষয়সমূহ</h3>
                    <div className="flex flex-wrap gap-2">
                      {g.subjects.map((s: string) => (
                        <span key={s} className="text-xs px-3 py-1 rounded-full bg-muted text-foreground/80 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-foreground">সুবিধাসমূহ</h3>
                    <ul className="space-y-2">
                      {features.map((f) => {
                        const Icon = ICON_MAP[f.icon] ?? CheckCircle2;
                        return (
                          <li key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="w-4 h-4 text-primary" /> {f.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <Link to="/admission" className="w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
                  ভর্তি হোন <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}