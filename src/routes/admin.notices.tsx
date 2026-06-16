import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Select, Textarea } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/notices")({ component: NoticesAdmin });

type Notice = { id: string; title: string; content: string; category: string | null; is_published: boolean; created_at: string; file_url: string | null };

function NoticesAdmin() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Notice> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    setItems((data as Notice[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin_notices_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      content: editing.content ?? "",
      category: editing.category || "general",
      file_url: editing.file_url || null,
      is_published: editing.is_published ?? true,
    };
    if (editing.id) await supabase.from("notices").update(payload).eq("id", editing.id);
    else await supabase.from("notices").insert(payload);
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("নোটিশটি ডিলিট করবেন?")) return;
    await supabase.from("notices").delete().eq("id", id); load();
  };

  const togglePub = async (n: Notice) => {
    await supabase.from("notices").update({ is_published: !n.is_published }).eq("id", n.id); load();
  };

  return (
    <div>
      <PageHeader title="Notices" subtitle="সকল নোটিশ পরিচালনা করুন"
        action={<Btn onClick={() => setEditing({ is_published: true, category: "general" })}><Plus className="w-4 h-4" />New Notice</Btn>}
      />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>কোনো নোটিশ নেই। নতুন তৈরি করুন।</EmptyState></Card> : (
        <DataTable headers={["Title", "Category", "Status", "Date", "Actions"]}>
          {items.map((n) => (
            <tr key={n.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{n.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{n.category}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.is_published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {n.is_published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(n.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => togglePub(n)}>{n.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing(n)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(n.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Notice" : "New Notice"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title"><Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={editing.category ?? "general"} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                <option value="general">General</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="event">Event</option>
              </Select>
            </Field>
            <Field label="Content"><Textarea required value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></Field>
            <Field label="File URL (optional)"><Input value={editing.file_url ?? ""} onChange={(e) => setEditing({ ...editing, file_url: e.target.value })} placeholder="https://..." /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
              Published
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