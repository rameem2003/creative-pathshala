import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye } from "lucide-react";
import { Btn, Card, DataTable, EmptyState, Field, LoadingRow, Modal, PageHeader, Select, Textarea } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/admissions")({ component: AdmissionsAdmin });

type A = { id: string; student_name: string; parent_name: string; phone: string; email: string | null; class_applying: string; address: string | null; notes: string | null; admin_notes: string | null; status: string; created_at: string };

function AdmissionsAdmin() {
  const [items, setItems] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<A | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("admissions").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as never);
    const { data } = await q;
    setItems((data as A[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string, admin_notes?: string) => {
    await supabase.from("admissions").update({ status: status as never, ...(admin_notes !== undefined ? { admin_notes } : {}) }).eq("id", id);
    setViewing(null); load();
  };
  const remove = async (id: string) => { if (confirm("আবেদনটি মুছবেন?")) { await supabase.from("admissions").delete().eq("id", id); load(); } };

  return (
    <div>
      <PageHeader title="Admissions" subtitle="ভর্তির আবেদন পরিচালনা"
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
            <option value="all">সব</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        } />
      {loading ? <LoadingRow /> : items.length === 0 ? <Card><EmptyState>কোনো আবেদন নেই।</EmptyState></Card> : (
        <DataTable headers={["Student", "Class", "Parent", "Phone", "Status", "Date", "Actions"]}>
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{a.student_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.class_applying}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.parent_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.phone}</td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => setViewing(a)}><Eye className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="ভর্তির বিস্তারিত">
        {viewing && (
          <div className="space-y-3 text-sm">
            <Row k="শিক্ষার্থী" v={viewing.student_name} />
            <Row k="অভিভাবক" v={viewing.parent_name} />
            <Row k="ফোন" v={viewing.phone} />
            <Row k="ইমেইল" v={viewing.email ?? "—"} />
            <Row k="শ্রেণি" v={viewing.class_applying} />
            <Row k="ঠিকানা" v={viewing.address ?? "—"} />
            <Row k="মন্তব্য" v={viewing.notes ?? "—"} />
            <Field label="Admin Note">
              <Textarea defaultValue={viewing.admin_notes ?? ""} id="adm-note" />
            </Field>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              <Btn onClick={() => { const n = (document.getElementById("adm-note") as HTMLTextAreaElement)?.value; updateStatus(viewing.id, "approved", n); }}>Approve</Btn>
              <Btn variant="danger" onClick={() => { const n = (document.getElementById("adm-note") as HTMLTextAreaElement)?.value; updateStatus(viewing.id, "rejected", n); }}>Reject</Btn>
              <Btn variant="outline" onClick={() => { const n = (document.getElementById("adm-note") as HTMLTextAreaElement)?.value; updateStatus(viewing.id, "pending", n); }}>Mark Pending</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-3"><span className="w-24 text-muted-foreground">{k}:</span><span className="font-medium break-all">{v}</span></div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}