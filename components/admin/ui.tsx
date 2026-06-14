"use client";

import React, { useRef, useState } from "react";

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
  onClick?: () => void;
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
  /** Upload target subfolder under /public (e.g. "teams" or "players"). */
  folder: "teams" | "players";
  onChange: (path: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("folder", folder);
      fd.append("file", file);
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
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
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
