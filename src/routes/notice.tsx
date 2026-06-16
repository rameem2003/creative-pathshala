import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, CalendarDays, FileText, Loader2, Printer, Download, Award } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { normalizeSchedule, ROUTINE_DAYS } from "@/routes/admin.routines";

export const Route = createFileRoute("/notice")({
  head: () => ({
    meta: [
      { title: "নোটিশ ও রুটিন — Canvas Pathsala" },
      { name: "description", content: "সকল গুরুত্বপূর্ণ ঘোষণা ও ক্লাস রুটিন এক জায়গায়।" },
    ],
  }),
  component: () => (<Layout><Notice /></Layout>),
});

type Notice = { id: string; title: string; content: string; category: string | null; file_url: string | null; published_at: string };
type Routine = { id: string; title: string; class_level: string; shift: string; schedule_data: any; pdf_url: string | null };
type Result = { id: string; title: string; class_level: string; exam_name: string | null; exam_date: string | null; description: string | null; pdf_url: string | null; published_at: string };

function Notice() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [n, r, res] = await Promise.all([
        supabase.from("notices").select("*").eq("is_published", true).order("published_at", { ascending: false }),
        supabase.from("routines").select("*").eq("is_active", true).order("class_level"),
        supabase.from("results").select("*").eq("is_published", true).order("published_at", { ascending: false }),
      ]);
      setNotices((n.data as Notice[]) ?? []);
      setRoutines((r.data as Routine[]) ?? []);
      setResults((res.data as Result[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("notice_page_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "routines" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const resultClasses = useMemo(() => Array.from(new Set(results.map((i) => i.class_level))), [results]);
  const filteredResults = resultFilter === "all" ? results : results.filter((i) => i.class_level === resultFilter);

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl">নোটিশ, রুটিন ও ফলাফল</h1>
        <p className="mt-4 text-muted-foreground text-lg">সকল গুরুত্বপূর্ণ ঘোষণা, ক্লাস রুটিন এবং পরীক্ষার ফলাফল এক জায়গায়।</p>
      </header>

      <section className="mb-14">
        <h2 className="text-2xl mb-5 flex items-center gap-2"><Megaphone className="w-6 h-6 text-primary" /> সাম্প্রতিক নোটিশ</h2>
        {loading ? <Spinner /> : notices.length === 0 ? <Empty>এখনো কোনো নোটিশ প্রকাশ করা হয়নি।</Empty> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notices.map((n) => (
              <article key={n.id} className="p-6 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-accent text-primary shrink-0"><FileText className="w-5 h-5" /></div>
                  {n.category && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{n.category}</span>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{new Date(n.published_at).toLocaleDateString("bn-BD")}</p>
                  <h3 className="font-bold text-foreground leading-snug">{n.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4">{n.content}</p>
                {n.file_url && (
                  <a href={n.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition w-full">
                    <Download className="w-4 h-4" /> Attachment
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-2xl flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" /> ক্লাস রুটিন</h2>
          {routines.length > 0 && (
            <button onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
              <Printer className="w-4 h-4" /> Print All (A4)
            </button>
          )}
        </div>
        {loading ? <Spinner /> : routines.length === 0 ? <Empty>এখনো কোনো রুটিন প্রকাশ করা হয়নি।</Empty> : (
          <div id="print-area" className="space-y-6">
            {routines.map((r) => <RoutineCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl mb-5 flex items-center gap-2"><Award className="w-6 h-6 text-primary" /> পরীক্ষার ফলাফল</h2>
        {resultClasses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button onClick={() => setResultFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${resultFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
              সব ক্লাস
            </button>
            {resultClasses.map((c) => (
              <button key={c} onClick={() => setResultFilter(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${resultFilter === c ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
                {c}
              </button>
            ))}
          </div>
        )}
        {loading ? <Spinner /> : filteredResults.length === 0 ? <Empty>এখনো কোনো ফলাফল প্রকাশ করা হয়নি।</Empty> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResults.map((r) => (
              <article key={r.id} className="p-6 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-accent text-primary shrink-0"><Award className="w-5 h-5" /></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{r.class_level}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {r.exam_name && <span>{r.exam_name} • </span>}
                    {new Date(r.exam_date ?? r.published_at).toLocaleDateString("bn-BD")}
                  </p>
                  <h3 className="font-bold text-foreground leading-snug">{r.title}</h3>
                </div>
                {r.description && <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{r.description}</p>}
                {r.pdf_url && (
                  <div className="flex gap-2">
                    <a href={r.pdf_url} download target="_blank" rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <button onClick={() => window.open(r.pdf_url!, "_blank")?.print()}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-muted transition">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 8mm; }
          #print-area > article { page-break-inside: avoid; margin-bottom: 6mm; box-shadow: none !important; border: 1px solid #ccc !important; }
          /* 3 routines per A4 page, stacked vertically */
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>
    </div>
  );
}

function RoutineCard({ r }: { r: Routine }) {
  const { data: settings } = useSiteSettings(["site_logo_url", "contact_phone", "site_name"]);
  const logo = (settings["site_logo_url"]?.v ?? "") as string;
  const phone = (settings["contact_phone"]?.v ?? "") as string;
  const siteName = (settings["site_name"]?.v ?? "Canvas Pathsala") as string;
  const schedule = useMemo(() => normalizeSchedule(r.schedule_data), [r.schedule_data]);
  const hasAny = useMemo(
    () => Object.values(schedule.grid).some((row) => row.some((c) => c && c.trim())),
    [schedule]
  );
  return (
    <article className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={siteName} className="w-12 h-12 object-contain rounded-lg" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold">CP</div>
          )}
          <div>
            <h3 className="font-bold text-base leading-tight">{siteName}</h3>
            <p className="text-xs text-muted-foreground">{r.title}</p>
          </div>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="font-semibold text-foreground">শ্রেণি: {r.class_level}</p>
          <p className="text-muted-foreground">শিফট: {r.shift}</p>
          {phone && <p className="text-muted-foreground">ফোন: {phone}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 print:hidden mb-3 justify-end">
          {r.pdf_url && (
            <a href={r.pdf_url} download target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
      </div>
      {!hasAny && r.pdf_url ? (
        <p className="text-sm text-muted-foreground">এই রুটিনের জন্য PDF ফাইল উপলব্ধ — উপরের Download PDF বাটনে ক্লিক করুন।</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="bg-primary/10">
                <th className="px-2 py-2 border-2 border-foreground/70 text-center font-bold w-[18%]">দিন / বার</th>
                {schedule.slots.map((s, i) => (
                  <th key={i} className="px-2 py-2 border-2 border-foreground/70 text-center font-bold">{s || `Box ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROUTINE_DAYS.map((day) => (
                <tr key={day}>
                  <td className="px-2 py-2.5 border-2 border-foreground/70 text-center font-semibold bg-muted/40">{day}</td>
                  {(schedule.grid[day] ?? ["", "", "", ""]).map((cell, i) => (
                    <td key={i} className="px-2 py-2.5 border-2 border-foreground/70 text-center">{cell || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function Spinner() { return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>; }
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{children}</div>;
}