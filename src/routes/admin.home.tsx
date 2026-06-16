import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, Field, Input, LoadingRow, PageHeader, Textarea } from "@/components/admin/AdminUI";
import { Save, Upload, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/home")({ component: HomeAdmin });

const KEYS = ["home_hero", "home_stats", "home_features", "home_cta"] as const;

type State = {
  home_hero: any;
  home_stats: { items: { value: string; label: string }[] };
  home_features: { heading: string; subheading: string; items: { title: string; desc: string }[] };
  home_cta: any;
};

const empty: State = {
  home_hero: {},
  home_stats: { items: [] },
  home_features: { heading: "", subheading: "", items: [] },
  home_cta: {},
};

function HomeAdmin() {
  const [s, setS] = useState<State>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setMsg("✓ সংরক্ষিত হয়েছে — Website এ Live Update হয়েছে");
    setTimeout(() => setMsg(null), 3000);
  };

  const uploadHero = async (file: File) => {
    const cropped = await cropImage(file, { defaultAspect: 16 / 9, maxWidth: 1920 });
    if (!cropped) return;
    setUploading(true);
    const ext = cropped.name.split(".").pop() ?? "jpg";
    const path = `hero/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, cropped, { upsert: true, contentType: cropped.type });
    if (error) { alert("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setS({ ...s, home_hero: { ...s.home_hero, image_url: data.publicUrl } });
    setUploading(false);
  };

  if (loading) return <LoadingRow />;

  const hero = s.home_hero ?? {};
  const cta = s.home_cta ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home Page Content"
        subtitle="ওয়েবসাইটের হোম পেজের সব কনটেন্ট এখান থেকে এডিট করুন — Live Update হবে"
        action={<Btn onClick={saveAll} disabled={saving}><Save className="w-4 h-4" />{saving ? "Saving..." : "Save All Changes"}</Btn>}
      />
      {msg && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">{msg}</div>}

      {/* HERO */}
      <Card>
        <h2 className="font-bold mb-4">Hero Section</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Admission Banner (top strip)"><Input value={hero.admission_banner ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, admission_banner: e.target.value } })} /></Field>
          <Field label="Badge Text"><Input value={hero.badge ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, badge: e.target.value } })} /></Field>
          <Field label="Title (Part 1)"><Input value={hero.title_1 ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, title_1: e.target.value } })} /></Field>
          <Field label="Title (Part 2 — gradient)"><Input value={hero.title_2 ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, title_2: e.target.value } })} /></Field>
          <div className="md:col-span-2"><Field label="Tagline"><Input value={hero.tagline ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, tagline: e.target.value } })} /></Field></div>
          <div className="md:col-span-2"><Field label="Description (Paragraph 1)"><Textarea value={hero.description ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, description: e.target.value } })} /></Field></div>
          <div className="md:col-span-2"><Field label="Description (Paragraph 2)"><Textarea value={hero.description_2 ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, description_2: e.target.value } })} /></Field></div>

          <Field label="Primary Button Text"><Input value={hero.cta_primary_text ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, cta_primary_text: e.target.value } })} /></Field>
          <Field label="Primary Button Link"><Input value={hero.cta_primary_link ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, cta_primary_link: e.target.value } })} /></Field>
          <Field label="Secondary Button Text"><Input value={hero.cta_secondary_text ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, cta_secondary_text: e.target.value } })} /></Field>
          <Field label="Secondary Button Link"><Input value={hero.cta_secondary_link ?? ""} onChange={(e) => setS({ ...s, home_hero: { ...hero, cta_secondary_link: e.target.value } })} /></Field>

          <div className="md:col-span-2">
            <Field label="Hero Image">
              <div className="flex items-start gap-4">
                <div className="w-32 h-40 rounded-xl border border-border bg-muted grid place-items-center overflow-hidden shrink-0">
                  {hero.image_url ? <img src={hero.image_url} alt="Hero" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 space-y-2">
                  <Input value={hero.image_url ?? ""} placeholder="https://... অথবা নিচে আপলোড করুন" onChange={(e) => setS({ ...s, home_hero: { ...hero, image_url: e.target.value } })} />
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero(f); }} />
                  <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4" />{uploading ? "Uploading..." : "Upload Image"}
                  </Btn>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Statistics Counters</h2>
          <Btn variant="outline" onClick={() => setS({ ...s, home_stats: { items: [...s.home_stats.items, { value: "", label: "" }] } })}>
            <Plus className="w-4 h-4" />Add
          </Btn>
        </div>
        <div className="space-y-3">
          {s.home_stats.items.map((it, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1"><Field label="Value"><Input value={it.value} onChange={(e) => { const items = [...s.home_stats.items]; items[i] = { ...it, value: e.target.value }; setS({ ...s, home_stats: { items } }); }} /></Field></div>
              <div className="flex-1"><Field label="Label"><Input value={it.label} onChange={(e) => { const items = [...s.home_stats.items]; items[i] = { ...it, label: e.target.value }; setS({ ...s, home_stats: { items } }); }} /></Field></div>
              <Btn variant="danger" onClick={() => setS({ ...s, home_stats: { items: s.home_stats.items.filter((_, j) => j !== i) } })}><Trash2 className="w-4 h-4" /></Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* FEATURES */}
      <Card>
        <h2 className="font-bold mb-4">Features Section</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Field label="Heading"><Input value={s.home_features.heading} onChange={(e) => setS({ ...s, home_features: { ...s.home_features, heading: e.target.value } })} /></Field>
          <Field label="Subheading"><Input value={s.home_features.subheading} onChange={(e) => setS({ ...s, home_features: { ...s.home_features, subheading: e.target.value } })} /></Field>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Feature Items</p>
          <Btn variant="outline" onClick={() => setS({ ...s, home_features: { ...s.home_features, items: [...s.home_features.items, { title: "", desc: "" }] } })}>
            <Plus className="w-4 h-4" />Add
          </Btn>
        </div>
        <div className="space-y-3">
          {s.home_features.items.map((it, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-border">
              <div className="flex-1 space-y-2">
                <Input placeholder="Title" value={it.title} onChange={(e) => { const items = [...s.home_features.items]; items[i] = { ...it, title: e.target.value }; setS({ ...s, home_features: { ...s.home_features, items } }); }} />
                <Textarea placeholder="Description" value={it.desc} onChange={(e) => { const items = [...s.home_features.items]; items[i] = { ...it, desc: e.target.value }; setS({ ...s, home_features: { ...s.home_features, items } }); }} />
              </div>
              <Btn variant="danger" onClick={() => setS({ ...s, home_features: { ...s.home_features, items: s.home_features.items.filter((_, j) => j !== i) } })}><Trash2 className="w-4 h-4" /></Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card>
        <h2 className="font-bold mb-4">Bottom CTA Section</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Heading"><Input value={cta.heading ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, heading: e.target.value } })} /></Field></div>
          <div className="md:col-span-2"><Field label="Description"><Textarea value={cta.description ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, description: e.target.value } })} /></Field></div>
          <Field label="Primary Text"><Input value={cta.primary_text ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, primary_text: e.target.value } })} /></Field>
          <Field label="Primary Link"><Input value={cta.primary_link ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, primary_link: e.target.value } })} /></Field>
          <Field label="Secondary Text"><Input value={cta.secondary_text ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, secondary_text: e.target.value } })} /></Field>
          <Field label="Secondary Link"><Input value={cta.secondary_link ?? ""} onChange={(e) => setS({ ...s, home_cta: { ...cta, secondary_link: e.target.value } })} /></Field>
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Btn onClick={saveAll} disabled={saving} className="shadow-lg"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save All Changes"}</Btn>
      </div>
    </div>
  );
}