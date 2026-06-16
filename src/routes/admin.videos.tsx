import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Textarea } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/videos")({ component: VideosAdmin });

type Video = { id: string; title: string; description: string | null; youtube_url: string; thumbnail_url: string | null; class_level: string; subject: string; is_published: boolean; created_at: string };

function VideosAdmin() {
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Video> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setItems((data as Video[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      description: editing.description || null,
      youtube_url: editing.youtube_url ?? "",
      thumbnail_url: editing.thumbnail_url || null,
      class_level: editing.class_level ?? "",
      subject: editing.subject ?? "",
      is_published: editing.is_published ?? true,
    };
    if (editing.id) await supabase.from("videos").update(payload).eq("id", editing.id);
    else await supabase.from("videos").insert(payload);
    setEditing(null); load();
  };
  const remove = async (id: string) => { if (confirm("ভিডিও ডিলিট করবেন?")) { await supabase.from("videos").delete().eq("id", id); load(); } };
  const togglePub = async (v: Video) => { await supabase.from("videos").update({ is_published: !v.is_published }).eq("id", v.id); load(); };

  return (
    <div>
      <PageHeader title="Videos" subtitle="YouTube ভিডিও লাইব্রেরি পরিচালনা"
        action={<Btn onClick={() => setEditing({ is_published: true })}><Plus className="w-4 h-4" />New Video</Btn>} />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>কোনো ভিডিও নেই।</EmptyState></Card> : (
        <DataTable headers={["Title", "Class", "Subject", "Status", "Actions"]}>
          {items.map((v) => (
            <tr key={v.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{v.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{v.class_level}</td>
              <td className="px-4 py-3 text-muted-foreground">{v.subject}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{v.is_published ? "Live" : "Hidden"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => togglePub(v)}>{v.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing(v)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(v.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Video" : "New Video"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title"><Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="YouTube URL"><Input required value={editing.youtube_url ?? ""} onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class Level"><Input required value={editing.class_level ?? ""} onChange={(e) => setEditing({ ...editing, class_level: e.target.value })} placeholder="Class 8" /></Field>
              <Field label="Subject"><Input required value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Math" /></Field>
            </div>
            <Field label="Thumbnail URL (optional)"><Input value={editing.thumbnail_url ?? ""} onChange={(e) => setEditing({ ...editing, thumbnail_url: e.target.value })} /></Field>
            <Field label="Description"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
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