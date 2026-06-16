import { useSiteSettings } from "@/hooks/useSiteSettings";
import { GraduationCap } from "lucide-react";

// Renders the site logo from site_settings (key: site_logo_url).
// Falls back to the GraduationCap icon inside a gradient tile.
export function BrandLogo({ className = "w-9 h-9", iconClassName = "w-5 h-5", alt = "Logo" }) {
  const { data } = useSiteSettings(["site_logo_url"]);
  const url = (data["site_logo_url"]?.v ?? "");

  if (url) {
    return (
      <span className={`grid place-items-center overflow-hidden rounded-xl bg-transparent ${className}`}>
        <img src={url} alt={alt} className="w-full h-full object-contain" />
      </span>
    );
  }
  return (
    <span className={`grid place-items-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-soft)] ${className}`}>
      <GraduationCap className={iconClassName} />
    </span>
  );
}

// Updates <link rel="icon"> when site_favicon_url changes.
export function FaviconSync() {
  const { data } = useSiteSettings(["site_favicon_url"]);
  const url = (data["site_favicon_url"]?.v ?? "");
  if (typeof document !== "undefined" && url) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (link.href !== url) link.href = url;
  }
  return null;
}