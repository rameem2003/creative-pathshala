import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  PageHeader, Card, Btn, Field, Input, Select, Modal, EmptyState, LoadingRow, DataTable,
} from "@/components/admin/AdminUI";
import { useAdminRole, type AppRole } from "@/hooks/useAdminRole";
import {
  listAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword,
} from "@/lib/admins.functions";
import { supabase } from "@/integrations/supabase/client";
import { cropImage } from "@/components/ImageCropDialog";
import { Plus, Pencil, Trash2, KeyRound, Search, Upload, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admin Management — Canvas Pathsala" }, { name: "robots", content: "noindex" }] }),
  component: AdminsPage,
});

type AdminRow = {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  role: string;
  last_sign_in_at: string | null;
  created_at: string | null;
};

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "content_manager", label: "Content Manager" },
  { value: "routine_manager", label: "Notice Manager" },
  { value: "blog_manager", label: "Blog Manager" },
  { value: "gallery_manager", label: "Gallery Manager" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    super_admin: "bg-primary/15 text-primary border-primary/30",
    content_manager: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    routine_manager: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    blog_manager: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    gallery_manager: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  };
  return map[role] ?? "bg-muted text-foreground border-border";
};

async function uploadAvatar(file: File): Promise<string | null> {
  const cropped = await cropImage(file, { defaultAspect: 1, maxWidth: 512 });
  if (!cropped) return null;
  const ext = cropped.name.split(".").pop() ?? "jpg";
  const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, cropped, { upsert: true, contentType: cropped.type });
  if (error) { alert("Upload failed: " + error.message); return null; }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

function AdminsPage() {
  const { isSuper, loading: roleLoading } = useAdminRole();
  const list = useServerFn(listAdmins);
  const create = useServerFn(createAdmin);
  const update = useServerFn(updateAdmin);
  const remove = useServerFn(deleteAdmin);
  const resetPw = useServerFn(resetAdminPassword);

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<AdminRow | null>(null);
  const [pwRow, setPwRow] = useState<AdminRow | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await list();
      setRows(res.admins as AdminRow[]);
    } catch (e: any) {
      alert(e?.message ?? "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isSuper) refresh(); /* eslint-disable-next-line */ }, [isSuper]);

  if (roleLoading) return <LoadingRow />;
  if (!isSuper) {
    return (
      <Card>
        <EmptyState>
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold text-foreground">Forbidden</p>
          <p>শুধুমাত্র Super Admin এই page access করতে পারেন।</p>
        </EmptyState>
      </Card>
    );
  }

  const filtered = rows.filter((r) => {
    if (filterRole !== "all" && r.role !== filterRole) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Admin Management"
        subtitle="নতুন Admin তৈরি করুন, role assign করুন, এবং access নিয়ন্ত্রণ করুন।"
        action={<Btn onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Admin</Btn>}
      />

      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Name বা email দিয়ে search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="max-w-[220px]">
            <option value="all">সব Role</option>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>
      </Card>

      {loading ? <LoadingRow /> : filtered.length === 0 ? (
        <Card><EmptyState>কোনো admin পাওয়া যায়নি।</EmptyState></Card>
      ) : (
        <DataTable headers={["Admin", "Role", "Status", "Last sign-in", "Actions"]}>
          {filtered.map((r) => (
            <tr key={r.user_id} className="hover:bg-muted/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.full_name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-bold">
                      {(r.full_name || r.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{r.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${roleBadge(r.role)}`}>
                  {ROLE_LABEL[r.role] ?? r.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${r.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/15 text-destructive"}`}>
                  {r.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleString() : "কখনোই না"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Btn variant="ghost" onClick={() => setEditRow(r)}><Pencil className="w-4 h-4" /></Btn>
                  <Btn variant="ghost" onClick={() => setPwRow(r)}><KeyRound className="w-4 h-4" /></Btn>
                  <Btn variant="danger" onClick={async () => {
                    if (!confirm(`${r.full_name || r.email} কে delete করবেন?`)) return;
                    try { await remove({ data: { user_id: r.user_id } }); await refresh(); }
                    catch (e: any) { alert(e?.message); }
                  }}><Trash2 className="w-4 h-4" /></Btn>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <AddAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={async (payload) => {
          await create({ data: payload });
          setAddOpen(false);
          refresh();
        }}
      />

      <EditAdminModal
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={async (payload) => {
          await update({ data: payload });
          setEditRow(null);
          refresh();
        }}
      />

      <ResetPwModal
        row={pwRow}
        onClose={() => setPwRow(null)}
        onReset={async (new_password) => {
          await resetPw({ data: { user_id: pwRow!.user_id, new_password } });
          setPwRow(null);
          alert("Password reset হয়েছে।");
        }}
      />
    </div>
  );
}

function AddAdminModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void;
  onCreate: (p: { email: string; password: string; full_name: string; role: AppRole; avatar_url?: string | null }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("content_manager");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setEmail(""); setPassword(""); setFullName(""); setRole("content_manager"); setAvatar(null); }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Add new Admin">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted grid place-items-center">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-muted-foreground text-xs">No photo</span>}
          </div>
          <Btn variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Upload photo</Btn>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const url = await uploadAvatar(f); if (url) setAvatar(url);
            e.target.value = "";
          }} />
        </div>
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Password (min 8 characters)"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !email || !password || !fullName} onClick={async () => {
            setBusy(true);
            try { await onCreate({ email, password, full_name: fullName, role, avatar_url: avatar }); }
            catch (e: any) { alert(e?.message ?? "Failed"); }
            finally { setBusy(false); }
          }}>Create Admin</Btn>
        </div>
      </div>
    </Modal>
  );
}

function EditAdminModal({ row, onClose, onSave }: {
  row: AdminRow | null; onClose: () => void;
  onSave: (p: { user_id: string; full_name?: string; role?: AppRole; is_active?: boolean; avatar_url?: string | null }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("content_manager");
  const [active, setActive] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (row) {
      setFullName(row.full_name);
      setRole((row.role as AppRole) || "content_manager");
      setActive(row.is_active);
      setAvatar(row.avatar_url);
    }
  }, [row]);

  if (!row) return null;
  return (
    <Modal open={!!row} onClose={onClose} title={`Edit · ${row.email}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted grid place-items-center">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-muted-foreground text-xs">No photo</span>}
          </div>
          <Btn variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Change photo</Btn>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const url = await uploadAvatar(f); if (url) setAvatar(url);
            e.target.value = "";
          }} />
        </div>
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border" />
          Active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy} onClick={async () => {
            setBusy(true);
            try { await onSave({ user_id: row.user_id, full_name: fullName, role, is_active: active, avatar_url: avatar }); }
            catch (e: any) { alert(e?.message ?? "Failed"); }
            finally { setBusy(false); }
          }}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ResetPwModal({ row, onClose, onReset }: {
  row: AdminRow | null; onClose: () => void; onReset: (pw: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (row) setPw(""); }, [row]);
  if (!row) return null;
  return (
    <Modal open={!!row} onClose={onClose} title={`Reset password · ${row.email}`}>
      <div className="space-y-4">
        <Field label="New password (min 8 characters)">
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || pw.length < 8} onClick={async () => {
            setBusy(true);
            try { await onReset(pw); }
            catch (e: any) { alert(e?.message ?? "Failed"); }
            finally { setBusy(false); }
          }}>Reset password</Btn>
        </div>
      </div>
    </Modal>
  );
}