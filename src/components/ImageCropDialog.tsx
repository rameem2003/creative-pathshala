import { useCallback, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, X, Check, Loader2 } from "lucide-react";

type Aspect = { label: string; value: number | undefined };

const DEFAULT_ASPECTS: Aspect[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
];

export type CropOptions = {
  aspects?: Aspect[];
  defaultAspect?: number;
  maxWidth?: number; // resize output to fit within this width
  mimeType?: string; // output mime; defaults to image/jpeg
  quality?: number; // 0..1 for jpeg/webp
};

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

async function getCroppedFile(
  file: File,
  area: Area,
  opts: CropOptions,
): Promise<File> {
  const img = await readImage(file);
  let w = Math.round(area.width);
  let h = Math.round(area.height);
  const maxW = opts.maxWidth ?? 1920;
  if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);
  const mime = opts.mimeType ?? (file.type === "image/png" ? "image/png" : "image/jpeg");
  const quality = opts.quality ?? 0.9;
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mime, quality));
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: mime });
}

function Dialog({
  file, options, onDone,
}: { file: File; options: CropOptions; onDone: (f: File | null) => void }) {
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const aspects = options.aspects ?? DEFAULT_ASPECTS;
  const [aspect, setAspect] = useState<number | undefined>(options.defaultAspect ?? aspects[1]?.value);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const f = await getCroppedFile(file, area, options);
      onDone(f);
    } catch {
      onDone(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => !busy && onDone(null)}>
      <div className="w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 font-semibold"><Crop className="w-4 h-4" />ছবি ক্রপ ও রিসাইজ করুন</div>
          <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => onDone(null)} disabled={busy}><X className="w-4 h-4" /></button>
        </div>

        <div className="relative bg-muted" style={{ height: 420 }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
              restrictPosition={false}
            />
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Aspect:</span>
            {aspects.map((a) => (
              <button key={a.label}
                onClick={() => setAspect(a.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${aspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-primary" />
            <span className="text-xs tabular-nums w-10 text-right">{zoom.toFixed(2)}x</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => onDone(null)} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted">বাতিল</button>
            <button onClick={confirm} disabled={busy || !area} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} প্রয়োগ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

let _root: Root | null = null;
let _el: HTMLDivElement | null = null;

export function cropImage(file: File, options: CropOptions = {}): Promise<File | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    // SVGs: bypass cropping (vector — no meaningful raster crop).
    if (file.type === "image/svg+xml") { resolve(file); return; }
    if (!_el) {
      _el = document.createElement("div");
      document.body.appendChild(_el);
      _root = createRoot(_el);
    }
    const done = (f: File | null) => {
      _root?.render(<></>);
      resolve(f);
    };
    _root!.render(<Dialog file={file} options={options} onDone={done} />);
  });
}