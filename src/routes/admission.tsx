import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, ListChecks, Phone, Mail, MapPin, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "ভর্তি তথ্য — Canvas Pathsala" },
      { name: "description", content: "ভর্তি প্রক্রিয়া, প্রয়োজনীয় কাগজপত্র ও অনলাইন আবেদন ফরম।" },
    ],
  }),
  component: () => (<Layout><Admission /></Layout>),
});

const CLASS_OPTIONS = ["Play Group", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "SSC", "HSC", "Diploma"];

function Admission() {
  const [form, setForm] = useState({ student_name: "", parent_name: "", phone: "", email: "", class_applying: CLASS_OPTIONS[0], address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    const { error } = await supabase.from("admissions").insert({
      student_name: form.student_name.trim(),
      parent_name: form.parent_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      class_applying: form.class_applying,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl">ভর্তি তথ্য</h1>
        <p className="mt-4 text-muted-foreground text-lg">সহজ ধাপে ভর্তি প্রক্রিয়া সম্পন্ন করুন।</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <article className="p-7 rounded-2xl border border-border bg-card">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground mb-4"><ListChecks className="w-6 h-6" /></div>
          <h2 className="text-2xl mb-4">ভর্তি প্রক্রিয়া</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {["নিচের অনলাইন ফরমটি পূরণ করুন।", "আমরা ফোনে যোগাযোগ করে বিস্তারিত জানাব।", "ক্লাস ও বিষয় নির্ধারণ করে ভর্তি ফি জমা দিন।", "প্রয়োজনীয় কাগজপত্র জমা দিয়ে ক্লাস শুরু করুন।"].map((step, i) => (
              <li key={i} className="flex gap-3"><span className="grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span><span>{step}</span></li>
            ))}
          </ol>
        </article>
        <article className="p-7 rounded-2xl border border-border bg-card">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground mb-4"><FileCheck className="w-6 h-6" /></div>
          <h2 className="text-2xl mb-4">প্রয়োজনীয় কাগজপত্র</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {["শিক্ষার্থীর ১ কপি পাসপোর্ট সাইজ ছবি", "শিক্ষার্থীর নাম", "পিতার নাম", "কোন Subject এ শিক্ষার্থী দুর্বল তা উল্লেখ করতে হবে"].map((d) => (
              <li key={d} className="flex items-start gap-3"><span className="grid place-items-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">✓</span><span>{d}</span></li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Phone, label: "ফোন", value: "01603718379" },
          { icon: Mail, label: "ইমেইল", value: "creativecanvasit@gmail.com" },
          { icon: MapPin, label: "ঠিকানা", value: "West Nakhalpara, Tejgaon, Dhaka 1215" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-5 rounded-2xl border border-border bg-card flex gap-3">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-accent text-primary shrink-0"><Icon className="w-5 h-5" /></div>
            <div><p className="font-semibold">{label}</p><p className="text-sm text-muted-foreground mt-0.5 break-all">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="p-5 border-b border-border">
          <h2 className="text-xl">অনলাইন ভর্তি ফরম</h2>
          <p className="text-sm text-muted-foreground mt-1">নিচের ফরমটি পূরণ করে জমা দিন। আমরা শীঘ্রই যোগাযোগ করব।</p>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">আবেদন সফলভাবে জমা হয়েছে!</h3>
            <p className="text-muted-foreground mt-2">ধন্যবাদ। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>
            <button onClick={() => { setDone(false); setForm({ ...form, student_name: "", parent_name: "", phone: "", email: "", address: "", notes: "" }); }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
              আরেকটি আবেদন
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 grid sm:grid-cols-2 gap-4">
            <FormField label="শিক্ষার্থীর নাম *"><input required minLength={2} maxLength={100} value={form.student_name} onChange={update("student_name")} className={inputCls} /></FormField>
            <FormField label="অভিভাবকের নাম *"><input required minLength={2} maxLength={100} value={form.parent_name} onChange={update("parent_name")} className={inputCls} /></FormField>
            <FormField label="মোবাইল নম্বর *"><input required minLength={6} maxLength={20} value={form.phone} onChange={update("phone")} className={inputCls} placeholder="01XXXXXXXXX" /></FormField>
            <FormField label="ইমেইল"><input type="email" value={form.email} onChange={update("email")} className={inputCls} /></FormField>
            <FormField label="শ্রেণি *"><select required value={form.class_applying} onChange={update("class_applying")} className={inputCls}>{CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="ঠিকানা"><input value={form.address} onChange={update("address")} className={inputCls} /></FormField>
            <div className="sm:col-span-2">
              <FormField label="অতিরিক্ত তথ্য / দুর্বল বিষয়"><textarea value={form.notes} onChange={update("notes")} className={`${inputCls} min-h-[100px]`} /></FormField>
            </div>
            {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} আবেদন জমা দিন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:border-primary outline-none transition";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}