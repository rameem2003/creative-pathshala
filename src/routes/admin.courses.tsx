import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, Field, Input, LoadingRow, PageHeader, Textarea } from "@/components/admin/AdminUI";
import { Save, Plus, Trash2, Upload, Eye, EyeOff, ArrowUp, ArrowDown, Search } from "lucide-react";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/courses")({ component: CoursesAdmin });

const KEYS = ["courses_header", "courses_features", "courses_items"] as const;
const ICON_OPTIONS = ["FileText", "ClipboardList", "CheckCircle2", "BookOpenCheck", "GraduationCap", "Award"];

type Feature = { icon: string; label: string };
type Course = {
  id: string;
  title: string;
  grade: string;
  description: string;
  subjects: string[];
  image_url?: string;
  is_published: boolean;
  sort_order: number;
};

type State = {
  courses_header: { badge?: string; title?: string; description?: string };
  courses_features: { items: Feature[] };
  courses_items: { items: Course[] };
};

const empty: State = { courses_header: {}, courses_features: { items: [] }, courses_items: { items: [] } };

async function uploadFile(file: File): Promise<string | null> {
  const cropped = await cropImage(file, { defaultAspect: 16 / 9, maxWidth: 1600 });
  if (!cropped) return null;
  const ext = cropped.name.split(".").pop() ?? "jpg";
  const path = `courses/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, cropped, { upsert: true, contentType: cropped.type });
  if (error) { alert("Upload failed: " + error.message); return null; }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

function newCourse(): Course {
  return { id: `c-${Date.now().toString(36)}`, title: "নতুন কোর্স", grade: "", description: "", subjects: [], image_url: "", is_published: true, sort_order: 99 };
}

function CoursesAdmin() {
  const [s, setS] = useState<State>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", KEYS as unknown as string[]);
      const map: any = { ...empty };
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      setS(map);
      setLoading(false);
    })();
  }, []);

  const saveKey = async (key: string, value: any) => {
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    if (existing) await supabase.from("site_settings").update({ value }).eq("id", existing.id);
    else await supabase.from("site_settings").insert({ key, value });
  };

  const saveAll = async () => {
    setSaving(true); setMsg(null);
    for (const k of KEYS) await saveKey(k, (s as any)[k]);
    setSaving(false);
    setMsg("✓ সংরক্ষিত হয়েছে — Courses পেইজে Live Update হয়েছে");
    setTimeout(() => setMsg(null), 3500);
  };

  if (loading) return <LoadingRow />;

  const courses = s.courses_items.items;
  const filtered = query
    ? courses.filter((c) => (c.title + " " + c.grade + " " + c.subjects.join(" ")).toLowerCase().includes(query.toLowerCase()))
    : courses;

  const updateCourse = (idx: number, patch: Partial<Course>) => {
    const items = [...courses];
    const realIdx = courses.indexOf(filtered[idx]);
    items[realIdx] = { ...items[realIdx], ...patch };
    setS({ ...s, courses_items: { items } });
  };
  const move = (idx: number, dir: -1 | 1) => {
    const items = [...courses];
    const realIdx = courses.indexOf(filtered[idx]);
    const t = realIdx + dir;
    if (t < 0 || t >= items.length) return;
    [items[realIdx], items[t]] = [items[t], items[realIdx]];
    items.forEach((c, i) => (c.sort_order = i + 1));
    setS({ ...s, courses_items: { items } });
  };
  const remove = (idx: number) => {
    if (!confirm("এই কোর্সটি Delete করবেন?")) return;
    const target = filtered[idx];
    setS({ ...s, courses_items: { items: courses.filter((c) => c !== target) } });
  };
  const add = () => setS({ ...s, courses_items: { items: [...courses, newCourse()] } });

  return (
    <>
      <PageHeader
        title="Courses Management"
        subtitle="Courses পেইজের সব Content এখান থেকে Manage করুন"
        action={
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs text-emerald-600 font-medium">{msg}</span>}
            <Btn onClick={saveAll} disabled={saving}><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}</Btn>
          </div>
        }
      />

      <div className="grid gap-5">
        {/* Page Header */}
        <Card>
          <h2 className="font-bold mb-4">Page Header</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Badge"><Input value={s.courses_header.badge ?? ""} onChange={(e) => setS({ ...s, courses_header: { ...s.courses_header, badge: e.target.value } })} /></Field>
            <Field label="Title"><Input value={s.courses_header.title ?? ""} onChange={(e) => setS({ ...s, courses_header: { ...s.courses_header, title: e.target.value } })} /></Field>
          </div>
          <div className="mt-3">
            <Field label="Description"><Textarea value={s.courses_header.description ?? ""} onChange={(e) => setS({ ...s, courses_header: { ...s.courses_header, description: e.target.value } })} /></Field>
          </div>
        </Card>

        {/* Features */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">সুবিধাসমূহ (Course Features)</h2>
            <Btn variant="outline" onClick={() => setS({ ...s, courses_features: { items: [...s.courses_features.items, { icon: "CheckCircle2", label: "" }] } })}><Plus className="w-4 h-4" /> Add</Btn>
          </div>
          <div className="space-y-2">
            {s.courses_features.items.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm" value={f.icon}
                  onChange={(e) => { const items = [...s.courses_features.items]; items[i] = { ...f, icon: e.target.value }; setS({ ...s, courses_features: { items } }); }}>
                  {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <Input value={f.label} onChange={(e) => { const items = [...s.courses_features.items]; items[i] = { ...f, label: e.target.value }; setS({ ...s, courses_features: { items } }); }} />
                <Btn variant="danger" onClick={() => setS({ ...s, courses_features: { items: s.courses_features.items.filter((_, x) => x !== i) } })}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            ))}
          </div>
        </Card>

        {/* Courses */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold">Courses ({courses.length})</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search courses..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Btn onClick={add}><Plus className="w-4 h-4" /> New Course</Btn>
            </div>
          </div>

          <div className="space-y-4">
            {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">কোনো কোর্স পাওয়া যায়নি।</p>}
            {filtered.map((c, idx) => (
              <div key={c.id} className="rounded-xl border border-border p-4 bg-background">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.is_published ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {c.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-muted-foreground">#{c.sort_order}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Btn variant="ghost" onClick={() => move(idx, -1)}><ArrowUp className="w-4 h-4" /></Btn>
                    <Btn variant="ghost" onClick={() => move(idx, 1)}><ArrowDown className="w-4 h-4" /></Btn>
                    <Btn variant="outline" onClick={() => updateCourse(idx, { is_published: !c.is_published })}>
                      {c.is_published ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Show</>}
                    </Btn>
                    <Btn variant="danger" onClick={() => remove(idx)}><Trash2 className="w-4 h-4" /></Btn>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Course Title"><Input value={c.title} onChange={(e) => updateCourse(idx, { title: e.target.value })} /></Field>
                  <Field label="Class Name / Grade"><Input value={c.grade} onChange={(e) => updateCourse(idx, { grade: e.target.value })} /></Field>
                </div>
                <div className="mt-3">
                  <Field label="Description"><Textarea value={c.description} onChange={(e) => updateCourse(idx, { description: e.target.value })} /></Field>
                </div>
                <div className="mt-3">
                  <Field label="Subjects (comma separated)">
                    <Input value={c.subjects.join(", ")} onChange={(e) => updateCourse(idx, { subjects: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Course Image">
                    <div className="flex items-center gap-3">
                      {c.image_url && <img src={c.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />}
                      <Input value={c.image_url ?? ""} placeholder="Image URL or upload below" onChange={(e) => updateCourse(idx, { image_url: e.target.value })} />
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted text-sm">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const url = await uploadFile(f); if (url) updateCourse(idx, { image_url: url });
                        }} />
                      </label>
                    </div>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}