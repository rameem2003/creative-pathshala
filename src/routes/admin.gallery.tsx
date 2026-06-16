import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Eye, EyeOff, Pencil, Upload, Search, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Btn, Card, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Textarea } from "@/components/admin/AdminUI";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryAdmin });

type Item = { id: string; title: string | null; caption: string | null; image_url: string; category: string | null; is_published: boolean; created_at?: string };

const CATEGORIES = [
  "Classroom Activities",
  "Prize Giving Ceremony",
  "Student Events",
  "Educational Programs",
  "Campus Photos",
] as const;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function GalleryAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>(CATEGORIES[0]);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkProgress, setBulkProgress] = useState<Record<string, number>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || (i.title ?? "").toLowerCase().includes(q) || (i.caption ?? "").toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q);
    const matchC = !filterCat || i.category === filterCat;
    return matchQ && matchC;
  });

  const uploadOne = async (file: File): Promise<string | null> => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
    if (error) { alert("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const replaceImage = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) { alert("শুধু JPG / PNG / WEBP সাপোর্ট করে"); return; }
    const cropped = await cropImage(file, { defaultAspect: undefined, maxWidth: 1920 });
    if (!cropped) return;
    setEditUploading(true);
    const url = await uploadOne(cropped);
    setEditUploading(false);
    if (url && editing) setEditing({ ...editing, image_url: url });
  };

  const handleBulkFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => ACCEPTED.includes(f.type));
    if (arr.length === 0) { alert("শুধু JPG / PNG / WEBP সাপোর্ট করে"); return; }
    setBulkFiles((prev) => [...prev, ...arr]);
  };

  const runBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setBulkBusy(true);
    for (const f of bulkFiles) {
      setBulkProgress((p) => ({ ...p, [f.name]: 10 }));
      const url = await uploadOne(f);
      setBulkProgress((p) => ({ ...p, [f.name]: 70 }));
      if (url) {
        await supabase.from("gallery").insert({
          image_url: url,
          title: f.name.replace(/\.[^.]+$/, ""),
          category: bulkCategory,
          is_published: true,
        });
      }
      setBulkProgress((p) => ({ ...p, [f.name]: 100 }));
    }
    setBulkBusy(false);
    setBulkFiles([]);
    setBulkProgress({});
    setBulkOpen(false);
    load();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return;
    if (!editing.image_url) { alert("ছবি আপলোড করুন"); return; }
    const payload = {
      title: editing.title || null,
      caption: editing.caption || null,
      image_url: editing.image_url ?? "",
      category: editing.category || CATEGORIES[0],
      is_published: editing.is_published ?? true,
    };
    if (editing.id) await supabase.from("gallery").update(payload).eq("id", editing.id);
    else await supabase.from("gallery").insert(payload);
    setEditing(null); load();
  };
  const remove = async (id: string) => { if (confirm("ছবিটি ডিলিট করবেন?")) { await supabase.from("gallery").delete().eq("id", id); load(); } };
  const togglePub = async (i: Item) => { await supabase.from("gallery").update({ is_published: !i.is_published }).eq("id", i.id); load(); };

  return (
    <div>
      <PageHeader title="Gallery" subtitle="ছবি গ্যালারি পরিচালনা — Drag & Drop দিয়ে একসাথে অনেক ছবি আপলোড করুন"
        action={
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setEditing({ is_published: true, category: CATEGORIES[0] })}><Plus className="w-4 h-4" />Single Add</Btn>
            <Btn onClick={() => setBulkOpen(true)}><Upload className="w-4 h-4" />Upload Images</Btn>
          </div>
        } />

      <Card className="mb-4 !p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ছবি খুঁজুন (title / caption / category)..." className="pl-9" />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} / {items.length}</span>
        </div>
      </Card>

      {loading ? <LoadingRow /> : filtered.length === 0 ? <Card><EmptyState>কোনো ছবি নেই। উপরের "Upload Images" বাটনে ক্লিক করুন।</EmptyState></Card> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((i) => (
            <Card key={i.id} className="!p-0 overflow-hidden group">
              <div className="aspect-video bg-muted overflow-hidden relative">
                {i.image_url ? <img src={i.image_url} alt={i.title ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : null}
                {!i.is_published && <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">Hidden</span>}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{i.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate">{i.category}</p>
                {i.created_at && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(i.created_at).toLocaleDateString()}</p>}
                <div className="flex gap-1 mt-2">
                  <Btn variant="ghost" onClick={() => togglePub(i)}>{i.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing(i)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk upload modal */}
      <Modal open={bulkOpen} onClose={() => !bulkBusy && setBulkOpen(false)} title="Upload Gallery Images">
        <div className="space-y-4">
          <Field label="Category">
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleBulkFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">এখানে ছবি Drag & Drop করুন</p>
            <p className="text-xs text-muted-foreground mt-1">অথবা ক্লিক করে Browse করুন · JPG / PNG / WEBP · একাধিক ফাইল</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
              onChange={(e) => { if (e.target.files) handleBulkFiles(e.target.files); e.target.value = ""; }} />
          </div>

          {bulkFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {bulkFiles.map((f, idx) => {
                const prog = bulkProgress[f.name] ?? 0;
                return (
                  <div key={`${f.name}-${idx}`} className="relative rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-24 object-cover" />
                    {!bulkBusy && (
                      <button onClick={() => setBulkFiles((p) => p.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {bulkBusy && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                        <div className="h-full bg-primary transition-all" style={{ width: `${prog}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkBusy}>Cancel</Btn>
            <Btn onClick={runBulkUpload} disabled={bulkBusy || bulkFiles.length === 0}>
              {bulkBusy ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload {bulkFiles.length > 0 ? `(${bulkFiles.length})` : ""}</>}
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Image" : "Add Image"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Image">
              <div className="space-y-2">
                {editing.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={editing.image_url} alt="" className="w-full max-h-60 object-contain bg-muted" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" /> কোনো ছবি নেই
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium cursor-pointer">
                  {editUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {editing.image_url ? "Replace Image" : "Upload Image"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceImage(f); e.target.value = ""; }} />
                </label>
              </div>
            </Field>
            <Field label="Title"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Category">
              <select value={editing.category ?? CATEGORIES[0]} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description / Caption"><Textarea value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published
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