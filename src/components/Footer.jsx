import { Link } from "@tanstack/react-router";
import { Facebook, Youtube, MessageCircle, MapPin, Phone, Mail, Globe } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  const { data } = useSiteSettings([
    "site_name",
    "site_tagline",
    "contact_address",
    "contact_phone",
    "contact_whatsapp",
    "contact_email",
    "facebook_url",
    "youtube_url",
    "website_url",
    "footer_description",
    "footer_copyright",
  ]);
  const v = (k) => data[k]?.v ?? "";
  const siteName = v("site_name") || "Canvas Pathsala";
  const tagline = v("site_tagline") || "স্মার্ট শিক্ষাই সুন্দর ভবিষ্যৎ";
  const address = v("contact_address") || "ঢাকা, বাংলাদেশ";
  const phone = v("contact_phone") || "01603718379";
  const _digits = (v("contact_whatsapp") || "01845202101").replace(/[^0-9]/g, "");
  const whatsapp = _digits.startsWith("880")
    ? _digits
    : _digits.startsWith("0")
    ? `880${_digits.slice(1)}`
    : `880${_digits}`;
  const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি Canvas Pathsala সম্পর্কে জানতে চাই।")}`;
  const email = v("contact_email") || "anvaspathsalac@gmail.com";
  const facebook = v("facebook_url") || "#";
  const youtube = v("youtube_url") || "#";
  const website = v("website_url") || "https://www.creativecanvasit.com";
  const description = v("footer_description") || `${siteName} – Play Group থেকে Class 8 পর্যন্ত শিক্ষার্থীদের জন্য একটি বিশ্বস্ত একাডেমিক কোচিং প্রতিষ্ঠান।`;
  const copyright = v("footer_copyright") || `© ২০২৬ ${siteName}। সর্বস্বত্ব সংরক্ষিত।`;
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BrandLogo className="w-9 h-9" iconClassName="w-5 h-5" alt={siteName} />
            {siteName}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground italic">
            "{tagline}"
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-md whitespace-pre-line">
            {description}
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">কুইক লিংক</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/courses" className="hover:text-primary">কোর্সসমূহ</Link></li>
            <li><Link to="/notice" className="hover:text-primary">নোটিশ ও রুটিন</Link></li>
            <li><Link to="/contact" className="hover:text-primary">যোগাযোগ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">যোগাযোগ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {address}</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5" /> {phone}</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5" /><a href={`mailto:${email}`} className="hover:text-primary break-all">{email}</a></li>
            <li className="flex gap-2"><Globe className="w-4 h-4 mt-0.5" /><a href={website} target="_blank" rel="noreferrer" className="hover:text-primary break-all">{website.replace(/^https?:\/\//, "")}</a></li>
          </ul>
          <div className="flex gap-3 mt-4">
            <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-card border border-border hover:text-primary"><Facebook className="w-4 h-4" /></a>
            <a href={youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="p-2 rounded-lg bg-card border border-border hover:text-primary"><Youtube className="w-4 h-4" /></a>
            <a href={waUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 rounded-lg bg-card border border-border hover:text-primary"><MessageCircle className="w-4 h-4" /></a>
            <a href={website} target="_blank" rel="noreferrer" aria-label="Website" className="p-2 rounded-lg bg-card border border-border hover:text-primary"><Globe className="w-4 h-4" /></a>
            <a href={`mailto:${email}`} aria-label="Email" className="p-2 rounded-lg bg-card border border-border hover:text-primary"><Mail className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          {copyright}
        </p>
      </div>
    </footer>
  );
}