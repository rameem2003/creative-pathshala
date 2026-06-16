import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Home, Info, BookOpen, Megaphone, CalendarDays, FileText, Video, Image as ImageIcon, Phone, Award } from "lucide-react";
import { PageHeader, Card, Btn } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/preview")({ component: PreviewPage });

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { id: Device; label: string; icon: typeof Monitor; w: number; h: number }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, w: 1440, h: 900 },
  { id: "tablet", label: "Tablet", icon: Tablet, w: 820, h: 1180 },
  { id: "mobile", label: "Mobile", icon: Smartphone, w: 390, h: 844 },
];

const PAGES = [
  { path: "/", label: "Home", icon: Home },
  { path: "/about", label: "About", icon: Info },
  { path: "/courses", label: "Courses", icon: BookOpen },
  { path: "/notice", label: "Notices", icon: Megaphone },
  { path: "/admission", label: "Admission", icon: CalendarDays },
  { path: "/video-blog", label: "Blog & Video", icon: Video },
  { path: "/contact", label: "Contact", icon: Phone },
];

function PreviewPage() {
  const [device, setDevice] = useState<Device>("desktop");
  const [page, setPage] = useState<string>("/");
  const [nonce, setNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const d = DEVICES.find((x) => x.id === device)!;
  const src = `${page}${page.includes("?") ? "&" : "?"}_preview=${nonce}`;

  const refresh = () => setNonce((n) => n + 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Live Website Preview"
        subtitle="যেকোনো পরিবর্তন সরাসরি Website-এ Live হয়ে যাচ্ছে — এখান থেকে Desktop / Tablet / Mobile View Check করুন"
        action={
          <div className="flex gap-2">
            <Btn variant="outline" onClick={refresh}><RefreshCw className="w-4 h-4" />Refresh</Btn>
            <a href={page} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">
              <ExternalLink className="w-4 h-4" />Open in New Tab
            </a>
          </div>
        }
      />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Page picker */}
          <div className="flex flex-wrap gap-1.5">
            {PAGES.map((p) => (
              <button
                key={p.path}
                onClick={() => setPage(p.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  page === p.path ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70 text-foreground"
                }`}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Device switcher */}
          <div className="inline-flex rounded-lg border border-border bg-background p-1">
            {DEVICES.map((x) => (
              <button
                key={x.id}
                onClick={() => setDevice(x.id)}
                title={`${x.label} (${x.w}×${x.h})`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  device === x.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <x.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{x.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Preview frame */}
      <div className="rounded-2xl border border-border bg-[#0b0b0f] p-4 lg:p-6 grid place-items-center overflow-auto">
        <div
          className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border transition-all"
          style={{ width: `min(100%, ${d.w}px)`, maxWidth: "100%" }}
        >
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-[11px] text-muted-foreground truncate">{page} · {d.w}×{d.h}</span>
          </div>
          <iframe
            ref={iframeRef}
            key={`${device}-${nonce}`}
            src={src}
            title="Website Preview"
            className="w-full bg-white"
            style={{ height: `${d.h}px`, maxHeight: "75vh" }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 Tip: অন্য Tab-এ Content edit করার পরে Save করলে এখানে Refresh চাপুন — সব পরিবর্তন তখনই Live হয়।
      </p>
    </div>
  );
}