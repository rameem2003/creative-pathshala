import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, FileText, Loader2 } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, Input, LoadingRow, Modal, PageHeader, Select } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/routines")({ component: RoutinesAdmin });

type Routine = { id: string; title: string; class_level: string; shift: string; schedule_data: unknown; is_active: boolean; created_at: string; pdf_url: string | null };

export const ROUTINE_DAYS = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"] as const;
const DEFAULT_SLOTS = ["১ম পিরিয়ড", "২য় পিরিয়ড", "৩য় পিরিয়ড", "৪র্থ পিরিয়ড"];

export type RoutineGrid = { slots: string[]; grid: Record<string, string[]> };

// Accepts new shape { slots, grid } or legacy array of { day, time, subject }
export function normalizeSchedule(raw: unknown): RoutineGrid {
  const empty = (): RoutineGrid => ({
    slots: [...DEFAULT_SLOTS],
    grid: Object.fromEntries(ROUTINE_DAYS.map((d) => [d, ["", "", "", ""]])) as Record<string, string[]>,
  });
  const out = empty();
  if (!raw) return out;
  if (typeof raw === "object" && !Array.isArray(raw) && (raw as any).grid) {
    const r = raw as RoutineGrid;
    if (Array.isArray(r.slots) && r.slots.length === 4) out.slots = r.slots.map((s) => String(s ?? ""));
    ROUTINE_DAYS.forEach((d) => {
      const row = r.grid?.[d];
      if (Array.isArray(row)) {
        for (let i = 0; i < 4; i++) out.grid[d][i] = String(row[i] ?? "");
      }
    });
    return out;
  }
  if (Array.isArray(raw)) {
    // legacy: collect unique times → slot headers; map subject by day
    const times = Array.from(new Set((raw as any[]).map((r) => r?.time).filter(Boolean))).slice(0, 4);
    if (times.length) out.slots = [...times, ...DEFAULT_SLOTS].slice(0, 4);
    (raw as any[]).forEach((row) => {
      const day = row?.day; const idx = times.indexOf(row?.time);
      if (day && out.grid[day] && idx >= 0) out.grid[day][idx] = String(row?.subject ?? "");
    });
  }
  return out;
}

function RoutinesAdmin() {
  const [items, setItems] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<Routine> & { _grid?: RoutineGrid }) | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("routines").select("*").order("created_at", { ascending: false });
    setItems((data as Routine[]) ?? []); setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin_routines_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "routines" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return;
    const schedule = (editing._grid ?? normalizeSchedule(null)) as unknown as import("@/integrations/supabase/types").Json;
    const payload = {
      title: editing.title ?? "",
      class_level: editing.class_level ?? "",
      shift: editing.shift ?? "সকাল",
      schedule_data: schedule,
      is_active: editing.is_active ?? true,
      pdf_url: editing.pdf_url || null,
    };
    if (editing.id) await supabase.from("routines").update(payload).eq("id", editing.id);
    else await supabase.from("routines").insert(payload);
    setEditing(null); load();
  };
  const remove = async (id: string) => { if (confirm("রুটিন ডিলিট করবেন?")) { await supabase.from("routines").delete().eq("id", id); load(); } };
  const togglePub = async (r: Routine) => { await supabase.from("routines").update({ is_active: !r.is_active }).eq("id", r.id); load(); };

  const handlePdfUpload = async (file: File) => {
    if (!editing) return;
    if (file.type !== "application/pdf") { alert("শুধু PDF ফাইল আপলোড করুন"); return; }
    setUploading(true);
    const path = `routines/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: "application/pdf" });
    if (error) { alert(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setEditing({ ...editing, pdf_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <div>
      <PageHeader title="Routines" subtitle="ক্লাস রুটিন পরিচালনা"
        action={<Btn onClick={() => setEditing({ is_active: true, shift: "সকাল", pdf_url: null, _grid: normalizeSchedule(null) })}><Plus className="w-4 h-4" />New Routine</Btn>} />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>কোনো রুটিন নেই।</EmptyState></Card> : (
        <DataTable headers={["Title", "Class", "Shift", "PDF", "Status", "Actions"]}>
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{r.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.class_level}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.shift}</td>
              <td className="px-4 py-3">{r.pdf_url ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">View</a> : <span className="text-xs text-muted-foreground">—</span>}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{r.is_active ? "Active" : "Inactive"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => togglePub(r)}>{r.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Btn>
                  <Btn variant="ghost" onClick={() => setEditing({ ...r, _grid: normalizeSchedule(r.schedule_data) })}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Routine" : "New Routine"}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title"><Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class Level"><Input required value={editing.class_level ?? ""} onChange={(e) => setEditing({ ...editing, class_level: e.target.value })} placeholder="Class 6" /></Field>
              <Field label="Shift">
                <Select value={editing.shift ?? "সকাল"} onChange={(e) => setEditing({ ...editing, shift: e.target.value })}>
                  <option>সকাল</option><option>দুপুর</option><option>বিকাল</option><option>সন্ধ্যা</option>
                </Select>
              </Field>
            </div>
            <Field label="Schedule (6 days × 4 periods)">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-2 border border-border text-left w-28">দিন / বার</th>
                      {(editing._grid?.slots ?? DEFAULT_SLOTS).map((s, i) => (
                        <th key={i} className="px-1 py-1 border border-border">
                          <Input
                            value={s}
                            onChange={(e) => {
                              const g = { ...(editing._grid ?? normalizeSchedule(null)) };
                              g.slots = [...g.slots]; g.slots[i] = e.target.value;
                              setEditing({ ...editing, _grid: g });
                            }}
                            placeholder={`Subject Box ${i + 1}`}
                            className="text-xs"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROUTINE_DAYS.map((day) => (
                      <tr key={day}>
                        <td className="px-3 py-2 border border-border font-medium bg-muted/30">{day}</td>
                        {[0, 1, 2, 3].map((i) => (
                          <td key={i} className="px-1 py-1 border border-border">
                            <Input
                              value={editing._grid?.grid?.[day]?.[i] ?? ""}
                              onChange={(e) => {
                                const g = { ...(editing._grid ?? normalizeSchedule(null)) };
                                g.grid = { ...g.grid, [day]: [...(g.grid[day] ?? ["", "", "", ""])] };
                                g.grid[day][i] = e.target.value;
                                setEditing({ ...editing, _grid: g });
                              }}
                              placeholder="বিষয়"
                              className="text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Field>
            <Field label="Routine PDF (optional)">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handlePdfUpload(f); }}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-muted/30"
              >
                {editing.pdf_url ? (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <a href={editing.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <FileText className="w-4 h-4" /> View PDF
                    </a>
                    <div className="flex gap-2">
                      <Btn variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />Replace</Btn>
                      <Btn variant="danger" onClick={() => setEditing({ ...editing, pdf_url: null })}><Trash2 className="w-4 h-4" />Remove</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Drag & drop PDF, or</p>
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
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active
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