"use client";

import React, { useRef, useState } from "react";

/**
 * Shrinks a photo in the browser before upload so large phone images don't
 * bloat the site (the main mobile-speed killer) AND never hit the server's 4 MB
 * cap. Resizes to a max edge and re-encodes as JPEG, then keeps lowering quality
 * (and, if needed, dimensions) until the result is safely under the cap — so an
 * upload always succeeds regardless of the source file size. Leaves SVG/GIF
 * untouched, and keeps a smaller original (e.g. a transparent PNG) as-is.
 */
// Stay comfortably below the /api/admin/upload 4 MB limit.
const SAFE_UPLOAD_BYTES = 3.5 * 1024 * 1024;

async function downscaleImage(file: File, maxEdge = 1200, quality = 0.82): Promise<Blob> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return file;
  try {
    // imageOrientation:'from-image' bakes EXIF rotation in so phone photos
    // don't end up sideways once the orientation tag is dropped.
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    let edge = Math.min(maxEdge, Math.max(bmp.width, bmp.height));
    let q = quality;
    let best: Blob | null = null;
    // Re-encode, then progressively lower quality (down to 0.6) and finally the
    // dimensions until the JPEG fits under the safe cap. Bounded to 6 tries.
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(1, edge / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q));
      if (!blob) break;
      best = blob;
      if (blob.size <= SAFE_UPLOAD_BYTES) break;
      if (q > 0.6) q = Math.max(0.6, q - 0.12);
      else edge = Math.round(edge * 0.8);
    }
    bmp.close?.();
    if (!best) return file;
    // Keep the original only when it's already small enough AND not larger than
    // our re-encode — preserves an intentionally-uploaded transparent PNG. If the
    // original is over the cap, always use the shrunk JPEG so the upload succeeds.
    if (file.size <= SAFE_UPLOAD_BYTES && file.size <= best.size) return file;
    return best;
  } catch {
    return file;
  }
}

/* ── primitive styles ─────────────────────────────────────────────── */

const inputClass =
  "w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst";

const labelClass =
  "mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash";

export function Label({ children }: { children: React.ReactNode }) {
  return <span className={labelClass}>{children}</span>;
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <input
        type={type}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <textarea
        className={`${inputClass} resize-y`}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** EN + LO inputs side by side, bound to a {en, lo} object. */
export function BilingualField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { en: string; lo: string };
  onChange: (v: { en: string; lo: string }) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputClass}
          placeholder="EN"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="ລາວ"
          value={value.lo}
          onChange={(e) => onChange({ ...value, lo: e.target.value })}
        />
      </div>
    </div>
  );
}

/* ── buttons ──────────────────────────────────────────────────────── */

export function Button({
  children,
  onClick,
  variant = "ghost",
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void | Promise<unknown>;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "border-amethyst bg-amethyst/15 text-soul hover:bg-amethyst/25 shadow-[0_0_16px_rgba(168,85,247,0.3)]",
    ghost: "border-edge bg-crypt text-ash hover:border-edge-bright hover:text-soul",
    danger: "border-loss/50 bg-loss/10 text-loss hover:bg-loss/20",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 border px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/* ── image upload field ───────────────────────────────────────────── */

export function ImageField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value?: string;
  /** Upload target subfolder in the public Supabase uploads bucket. */
  folder: "teams" | "players" | "staff" | "sponsors" | "shop" | "gallery" | "achievements";
  onChange: (path: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    try {
      const blob = await downscaleImage(file);
      // Raster images are always shrunk under the cap above; only a file we can't
      // re-encode (e.g. a huge GIF/SVG) can still be too big — tell the owner in
      // plain Thai instead of letting the server return an English 413.
      if (blob.size > 4 * 1024 * 1024) {
        setErr("ไฟล์ใหญ่เกิน 4 MB และย่ออัตโนมัติไม่ได้ (เช่น GIF/SVG) — กรุณาใช้รูป JPEG หรือ PNG");
        setBusy(false);
        return;
      }
      const isJpeg = blob !== file && blob.type === "image/jpeg";
      const name = isJpeg ? file.name.replace(/\.[^.]+$/, "") + ".jpg" : file.name;
      const fd = new FormData();
      fd.append("folder", folder);
      fd.append("file", blob, name);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "อัปโหลดไม่สำเร็จ");
      onChange(json.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-edge bg-void/60">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="font-mono text-[9px] text-ash-dim">—</span>
          )}
        </div>
        <div className="min-w-0">
          <input
            ref={ref}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => ref.current?.click()} disabled={busy}>
              {busy ? "กำลังอัป…" : value ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
            </Button>
            {value && (
              <Button variant="danger" onClick={() => onChange("")}>
                ลบรูป
              </Button>
            )}
          </div>
          {value && <p className="mt-1 truncate font-mono text-[10px] text-ash-dim">{value}</p>}
          {err && <p className="mt-1 font-mono text-[10px] text-loss">{err}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── small layout helpers ─────────────────────────────────────────── */

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-edge bg-crypt p-4 md:p-5 ${className}`}>{children}</div>;
}

/**
 * A titled block — the building unit that keeps each editor in clearly separated
 * sections. Optional `hint` is one short line; `action` sits on the right (e.g.
 * an "+ add" button).
 */
export function Section({
  title,
  hint,
  action,
  defaultOpen = false,
  collapsible = true,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!collapsible) {
    return (
      <section>
        <div className="mb-3 flex items-end justify-between gap-3 border-b border-edge pb-2">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-soul">{title}</h2>
            {hint && <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-ash">{hint}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="border border-edge bg-crypt/35">
      <div className="flex items-stretch justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-crypt"
        >
          <span className="min-w-0">
            <span className="block font-display text-base font-bold uppercase tracking-wide text-soul">{title}</span>
            {hint && <span className="mt-0.5 block font-mono text-[11px] leading-relaxed text-ash">{hint}</span>}
          </span>
          <span
            aria-hidden
            className={`shrink-0 font-mono text-lg leading-none text-amethyst transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            v
          </span>
        </button>
        {action && <div className="flex shrink-0 items-center pr-3">{action}</div>}
      </div>
      {open && <div className="border-t border-edge p-4 md:p-5">{children}</div>}
    </section>
  );
}

/**
 * Collapsible block for settings that are edited rarely (page copy, labels) so
 * they don't bury the day-to-day content. Collapsed by default.
 */
export function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-edge bg-crypt/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-crypt"
      >
        <span className="min-w-0">
          <span className="block font-display text-sm font-bold uppercase tracking-wide text-soul">{title}</span>
          {hint && <span className="mt-0.5 block font-mono text-[11px] text-ash">{hint}</span>}
        </span>
        <span
          aria-hidden
          className={`shrink-0 font-mono text-lg leading-none text-amethyst transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>
      {open && <div className="border-t border-edge p-4 md:p-5">{children}</div>}
    </section>
  );
}
