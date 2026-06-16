import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Select, Textarea } from "@/components/admin/AdminUI";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/blogs")({ component: BlogsAdmin });

type Blog = { id: string; title: string; slug: string; excerpt: string | null; content: string; category: string | null; thumbnail_url: string | null; is_published: boolean; created_at: string };

const BLOG_CATEGORIES = [
  "শিক্ষা বিষয়ক Tips",
  "পরীক্ষার প্রস্তুতি",
  "IT & Computer Tips",
  "Career Guideline",
  "Freelancing Tips",
] as const;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

function BlogsAdmin() {
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Blog> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setItems((data as Blog[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadThumb = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) { alert("শুধু JPG / PNG / WEBP সাপোর্ট করে"); return; }
    const cropped = await cropImage(file, { defaultAspect: 16 / 10, maxWidth: 1600 });
    if (!cropped) return;
    setUploading(true);
    const ext = (cropped.name.split(".").pop() || "jpg").toLowerCase();
    const path = `blogs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, cropped, { upsert: false, contentType: cropped.type });
    setUploading(false);
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (editing) setEditing({ ...editing, thumbnail_url: data.publicUrl });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      slug: editing.slug || slugify(editing.title ?? "") || crypto.randomUUID().slice(0, 8),
      excerpt: editing.excerpt || null,
      content: editing.content ?? "",
      category: editing.category || BLOG_CATEGORIES[0],
      thumbnail_url: editing.thumbnail_url || null,
      is_published: editing.is_published ?? false,
      published_at: editing.is_published ? new Date().toISOString() : null,
    };
    if (editing.id) await supabase.from("blogs").update(payload).eq("id", editing.id);
    else await supabase.from("blogs").insert(payload);
    setEditing(null); load();
  };
  const remove = async (id: string) => { if (confirm("ব্লগটি ডিলিট করবেন?")) { await supabase.from("blogs").delete().eq("id", id); load(); } };
  const togglePub = async (b: Blog) => { await supabase.from("blogs").update({ is_published: !b.is_published, published_at: !b.is_published ? new Date().toISOString() : null }).eq("id", b.id); load(); };

  return (
    <div>
      <PageHeader title="Blogs" subtitle="ব্লগ পোস্ট পরিচালনা"
        action={<Btn onClick={() => setEditing({ is_published: false, category: BLOG_CATEGORIES[0] })}><Plus className="w-4 h-4" />New Blog</Btn>} />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>কোনো ব্লগ পোস্ট নেই।</EmptyState></Card> : (
        <DataTable headers={["Title", "Slug", "Category", "Status", "Actions"]}>
          {items.map((b) => (
            <tr key={b.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{b.title}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{b.slug}</td>
              <td className="px-4 py-3 text-muted-foreground">{b.category}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {b.is_published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => togglePub(b)}>{b.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing(b)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Blog" : "New Blog"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title"><Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></Field>
            <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={editing.category ?? BLOG_CATEGORIES[0]} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Featured Image">
              <div className="space-y-2">
                {editing.thumbnail_url ? (
                  <div className="relative w-full max-w-sm aspect-[16/10] rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={editing.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <div className="flex gap-2 items-center">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadThumb(f); e.target.value = ""; }} />
                  <Btn type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {editing.thumbnail_url ? "Replace Image" : "Upload Image"}
                  </Btn>
                  {editing.thumbnail_url && (
                    <Btn type="button" variant="ghost" onClick={() => setEditing({ ...editing, thumbnail_url: null })}>Remove</Btn>
                  )}
                </div>
                <Input value={editing.thumbnail_url ?? ""} onChange={(e) => setEditing({ ...editing, thumbnail_url: e.target.value })} placeholder="অথবা Image URL দিন" />
              </div>
            </Field>
            <Field label="Excerpt"><Textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
            <Field label="Content (Markdown supported)"><Textarea required className="min-h-[200px]" value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_published ?? false} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
              Publish immediately
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn type="submit">Save</Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}