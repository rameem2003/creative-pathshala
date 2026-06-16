import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { MapPin, Phone, Mail, Send, MessageCircle, Globe } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — Canvas Pathsala" },
      { name: "description", content: "Canvas Pathsala এর সাথে যোগাযোগের ঠিকানা ও তথ্য।" },
    ],
  }),
  component: () => (
    <Layout>
      <Contact />
    </Layout>
  ),
});

function Contact() {
  const [sent, setSent] = useState(false);
  const { data } = useSiteSettings([
    "contact_address",
    "contact_phone",
    "contact_whatsapp",
    "contact_email",
    "google_map_url",
    "website_url",
    "facebook_url",
    "youtube_url",
  ]);
  const v = (k: string) => (data[k]?.v ?? "") as string;
  const address = v("contact_address") || "ঢাকা, বাংলাদেশ";
  const phone = v("contact_phone") || "01603718379";
  const whatsapp = v("contact_whatsapp") || "01845202101";
  const email = v("contact_email") || "anvaspathsalac@gmail.com";
  const website = v("website_url") || "www.creativecanvasit.com";
  const mapSrc = v("google_map_url") || `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const digits = whatsapp.replace(/[^0-9]/g, "");
  const waNumber = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
    ? `880${digits.slice(1)}`
    : `880${digits}`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি Canvas Pathsala সম্পর্কে জানতে চাই।")}`;
  return (
    <div className="container mx-auto px-4 py-16">
      <header className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl">যোগাযোগ করুন</h1>
        <p className="mt-4 text-muted-foreground text-lg">যেকোনো জিজ্ঞাসায় আমরা সব সময় আপনার পাশে।</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-8 mb-10">
        <aside className="lg:col-span-2 space-y-4">
          {[
            { icon: MapPin, title: "ঠিকানা", value: address },
            { icon: Phone, title: "ফোন", value: phone },
            { icon: Mail, title: "ইমেইল", value: email },
            { icon: Globe, title: "ওয়েবসাইট", value: website },
          ].map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl border border-border bg-card">
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1 break-all">{value}</p>
              </div>
            </div>
          ))}

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[oklch(0.65_0.18_150)] text-white font-semibold shadow-[var(--shadow-soft)] hover:opacity-90 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp এ মেসেজ পাঠান
          </a>
        </aside>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="lg:col-span-3 p-7 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] space-y-4"
        >
          <h2 className="text-2xl mb-2">ইনকোয়ারি ফরম</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="শিক্ষার্থীর নাম" name="studentName" />
            <Field label="অভিভাবকের নাম" name="parentName" />
            <Field label="ফোন নম্বর" name="phone" type="tel" />
            <Field label="ক্লাস" name="class" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">মেসেজ</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="আপনার বার্তা লিখুন..."
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-soft)] hover:opacity-90 transition"
          >
            <Send className="w-4 h-4" /> সাবমিট করুন
          </button>
          {sent && (
            <p className="text-center text-sm text-[oklch(0.45_0.18_150)] font-medium">
              ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
            </p>
          )}
        </form>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
        <iframe
          title="Canvas Pathsala location"
          src={mapSrc}
          className="w-full h-80 border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}