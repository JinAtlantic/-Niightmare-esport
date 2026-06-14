"use client";

import React, { useRef, useState } from "react";
import { Label, Button } from "@/components/admin/ui";

export interface PhotoCrop {
  zoom: number;
  x: number;
  y: number;
}

export const DEFAULT_CROP: PhotoCrop = { zoom: 1, x: 50, y: 50 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Lets the admin frame a player photo: drag inside the 3:4 preview to pan the
 * focal point, and type a zoom %. The preview matches the live card crop.
 *
 * Mount this with `key={src}` so the local zoom text resets per photo.
 */
export default function PhotoCropEditor({
  src,
  crop,
  onChange,
}: {
  src: string;
  crop?: PhotoCrop;
  onChange: (c: PhotoCrop) => void;
}) {
  const c = { ...DEFAULT_CROP, ...crop };
  // The zoom field keeps its own text so multi-digit typing isn't fought by
  // the clamped round-trip; the committed scale is clamped to 100–500%.
  const [zoomText, setZoomText] = useState(String(Math.round(c.zoom * 100)));
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  function commitZoom(raw: string) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    onChange({ ...c, zoom: clamp(n / 100, 1, 5) });
  }

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    onChange({
      ...c,
      x: Math.round(clamp(c.x - (dx / rect.width) * 100, 0, 100)),
      y: Math.round(clamp(c.y - (dy / rect.height) * 100, 0, 100)),
    });
  }
  function endDrag() {
    drag.current = null;
  }

  const imgStyle = {
    objectPosition: `${c.x}% ${c.y}%`,
    transform: `scale(${c.zoom})`,
    transformOrigin: `${c.x}% ${c.y}%`,
  } as React.CSSProperties;

  return (
    <div>
      <Label>ปรับรูป — ลากในกรอบเพื่อเลื่อนตำแหน่ง · พิมพ์ขนาด (ซูม %)</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="relative aspect-[3/4] w-28 shrink-0 cursor-move touch-none select-none overflow-hidden border border-edge bg-void/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={imgStyle}
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 border border-amethyst/30" />
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
              ขนาด (ซูม %)
            </span>
            <input
              type="number"
              min={100}
              max={500}
              step={5}
              value={zoomText}
              onChange={(e) => {
                setZoomText(e.target.value);
                commitZoom(e.target.value);
              }}
              onBlur={() => {
                const n = clamp((Number(zoomText) || 100) / 100, 1, 5);
                setZoomText(String(Math.round(n * 100)));
              }}
              className="w-28 border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none focus:border-amethyst"
            />
          </label>
          <p className="font-mono text-[10px] text-ash-dim">
            ตำแหน่ง X {Math.round(c.x)}% · Y {Math.round(c.y)}%
          </p>
          <Button
            onClick={() => {
              onChange(DEFAULT_CROP);
              setZoomText("100");
            }}
          >
            รีเซ็ตการครอป
          </Button>
        </div>
      </div>
    </div>
  );
}
