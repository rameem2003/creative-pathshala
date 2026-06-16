import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, Field, Input, LoadingRow, PageHeader, Textarea } from "@/components/admin/AdminUI";
import { Save, Upload, Trash2, Loader2 } from "lucide-react";
import { cropImage } from "@/components/ImageCropDialog";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

const KEYS = [
  { key: "site_name", label: "Site Name", type: "text" },
  { key: "site_tagline", label: "Tagline", type: "text" },
  { key: "contact_phone", label: "Contact Phone", type: "text" },
  { key: "contact_whatsapp", label: "WhatsApp Number", type: "text" },
  { key: "contact_email", label: "Contact Email", type: "text" },
  { key: "contact_address", label: "Address", type: "textarea" },
  { key: "google_map_url", label: "Google Map Embed URL", type: "textarea" },
  { key: "facebook_url", label: "Facebook URL", type: "text" },
  { key: "youtube_url", label: "YouTube URL", type: "text" },
  { key: "website_url", label: "Website URL", type: "text" },
  { key: "footer_description", label: "Footer Description", type: "textarea" },
  { key: "footer_copyright", label: "Footer Copyright Text", type: "text" },
];

const ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml,image/webp";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function saveSetting(key: string, value: any) {
  const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
  if (existing) await supabase.from("site_settings").update({ value }).eq("id", existing.id);
  else await supabase.from("site_settings").insert({ key, value });
}

function LogoUploader({
  label, settingKey, currentUrl, onChange,
}: { label: string; settingKey: string; currentUrl: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErr(null);
    if (!file.type.match(/^image\/(png|jpe?g|svg\+xml|webp)$/)) {
      setErr("শুধুমাত্র PNG, JPG, SVG বা WEBP সাপোর্ট করে।"); return;
    }
    if (file.size > MAX_SIZE) { setErr("ফাইলের সর্বোচ্চ সাইজ ৫ MB।"); return; }
    const isFavicon = settingKey === "site_favicon_url";
    const cropped = await cropImage(file, {
      defaultAspect: 1,
      maxWidth: isFavicon ? 256 : 512,
    });
    if (!cropped) return;
    setUploading(true);
    const ext = cropped.name.split(".").pop() || "png";
    const path = `branding/${settingKey}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, cropped, { cacheControl: "3600", upsert: false, contentType: cropped.type });
    if (error) { setErr(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    await saveSetting(settingKey, { v: data.publicUrl });
    onChange(data.publicUrl);
    setUploading(false);
  };

  const remove = async () => {
    if (!confirm("লোগো মুছে ফেলবেন?")) return;
    await saveSetting(settingKey, { v: "" });
    onChange("");
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">PNG / JPG / SVG / WEBP — সর্বোচ্চ ৫ MB</p>
        </div>
        {currentUrl && (
          <Btn variant="danger" onClick={remove}><Trash2 className="w-4 h-4" />Remove</Btn>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0]; if (f) upload(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
      >
        {currentUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 grid place-items-center rounded-xl bg-muted overflow-hidden">
              <img src={currentUrl} alt={label} className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-muted-foreground">নতুন ছবি ড্রপ করুন বা ক্লিক করে বদলান</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "ছবি ড্রপ করুন বা ক্লিক করুন"}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
      {err && <p className="text-sm text-destructive mt-2">{err}</p>}
      {currentUrl && (
        <div className="mt-3">
          <Field label="Direct URL"><Input readOnly value={currentUrl} /></Field>
        </div>
      )}
    </Card>
  );
}

function SettingsAdmin() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => { map[r.key] = (r.value as { v?: string })?.v ?? ""; });
      setValues(map);
      setLogoUrl(map["site_logo_url"] ?? "");
      setFaviconUrl(map["site_favicon_url"] ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    for (const { key } of KEYS) {
      await saveSetting(key, { v: values[key] ?? "" });
    }
    setSaving(false); setMsg("সংরক্ষিত হয়েছে ✓");
    setTimeout(() => setMsg(null), 2500);
  };

  if (loading) return <LoadingRow />;

  return (
    <div>
      <PageHeader title="Site Settings" subtitle="সাইটের গ্লোবাল সেটিংস" action={
        <Btn onClick={save} disabled={saving}><Save className="w-4 h-4" />{saving ? "Saving..." : "Save All"}</Btn>
      } />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <LogoUploader label="Website Logo" settingKey="site_logo_url" currentUrl={logoUrl} onChange={setLogoUrl} />
        <LogoUploader label="Favicon" settingKey="site_favicon_url" currentUrl={faviconUrl} onChange={setFaviconUrl} />
      </div>

      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          {KEYS.map(({ key, label, type }) => (
            <div key={key} className={type === "textarea" ? "md:col-span-2" : ""}>
              <Field label={label}>
                {type === "textarea"
                  ? <Textarea value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  : <Input value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />}
              </Field>
            </div>
          ))}
        </div>
        {msg && <p className="text-sm text-emerald-600 mt-4">{msg}</p>}
      </Card>
    </div>
  );
}