import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, FileText, Loader2 } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Select, Textarea } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/results")({ component: ResultsAdmin });

type Result = {
  id: string;
  title: string;
  class_level: string;
  exam_name: string | null;
  exam_date: string | null;
  description: string | null;
  pdf_url: string | null;
  is_published: boolean;
  published_at: string;
};

function ResultsAdmin() {
  const [items, setItems] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Result> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("results").select("*").order("published_at", { ascending: false });
    setItems((data as Result[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      class_level: editing.class_level ?? "",
      exam_name: editing.exam_name || null,
      exam_date: editing.exam_date || null,
      description: editing.description || null,
      pdf_url: editing.pdf_url || null,
      is_published: editing.is_published ?? true,
    };
    if (editing.id) await supabase.from("results").update(payload).eq("id", editing.id);
    else await supabase.from("results").insert(payload);
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("রেজাল্ট ডিলিট করবেন?")) return;
    await supabase.from("results").delete().eq("id", id); load();
  };

  const togglePub = async (r: Result) => {
    await supabase.from("results").update({ is_published: !r.is_published }).eq("id", r.id); load();
  };

  const handlePdfUpload = async (file: File) => {
    if (!editing) return;
    if (file.type !== "application/pdf") { alert("শুধু PDF ফাইল আপলোড করুন"); return; }
    setUploading(true);
    const ext = "pdf";
    const path = `results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: "application/pdf" });
    if (error) { alert(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setEditing({ ...editing, pdf_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <div>
      <PageHeader title="Results" subtitle="পরীক্ষার ফলাফল পরিচালনা"
        action={<Btn onClick={() => setEditing({ is_published: true, class_level: "" })}><Plus className="w-4 h-4" />New Result</Btn>}
      />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>এখনো কোনো রেজাল্ট নেই।</EmptyState></Card> : (
        <DataTable headers={["Title", "Class", "Exam", "PDF", "Status", "Date", "Actions"]}>
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{r.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.class_level}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.exam_name ?? "-"}</td>
              <td className="px-4 py-3">
                {r.pdf_url ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">View</a> : <span className="text-xs text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {r.is_published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.published_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => togglePub(r)}>{r.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Result" : "New Result"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title"><Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Class 9 Half-Yearly Result" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                <Select required value={editing.class_level ?? ""} onChange={(e) => setEditing({ ...editing, class_level: e.target.value })}>
                  <option value="">Select Class</option>
                  <option>Class 6</option><option>Class 7</option><option>Class 8</option>
                  <option>Class 9</option><option>Class 10</option><option>HSC</option>
                </Select>
              </Field>
              <Field label="Exam Name"><Input value={editing.exam_name ?? ""} onChange={(e) => setEditing({ ...editing, exam_name: e.target.value })} placeholder="Half-Yearly" /></Field>
            </div>
            <Field label="Exam Date"><Input type="date" value={editing.exam_date ?? ""} onChange={(e) => setEditing({ ...editing, exam_date: e.target.value })} /></Field>
            <Field label="Description"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>

            <Field label="Result PDF">
              <div
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handlePdfUpload(f); }}
                className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/30"
              >
                {editing.pdf_url ? (
                  <div className="flex items-center justify-between gap-3">
                    <a href={editing.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <FileText className="w-4 h-4" /> View Uploaded PDF
                    </a>
                    <div className="flex gap-2">
                      <Btn variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />Replace</Btn>
                      <Btn variant="danger" onClick={() => setEditing({ ...editing, pdf_url: null })}><Trash2 className="w-4 h-4" />Remove</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Drag & drop PDF here, or</p>
                    <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Choose PDF"}
                    </Btn>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ""; }} />
              </div>
            </Field>

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