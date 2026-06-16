import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Btn,
  Card,
  Field,
  Input,
  LoadingRow,
  PageHeader,
  Textarea,
  Select,
} from "@/components/admin/AdminUI";
import { Save, Upload, Plus, Trash2, Image as ImageIcon, Eye } from "lucide-react";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/about")({ component: AboutAdmin });

const KEYS = [
  "about_intro",
  "about_pillars",
  "about_quote",
  "about_teachers_header",
  "about_teachers",
  "about_gallery_header",
  "about_gallery",
] as const;

const ICONS = [
  "Target",
  "Compass",
  "ShieldCheck",
  "Heart",
  "GraduationCap",
  "Award",
  "Headphones",
  "Users",
  "Image",
];

type Pillar = { icon: string; title: string; desc: string };
type Teacher = { name: string; role: string; subject: string; exp: string; image_url?: string };
type GalleryCat = { title: string; images: string[] };

type State = {
  about_intro: { badge?: string; title?: string; description?: string; image_url?: string };
  about_pillars: { items: Pillar[] };
  about_quote: { title?: string; description?: string };
  about_teachers_header: { badge?: string; title?: string; description?: string };
  about_teachers: { items: Teacher[] };
  about_gallery_header: { badge?: string; title?: string; description?: string };
  about_gallery: { categories: GalleryCat[] };
};

const empty: State = {
  about_intro: {},
  about_pillars: { items: [] },
  about_quote: {},
  about_teachers_header: {},
  about_teachers: { items: [] },
  about_gallery_header: {},
  about_gallery: { categories: [] },
};

async function uploadFile(folder: string, file: File): Promise<string | null> {
  const isTeacher = folder.includes("teacher");
  const cropped = await cropImage(file, {
    defaultAspect: isTeacher ? 1 : 16 / 9,
    maxWidth: isTeacher ? 800 : 1600,
  });
  if (!cropped) return null;
  const ext = cropped.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, cropped, { upsert: true, contentType: cropped.type });
  if (error) {
    alert("Upload failed: " + error.message);
    return null;
  }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

function AboutAdmin() {
  const [s, setS] = useState<State>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const introFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      const map: any = { ...empty };
      (data ?? []).forEach((r: any) => {
        map[r.key] = r.value;
      });
      setS(map);
      setLoading(false);
    })();
  }, []);

  const saveKey = async (key: string, value: any) => {
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();
    if (existing) await supabase.from("site_settings").update({ value }).eq("id", existing.id);
    else await supabase.from("site_settings").insert({ key, value });
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg(null);
    for (const k of KEYS) await saveKey(k, (s as any)[k]);
    setSaving(false);
    setMsg("✓ সংরক্ষিত হয়েছে — About Page এ Live Update হয়েছে");
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <LoadingRow />;

  const intro = s.about_intro ?? {};
  const quote = s.about_quote ?? {};
  const tHead = s.about_teachers_header ?? {};
  const gHead = s.about_gallery_header ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="About Page Content"
        subtitle="আমাদের সম্পর্কে পেজের সব কনটেন্ট এখান থেকে এডিট করুন — Live Update হবে"
        action={
          <div className="flex gap-2">
            <a href="/about" target="_blank" rel="noreferrer">
              <Btn variant="outline">
                <Eye className="w-4 h-4" />
                Live Preview
              </Btn>
            </a>
            <Btn onClick={saveAll} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save All"}
            </Btn>
          </div>
        }
      />
      {msg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          {msg}
        </div>
      )}

      {/* INTRO */}
      <Card>
        <h2 className="font-bold mb-4">Coaching Introduction</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Badge / Tag">
            <Input
              value={intro.badge ?? ""}
              onChange={(e) => setS({ ...s, about_intro: { ...intro, badge: e.target.value } })}
            />
          </Field>
          <Field label="Section Title">
            <Input
              value={intro.title ?? ""}
              onChange={(e) => setS({ ...s, about_intro: { ...intro, title: e.target.value } })}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={intro.description ?? ""}
                onChange={(e) =>
                  setS({ ...s, about_intro: { ...intro, description: e.target.value } })
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Banner Image (optional)">
              <div className="flex items-start gap-4">
                <div className="w-40 h-28 rounded-xl border border-border bg-muted grid place-items-center overflow-hidden shrink-0">
                  {intro.image_url ? (
                    <img src={intro.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={intro.image_url ?? ""}
                    placeholder="https://..."
                    onChange={(e) =>
                      setS({ ...s, about_intro: { ...intro, image_url: e.target.value } })
                    }
                  />
                  <input
                    ref={introFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadFile("about", f);
                      if (url)
                        setS((p) => ({ ...p, about_intro: { ...p.about_intro, image_url: url } }));
                    }}
                  />
                  <Btn variant="outline" onClick={() => introFileRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Btn>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </Card>

      {/* PILLARS — Mission / Vision / Why / Promise */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Mission / Vision / Why Choose Us</h2>
          <Btn
            variant="outline"
            onClick={() =>
              setS({
                ...s,
                about_pillars: {
                  items: [...s.about_pillars.items, { icon: "Target", title: "", desc: "" }],
                },
              })
            }
          >
            <Plus className="w-4 h-4" />
            Add
          </Btn>
        </div>
        <div className="space-y-3">
          {s.about_pillars.items.map((it, i) => (
            <div
              key={i}
              className="grid md:grid-cols-[140px_1fr_2fr_auto] gap-2 items-end p-3 rounded-lg border border-border"
            >
              <Field label="Icon">
                <Select
                  value={it.icon}
                  onChange={(e) => {
                    const items = [...s.about_pillars.items];
                    items[i] = { ...it, icon: e.target.value };
                    setS({ ...s, about_pillars: { items } });
                  }}
                >
                  {ICONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title">
                <Input
                  value={it.title}
                  onChange={(e) => {
                    const items = [...s.about_pillars.items];
                    items[i] = { ...it, title: e.target.value };
                    setS({ ...s, about_pillars: { items } });
                  }}
                />
              </Field>
              <Field label="Description">
                <Input
                  value={it.desc}
                  onChange={(e) => {
                    const items = [...s.about_pillars.items];
                    items[i] = { ...it, desc: e.target.value };
                    setS({ ...s, about_pillars: { items } });
                  }}
                />
              </Field>
              <Btn
                variant="danger"
                onClick={() =>
                  setS({
                    ...s,
                    about_pillars: { items: s.about_pillars.items.filter((_, j) => j !== i) },
                  })
                }
              >
                <Trash2 className="w-4 h-4" />
              </Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* QUOTE */}
      <Card>
        <h2 className="font-bold mb-4">Quote / Highlight Banner</h2>
        <div className="space-y-3">
          <Field label="Quote Title">
            <Input
              value={quote.title ?? ""}
              onChange={(e) => setS({ ...s, about_quote: { ...quote, title: e.target.value } })}
            />
          </Field>
          <Field label="Quote Description">
            <Textarea
              value={quote.description ?? ""}
              onChange={(e) =>
                setS({ ...s, about_quote: { ...quote, description: e.target.value } })
              }
            />
          </Field>
        </div>
      </Card>

      {/* TEACHERS HEADER */}
      <Card>
        <h2 className="font-bold mb-4">Teachers — Section Header</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Badge">
            <Input
              value={tHead.badge ?? ""}
              onChange={(e) =>
                setS({ ...s, about_teachers_header: { ...tHead, badge: e.target.value } })
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={tHead.title ?? ""}
              onChange={(e) =>
                setS({ ...s, about_teachers_header: { ...tHead, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Description">
            <Input
              value={tHead.description ?? ""}
              onChange={(e) =>
                setS({ ...s, about_teachers_header: { ...tHead, description: e.target.value } })
              }
            />
          </Field>
        </div>
      </Card>

      {/* TEACHERS LIST */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Teacher Information</h2>
          <Btn
            variant="outline"
            onClick={() =>
              setS({
                ...s,
                about_teachers: {
                  items: [
                    ...s.about_teachers.items,
                    { name: "", role: "", subject: "", exp: "", image_url: "" },
                  ],
                },
              })
            }
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </Btn>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {s.about_teachers.items.map((t, i) => (
            <TeacherRow
              key={i}
              t={t}
              onChange={(nt) => {
                const items = [...s.about_teachers.items];
                items[i] = nt;
                setS({ ...s, about_teachers: { items } });
              }}
              onDelete={() =>
                setS({
                  ...s,
                  about_teachers: { items: s.about_teachers.items.filter((_, j) => j !== i) },
                })
              }
            />
          ))}
        </div>
      </Card>

      {/* GALLERY HEADER */}
      <Card>
        <h2 className="font-bold mb-4">Gallery — Section Header</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Badge">
            <Input
              value={gHead.badge ?? ""}
              onChange={(e) =>
                setS({ ...s, about_gallery_header: { ...gHead, badge: e.target.value } })
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={gHead.title ?? ""}
              onChange={(e) =>
                setS({ ...s, about_gallery_header: { ...gHead, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Description">
            <Input
              value={gHead.description ?? ""}
              onChange={(e) =>
                setS({ ...s, about_gallery_header: { ...gHead, description: e.target.value } })
              }
            />
          </Field>
        </div>
      </Card>

      {/* GALLERY CATEGORIES */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Gallery Categories & Images</h2>
          <Btn
            variant="outline"
            onClick={() =>
              setS({
                ...s,
                about_gallery: {
                  categories: [
                    ...s.about_gallery.categories,
                    { title: "New Category", images: [] },
                  ],
                },
              })
            }
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Btn>
        </div>
        <div className="space-y-4">
          {s.about_gallery.categories.map((cat, ci) => (
            <GalleryCategoryRow
              key={ci}
              cat={cat}
              onChange={(nc) => {
                const cats = [...s.about_gallery.categories];
                cats[ci] = nc;
                setS({ ...s, about_gallery: { categories: cats } });
              }}
              onDelete={() =>
                setS({
                  ...s,
                  about_gallery: {
                    categories: s.about_gallery.categories.filter((_, j) => j !== ci),
                  },
                })
              }
            />
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Btn onClick={saveAll} disabled={saving} className="shadow-lg">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </Btn>
      </div>
    </div>
  );
}

function TeacherRow({
  t,
  onChange,
  onDelete,
}: {
  t: Teacher;
  onChange: (t: Teacher) => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex gap-3 items-start">
        <div className="w-16 h-16 rounded-full border border-border bg-muted overflow-hidden shrink-0 grid place-items-center">
          {t.image_url ? (
            <img src={t.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            placeholder="Name"
            value={t.name}
            onChange={(e) => onChange({ ...t, name: e.target.value })}
          />
          <Input
            placeholder="Role"
            value={t.role}
            onChange={(e) => onChange({ ...t, role: e.target.value })}
          />
          <Input
            placeholder="Subject"
            value={t.subject}
            onChange={(e) => onChange({ ...t, subject: e.target.value })}
          />
          <Input
            placeholder="Experience"
            value={t.exp}
            onChange={(e) => onChange({ ...t, exp: e.target.value })}
          />
          <div className="col-span-2 flex gap-2">
            <Input
              placeholder="Image URL"
              value={t.image_url ?? ""}
              onChange={(e) => onChange({ ...t, image_url: e.target.value })}
            />
            <input
              ref={ref}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadFile("about/teachers", f);
                if (url) onChange({ ...t, image_url: url });
              }}
            />
            <Btn variant="outline" onClick={() => ref.current?.click()}>
              <Upload className="w-4 h-4" />
            </Btn>
            <Btn variant="danger" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryCategoryRow({
  cat,
  onChange,
  onDelete,
}: {
  cat: GalleryCat;
  onChange: (c: GalleryCat) => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={cat.title}
          onChange={(e) => onChange({ ...cat, title: e.target.value })}
          className="font-semibold"
        />
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            const urls: string[] = [];
            for (const f of files) {
              const u = await uploadFile("about/gallery", f);
              if (u) urls.push(u);
            }
            onChange({ ...cat, images: [...cat.images, ...urls] });
            if (e.target) e.target.value = "";
          }}
        />
        <Btn variant="outline" onClick={() => ref.current?.click()}>
          <Upload className="w-4 h-4" />
          Upload
        </Btn>
        <Btn variant="danger" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Btn>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {cat.images.map((url, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-muted"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ ...cat, images: cat.images.filter((_, j) => j !== i) })}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-md p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {cat.images.length === 0 && (
          <div className="col-span-full text-xs text-muted-foreground py-4 text-center">
            কোন ইমেজ যোগ করা হয়নি
          </div>
        )}
      </div>
    </div>
  );
}
