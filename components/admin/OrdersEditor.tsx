"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/admin/ui";
import { isOrderExpired } from "@/lib/shop";

interface OrderLine {
  label: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  quantity: number;
  size: string;
  unit_price: number | null;
  total: number;
  ref_code: string | null;
  slip_url: string | null;
  shipping_image_url: string | null;
  currency: string;
  items: OrderLine[] | null;
  customer_name: string;
  phone: string;
  courier: string;
  province: string;
  city: string;
  branch: string;
  user_email: string | null;
  status: string;
}

const STATUS_OPTS: { value: string; label: string; tone: string }[] = [
  { value: "awaiting_payment", label: "รอชำระ", tone: "text-ash" },
  { value: "paid_declared", label: "รอตรวจสอบ", tone: "text-glow" },
  { value: "verified", label: "จ่ายแล้ว", tone: "text-win" },
  { value: "packing", label: "กำลังแพ็กของ", tone: "text-amethyst" },
  { value: "shipped", label: "ส่งแล้ว", tone: "text-spectre" },
  { value: "cancelled", label: "ยกเลิก", tone: "text-loss" },
];

// Quick-advance button: one tap to the natural next step in the flow.
const NEXT_STEP: Record<string, { value: string; label: string } | undefined> = {
  awaiting_payment: { value: "paid_declared", label: "แจ้งว่าโอนแล้ว" },
  paid_declared: { value: "verified", label: "ยืนยันการจ่าย" },
  verified: { value: "packing", label: "เริ่มแพ็กของ" },
  packing: { value: "shipped", label: "ทำเครื่องหมายส่งแล้ว" },
};

const normPhone = (p: string) => (p || "").replace(/\D/g, "");

/** Human "x นาทีที่แล้ว" relative time (computed at render; admin refreshes to update). */
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "เมื่อสักครู่";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  return `${Math.floor(mo / 12)} ปีที่แล้ว`;
}

/** Read an image File and downscale it to a JPEG data URL (admin shipping photos). */
async function fileToDownscaledDataUrl(file: File, max = 1400): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("img"));
    i.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  if (scale >= 1) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

type TabId = "awaiting" | "checking" | "paid" | "packing" | "shipped";

const TABS: { id: TabId; label: string; match: (s: string) => boolean }[] = [
  { id: "awaiting", label: "รอชำระ", match: (s) => s === "awaiting_payment" },
  { id: "checking", label: "กำลังตรวจ", match: (s) => s === "paid_declared" },
  { id: "paid", label: "จ่ายแล้ว", match: (s) => s === "verified" || s === "cancelled" },
  { id: "packing", label: "กำลังแพ็กของ", match: (s) => s === "packing" },
  { id: "shipped", label: "ส่งแล้ว", match: (s) => s === "shipped" },
];

// Bulk-advance: which status to move FROM and TO for the "move all shown" button.
const BULK_ADVANCE: Partial<Record<TabId, { from: string; to: string; toLabel: string }>> = {
  paid: { from: "verified", to: "packing", toLabel: "กำลังแพ็กของ" },
  packing: { from: "packing", to: "shipped", toLabel: "ส่งแล้ว" },
};

// Tabs where grouping orders by courier helps packing/dispatch.
const GROUP_TABS = new Set<TabId>(["paid", "packing", "shipped"]);

/** Group key for an order's courier (blank couriers fold into "—"). */
const courierKey = (o: OrderRow): string => (o.courier || "").trim() || "—";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];

/** Per-size quantities for one order (from the structured items, or by parsing the
 *  "M×2, L×1" summary for older single-column rows). */
function sizeCounts(o: OrderRow): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(o.items) && o.items.length) {
    for (const l of o.items) out[l.label] = (out[l.label] ?? 0) + Number(l.quantity || 0);
  } else if (o.size) {
    for (const m of o.size.matchAll(/([^\s×,]+)\s*×\s*(\d+)/g)) out[m[1]] = (out[m[1]] ?? 0) + Number(m[2]);
  }
  return out;
}

function sortSizes(sizes: Record<string, number>): [string, number][] {
  return Object.entries(sizes).sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a[0]);
    const ib = SIZE_ORDER.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

function periodKey(iso: string, gran: "day" | "month" | "year"): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (gran === "year") return `${y}`;
  if (gran === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function periodLabel(iso: string, gran: "day" | "month" | "year"): string {
  const d = new Date(iso);
  if (gran === "year") return String(d.getFullYear());
  if (gran === "month") return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const fmt = (n: number, c: string) => `${Number(n || 0).toLocaleString("en-US")} ${c}`;
/** Time of the order's last change (transfer / status update), falling back to created. */
const orderTime = (o: OrderRow) => o.updated_at || o.created_at;
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

export default function OrdersEditor() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [tab, setTab] = useState<TabId>("checking");
  const [groupCourier, setGroupCourier] = useState(true);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"new" | "old">("new");
  const [copied, setCopied] = useState("");
  // ส่งแล้ว tab — narrow both the sales summary and the order list to one
  // day / month / year (or all).
  const [shipGran, setShipGran] = useState<"all" | "day" | "month" | "year">("all");
  const [shipDay, setShipDay] = useState("");
  const [shipMonth, setShipMonth] = useState("");
  const [shipYear, setShipYear] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลดไม่สำเร็จ");
      setOrders(json.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      // Reflect the change time immediately (the DB trigger bumps updated_at too).
      const nowIso = new Date().toISOString();
      setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, status, updated_at: nowIso } : r)));
    } catch {
      setError("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  // Hard-delete: purge a junk / mismatched-transfer order from the DB entirely.
  async function deleteOrder(o: OrderRow) {
    if (!window.confirm(`ยกเลิกและลบออเดอร์ ${o.ref_code || o.customer_name || ""} ออกถาวร?\nลบแล้วกู้คืนไม่ได้`)) return;
    setBusyId(o.id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id }),
      });
      if (!res.ok) throw new Error();
      setOrders((rows) => rows.filter((r) => r.id !== o.id));
    } catch {
      setError("ลบออเดอร์ไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  // Attach a shipping image (e.g. the courier branch's parcel/receipt number) that
  // the buyer then sees in My Orders.
  async function uploadShipping(id: string, file: File) {
    setBusyId(id);
    setError("");
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, shippingImage: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "");
      const url: string | null = json.shippingImageUrl ?? null;
      const nowIso = new Date().toISOString();
      setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, shipping_image_url: url, updated_at: nowIso } : r)));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  async function clearShipping(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, clearShippingImage: true }),
      });
      if (!res.ok) throw new Error();
      setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, shipping_image_url: null } : r)));
    } catch {
      setError("ลบรูปไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  // Move every currently-shown order in one bucket to the next status at once
  // (จ่ายแล้ว → กำลังแพ็กของ, กำลังแพ็กของ → ส่งแล้ว). Respects the active
  // search/filter — only the orders visible in the list are moved.
  async function bulkAdvance(targets: OrderRow[], to: string, toLabel: string) {
    if (targets.length === 0 || bulkBusy) return;
    if (!window.confirm(`ย้าย ${targets.length} ออเดอร์ที่แสดงอยู่ไปเป็น “${toLabel}” ทั้งหมด?`)) return;
    setBulkBusy(true);
    setError("");
    const ids = targets.map((o) => o.id);
    try {
      const nowIso = new Date().toISOString();
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch("/api/admin/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: to }),
          }).then((r) => {
            if (!r.ok) throw new Error();
          })
        )
      );
      const okIds = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
      setOrders((rows) => rows.map((r) => (okIds.has(r.id) ? { ...r, status: to, updated_at: nowIso } : r)));
      if (okIds.size < ids.length) setError(`ย้ายสำเร็จ ${okIds.size}/${ids.length} ออเดอร์ (บางรายการไม่สำเร็จ)`);
    } catch {
      setError("ย้ายออเดอร์ไม่สำเร็จ");
    } finally {
      setBulkBusy(false);
    }
  }

  async function copy(text: string, key: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  const counts: Record<TabId, number> = {
    awaiting: orders.filter((o) => TABS[0].match(o.status)).length,
    checking: orders.filter((o) => TABS[1].match(o.status)).length,
    paid: orders.filter((o) => TABS[2].match(o.status)).length,
    packing: orders.filter((o) => TABS[3].match(o.status)).length,
    shipped: orders.filter((o) => TABS[4].match(o.status)).length,
  };

  // Flag orders that share a phone or signed-in email with another order — a hint
  // the boss may be looking at a duplicate / repeat submission.
  const phoneCounts = new Map<string, number>();
  const emailCounts = new Map<string, number>();
  for (const o of orders) {
    const p = normPhone(o.phone);
    if (p) phoneCounts.set(p, (phoneCounts.get(p) ?? 0) + 1);
    const e = (o.user_email || "").trim().toLowerCase();
    if (e) emailCounts.set(e, (emailCounts.get(e) ?? 0) + 1);
  }
  const dupCount = (o: OrderRow): number => {
    const p = normPhone(o.phone);
    const e = (o.user_email || "").trim().toLowerCase();
    return Math.max(p ? phoneCounts.get(p) ?? 1 : 1, e ? emailCounts.get(e) ?? 1 : 1);
  };

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[1];
  const q = query.trim().toLowerCase();
  const qDigits = normPhone(query);

  // ── ส่งแล้ว period filter — default the picker to the newest shipped order so
  //    switching to วัน/เดือน/ปี immediately shows something meaningful. ──
  const shippedTimes = orders.filter((o) => o.status === "shipped").map(orderTime);
  const newestShip = shippedTimes.reduce((acc, t) => (t > acc ? t : acc), "");
  const effDay = shipDay || (newestShip ? periodKey(newestShip, "day") : "");
  const effMonth = shipMonth || (newestShip ? periodKey(newestShip, "month") : "");
  const effYear = shipYear || (newestShip ? periodKey(newestShip, "year") : "");
  const shipYearOpts = [...new Set(shippedTimes.map((t) => periodKey(t, "year")))].sort((a, b) => (a < b ? 1 : -1));
  const inShipPeriod = (o: OrderRow) => {
    if (shipGran === "all") return true;
    const t = orderTime(o);
    if (shipGran === "day") return !effDay || periodKey(t, "day") === effDay;
    if (shipGran === "month") return !effMonth || periodKey(t, "month") === effMonth;
    return !effYear || periodKey(t, "year") === effYear;
  };
  const periodLabelText =
    shipGran === "all"
      ? "ทั้งหมด"
      : shipGran === "day"
      ? effDay ? periodLabel(effDay, "day") : "—"
      : shipGran === "month"
      ? effMonth ? periodLabel(`${effMonth}-01`, "month") : "—"
      : effYear || "—";

  const visible = orders
    .filter((o) => activeTab.match(o.status))
    .filter((o) => (tab === "shipped" ? inShipPeriod(o) : true))
    .filter((o) => {
      if (!q) return true;
      return (
        (o.ref_code || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.user_email || "").toLowerCase().includes(q) ||
        (!!qDigits && normPhone(o.phone).includes(qDigits))
      );
    })
    .sort((a, b) => {
      const diff = new Date(orderTime(b)).getTime() - new Date(orderTime(a)).getTime();
      return sortDir === "new" ? diff : -diff;
    });

  // Courier grouping (จ่ายแล้ว / กำลังแพ็กของ / ส่งแล้ว): sort by courier so same-
  // courier orders sit together, keeping the newest/oldest order within each group.
  const grouping = groupCourier && GROUP_TABS.has(tab);
  const ordered = grouping
    ? [...visible].sort((a, b) => {
        const t = new Date(orderTime(b)).getTime() - new Date(orderTime(a)).getTime();
        return courierKey(a).localeCompare(courierKey(b)) || (sortDir === "new" ? t : -t);
      })
    : visible;
  // Per-courier order + unit counts for the group headers.
  const courierCount = new Map<string, number>();
  const courierUnits = new Map<string, number>();
  if (grouping) {
    for (const o of ordered) {
      const k = courierKey(o);
      courierCount.set(k, (courierCount.get(k) ?? 0) + 1);
      courierUnits.set(k, (courierUnits.get(k) ?? 0) + Number(o.quantity || 0));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-soul">ออเดอร์เสื้อ</h2>
        <Button onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </Button>
      </div>

      {/* sub-tabs so the boss checks one bucket at a time */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TABS.map((t) => {
          const active = t.id === tab;
          const tone =
            t.id === "awaiting"
              ? "text-spectre"
              : t.id === "checking"
                ? "text-glow"
                : t.id === "packing"
                  ? "text-amethyst"
                  : t.id === "shipped"
                    ? "text-amethyst"
                    : "text-win";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md border px-3 py-2.5 text-center transition-colors ${
                active ? "border-amethyst bg-amethyst/15" : "border-edge bg-void/40 hover:border-edge-bright"
              }`}
            >
              <span className={`block font-display text-sm font-bold uppercase tracking-wide ${active ? "text-soul" : "text-ash"}`}>
                {t.label}
              </span>
              <span className={`font-mono text-lg font-bold tabular-nums ${active ? tone : "text-ash-dim"}`}>{counts[t.id]}</span>
            </button>
          );
        })}
      </div>

      {/* search + sort — find an order by number/name/phone, newest or oldest first */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา เลขออเดอร์ / ชื่อ / เบอร์"
            className="w-full rounded-md border border-edge bg-void/60 px-3 py-2 pr-8 font-mono text-[12px] text-soul placeholder:text-ash-dim focus:border-amethyst focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ล้าง"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ash transition-colors hover:text-soul"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {([
            { id: "new", label: "ล่าสุดก่อน" },
            { id: "old", label: "เก่าสุดก่อน" },
          ] as const).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSortDir(s.id)}
              className={`rounded-md border px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                sortDir === s.id ? "border-amethyst bg-amethyst/15 text-soul" : "border-edge bg-void/40 text-ash hover:text-soul"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {GROUP_TABS.has(tab) && (
          <button
            type="button"
            onClick={() => setGroupCourier((v) => !v)}
            title="จัดกลุ่มออเดอร์ตามบริษัทขนส่ง เพื่อแพ็กทีละเจ้า"
            className={`rounded-md border px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              groupCourier ? "border-amethyst bg-amethyst/15 text-soul" : "border-edge bg-void/40 text-ash hover:text-soul"
            }`}
          >
            {groupCourier ? "▦ จัดกลุ่มขนส่ง" : "จัดกลุ่มขนส่ง"}
          </button>
        )}
      </div>

      {error && <p className="font-mono text-[11px] text-loss">{error}</p>}

      {tab === "shipped" && (
        <div className="space-y-3">
          {/* pick a day / month / year (or all) — filters BOTH the report and
              the order list below, so what you see always matches the summary */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-edge bg-void/40 p-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">ดูช่วง</span>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: "all", label: "ทั้งหมด" },
                { id: "day", label: "รายวัน" },
                { id: "month", label: "รายเดือน" },
                { id: "year", label: "รายปี" },
              ] as const).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setShipGran(g.id)}
                  className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                    shipGran === g.id ? "border-amethyst bg-amethyst/15 text-soul" : "border-edge bg-void/40 text-ash hover:text-soul"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {shipGran === "day" && (
              <input
                type="date"
                value={effDay}
                onChange={(e) => setShipDay(e.target.value)}
                className="rounded-md border border-edge bg-void/60 px-2.5 py-1.5 font-mono text-[12px] text-soul [color-scheme:dark] focus:border-amethyst focus:outline-none"
              />
            )}
            {shipGran === "month" && (
              <input
                type="month"
                value={effMonth}
                onChange={(e) => setShipMonth(e.target.value)}
                className="rounded-md border border-edge bg-void/60 px-2.5 py-1.5 font-mono text-[12px] text-soul [color-scheme:dark] focus:border-amethyst focus:outline-none"
              />
            )}
            {shipGran === "year" && (
              <select
                value={effYear}
                onChange={(e) => setShipYear(e.target.value)}
                className="rounded-md border border-edge bg-void/60 px-2.5 py-1.5 font-mono text-[12px] text-soul focus:border-amethyst focus:outline-none"
              >
                {shipYearOpts.length === 0 && <option value="">—</option>}
                {shipYearOpts.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
          <SalesReport orders={visible} gran={shipGran} periodLabelText={periodLabelText} />
        </div>
      )}

      {/* one-tap: move every shown order in this bucket to the next step */}
      {BULK_ADVANCE[tab] && (() => {
        const cfg = BULK_ADVANCE[tab]!;
        const targets = visible.filter((o) => o.status === cfg.from);
        if (targets.length === 0) return null;
        return (
          <button
            type="button"
            onClick={() => bulkAdvance(targets, cfg.to, cfg.toLabel)}
            disabled={bulkBusy}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md border border-amethyst bg-amethyst/20 px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-all hover:bg-amethyst/30 disabled:opacity-50"
          >
            {bulkBusy ? "กำลังย้าย…" : `⇉ ย้ายทั้งหมดที่แสดง (${targets.length}) → ${cfg.toLabel}`}
          </button>
        );
      })()}

      {!loading && visible.length === 0 && (
        <Card>
          <p className="text-center font-mono text-[11px] text-ash">ไม่มีออเดอร์ในหมวดนี้</p>
        </Card>
      )}

      <div className="space-y-3">
        {ordered.map((o, idx) => {
          const opt = STATUS_OPTS.find((s) => s.value === o.status);
          const expired = isOrderExpired(o.created_at, o.status);
          const dup = dupCount(o);
          const next = NEXT_STEP[o.status];
          const showShipping = o.status === "verified" || o.status === "packing" || o.status === "shipped";
          const busy = busyId === o.id;
          // First card of each courier group gets a header (count + total units).
          const ck = courierKey(o);
          const firstOfGroup = grouping && (idx === 0 || courierKey(ordered[idx - 1]) !== ck);
          return (
            <React.Fragment key={o.id}>
              {firstOfGroup && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amethyst/40 bg-amethyst/10 px-3 py-2">
                  <span className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">🚚 {ck}</span>
                  <span className="font-mono text-[11px] text-spectre">
                    {courierCount.get(ck) ?? 0} ออเดอร์ · <span className="font-bold text-soul">{courierUnits.get(ck) ?? 0}</span> ตัว
                  </span>
                </div>
              )}
              <Card className="space-y-3">
              {/* Order ref + amount — the two fields the boss matches against the slip */}
              <div className="flex flex-wrap items-stretch justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">เลขออเดอร์</span>
                  {o.ref_code ? (
                    <button
                      type="button"
                      onClick={() => copy(o.ref_code || "", `ref-${o.id}`)}
                      title="คัดลอกเลขออเดอร์"
                      className="keep-latin block font-display text-2xl font-black tracking-[0.12em] text-glow transition-colors hover:text-soul"
                    >
                      {o.ref_code} <span className="align-middle text-sm">⧉</span>
                      {copied === `ref-${o.id}` && <span className="ml-1 align-middle font-mono text-[10px] text-win">คัดลอกแล้ว</span>}
                    </button>
                  ) : (
                    <p className="font-mono text-sm text-ash-dim">—</p>
                  )}
                  {dup > 1 && (
                    <span className="mt-1 inline-block rounded border border-loss/50 bg-loss/10 px-1.5 py-0.5 font-mono text-[10px] text-loss">
                      ⚠ อาจซ้ำ ({dup} ออเดอร์ เบอร์/บัญชีเดียวกัน)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">ยอดโอน</span>
                  <button
                    type="button"
                    onClick={() => copy(String(o.total ?? ""), `amt-${o.id}`)}
                    title="คัดลอกยอด"
                    className="block font-display text-2xl font-black tabular-nums text-soul transition-colors hover:text-glow"
                  >
                    {fmt(o.total, o.currency)}
                    {copied === `amt-${o.id}` && <span className="ml-1 align-middle font-mono text-[10px] text-win">คัดลอกแล้ว</span>}
                  </button>
                </div>
              </div>

              {/* what sizes were ordered + status */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-edge pt-2.5">
                <span className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{o.size}</span>
                <span className={`font-mono text-[11px] ${expired ? "text-loss" : opt?.tone ?? "text-ash"}`}>
                  {expired ? "รอชำระ · หมดเวลา 24 ชม" : opt?.label ?? o.status}
                </span>
              </div>

              {/* total quantity on its own row (kept clear of the size list) */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">รวมการซื้อทั้งหมด</span>
                <span className="font-display text-base font-bold text-soul">{o.quantity} ตัว</span>
              </div>

              {/* time of the last change — big and prominent */}
              <div className="rounded-md border border-edge bg-void/40 px-3 py-2">
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ash">วันเวลา</span>
                <span className="font-display text-lg font-bold tracking-wide text-soul">{fmtDate(orderTime(o))}</span>
                <span className="ml-2 font-mono text-[11px] text-spectre">({timeAgo(orderTime(o))})</span>
              </div>

              {/* payment slip — collapsed by default to keep the list short */}
              {o.slip_url && (
                <details className="group rounded-md border border-edge bg-void/40">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-spectre transition-colors hover:text-soul [&::-webkit-details-marker]:hidden">
                    <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                    ดูสลิปการโอน
                  </summary>
                  <a
                    href={o.slip_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 border-t border-edge/60 p-2.5 transition-colors hover:bg-void/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.slip_url} alt="payment slip" className="h-24 w-24 shrink-0 rounded object-cover" />
                    <span className="font-mono text-[11px] text-spectre">ดูสลิปเต็ม ↗</span>
                  </a>
                </details>
              )}

              {/* shipping image the buyer will see (e.g. courier parcel number) — dropdown */}
              {showShipping && (
                <details className="group rounded-md border border-amethyst/30 bg-void/40">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ash transition-colors hover:text-soul [&::-webkit-details-marker]:hidden">
                    <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                    รูปใบรับของ / เลขพัสดุ {o.shipping_image_url ? "(แนบแล้ว ✓)" : "(ยังไม่แนบ)"}
                  </summary>
                  <div className="border-t border-amethyst/20 p-2.5">
                  {o.shipping_image_url ? (
                    <div className="flex items-center gap-3">
                      <a href={o.shipping_image_url} target="_blank" rel="noreferrer" className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.shipping_image_url} alt="shipping" className="h-20 w-20 rounded border border-edge object-cover" />
                      </a>
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer font-mono text-[11px] text-spectre underline transition-colors hover:text-soul">
                          เปลี่ยนรูป
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadShipping(o.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button type="button" onClick={() => clearShipping(o.id)} disabled={busy} className="text-left font-mono text-[11px] text-ash-dim transition-colors hover:text-loss">
                          ลบรูป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-md border border-dashed border-edge-bright bg-void/40 px-4 py-2 font-mono text-[11px] text-spectre transition-colors hover:border-amethyst hover:text-soul">
                      {busy ? "กำลังอัปโหลด…" : "+ แนบรูปใบรับของ"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadShipping(o.id, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  </div>
                </details>
              )}

              {/* everything else folded into a dropdown */}
              <details className="group border-t border-edge pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ash transition-colors hover:text-soul [&::-webkit-details-marker]:hidden">
                  <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                  ข้อมูลลูกค้า / จัดส่ง
                </summary>
                <div className="mt-2.5 grid gap-2 font-mono text-[13px] leading-relaxed text-spectre md:grid-cols-2">
                  <span>ชื่อ: {o.customer_name}</span>
                  {o.user_email && (
                    <span className="keep-latin break-all">
                      บัญชี: {o.user_email}
                      <button type="button" onClick={() => copy(o.user_email || "", `em-${o.id}`)} className="ml-1.5 text-ash transition-colors hover:text-soul">
                        {copied === `em-${o.id}` ? "✓" : "⧉"}
                      </button>
                    </span>
                  )}
                  <span className="keep-latin">
                    โทร: <a href={`tel:${o.phone}`} className="text-glow underline transition-colors hover:text-soul">{o.phone}</a>
                    <button type="button" onClick={() => copy(o.phone || "", `ph-${o.id}`)} className="ml-1.5 text-ash transition-colors hover:text-soul">
                      {copied === `ph-${o.id}` ? "✓" : "⧉"}
                    </button>
                  </span>
                  <span>ขนส่ง: {o.courier}</span>
                  <span>แขวง: {o.province}</span>
                  <span>เมือง: {o.city}</span>
                  <span>สาขา: {o.branch}</span>
                </div>
                {Array.isArray(o.items) && o.items.length > 1 && (
                  <div className="mt-2.5 border-t border-edge/60 pt-2.5 font-mono text-[11px] text-spectre">
                    {o.items.map((l, idx) => (
                      <span key={idx} className="mr-3 inline-block">
                        {l.label} × {l.quantity} = {fmt(l.lineTotal, o.currency)}
                      </span>
                    ))}
                  </div>
                )}
              </details>

              {/* quick-advance to the next step */}
              {next && (
                <button
                  type="button"
                  onClick={() => setStatus(o.id, next.value)}
                  disabled={busy}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-amethyst bg-amethyst/20 px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-all hover:bg-amethyst/30 disabled:opacity-50"
                >
                  {busy ? "…" : `→ ${next.label}`}
                </button>
              )}

              {/* manual status set (dropdown — back or forward to any state) + permanent delete */}
              <div className="flex flex-wrap items-center gap-2 border-t border-edge pt-3">
                <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
                  เปลี่ยนสถานะ
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    disabled={busy}
                    className="rounded-md border border-edge bg-void/60 px-2.5 py-1.5 font-mono text-[12px] text-soul focus:border-amethyst focus:outline-none disabled:opacity-50"
                  >
                    {STATUS_OPTS.filter((s) => s.value !== "cancelled" || o.status === "cancelled").map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => deleteOrder(o)}
                  disabled={busy}
                  className="ml-auto inline-flex min-h-[36px] items-center rounded-md border border-loss/50 bg-loss/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-loss transition-colors hover:bg-loss/20 disabled:opacity-50"
                >
                  ยกเลิก & ลบ
                </button>
              </div>
              </Card>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sales summary (ส่งแล้ว tab): revenue, units and per-size, by day/month/year ── */

function SalesReport({
  orders,
  gran,
  periodLabelText,
}: {
  orders: OrderRow[];
  gran: "all" | "day" | "month" | "year";
  periodLabelText: string;
}) {
  const currency = orders[0]?.currency || "ກີບ";
  const totalRevenue = orders.reduce((a, o) => a + Number(o.total || 0), 0);
  const totalUnits = orders.reduce((a, o) => a + Number(o.quantity || 0), 0);
  const totalSizes: Record<string, number> = {};
  for (const o of orders) {
    const sc = sizeCounts(o);
    for (const k in sc) totalSizes[k] = (totalSizes[k] ?? 0) + sc[k];
  }

  // With no specific period selected, break the total down month-by-month so
  // the whole history stays readable at a glance.
  const showBreakdown = gran === "all";
  const groups = new Map<string, { label: string; revenue: number; units: number; sizes: Record<string, number> }>();
  if (showBreakdown) {
    for (const o of orders) {
      const key = periodKey(orderTime(o), "month");
      let g = groups.get(key);
      if (!g) {
        g = { label: periodLabel(orderTime(o), "month"), revenue: 0, units: 0, sizes: {} };
        groups.set(key, g);
      }
      g.revenue += Number(o.total || 0);
      g.units += Number(o.quantity || 0);
      const sc = sizeCounts(o);
      for (const k in sc) g.sizes[k] = (g.sizes[k] ?? 0) + sc[k];
    }
  }
  const rows = [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([, g]) => g);

  return (
    <Card className="space-y-4 border-amethyst/30">
      {/* summary for the selected period */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">ยอดขายรวม (ส่งแล้ว) · {periodLabelText}</p>
        <p className="font-display text-3xl font-black tabular-nums text-win">{fmt(totalRevenue, currency)}</p>
        <p className="mt-0.5 font-mono text-[11px] text-spectre">
          ขายได้ <span className="font-bold text-soul">{totalUnits}</span> ตัว · {orders.length} ออเดอร์
        </p>
      </div>

      {sortSizes(totalSizes).length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-edge pt-3">
          {sortSizes(totalSizes).map(([label, qty]) => (
            <span key={label} className="rounded border border-edge bg-void/50 px-2 py-1 font-mono text-[11px] text-spectre">
              <span className="keep-latin font-bold text-soul">{label}</span> {qty}
            </span>
          ))}
        </div>
      )}

      {showBreakdown && rows.length > 0 && (
        <div className="space-y-1.5 border-t border-edge pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">แยกรายเดือน</p>
          {rows.map((g) => (
            <div key={g.label} className="rounded-md border border-edge bg-void/40 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="keep-latin font-mono text-[12px] font-bold text-soul">{g.label}</span>
                <span className="text-right">
                  <span className="font-display text-base font-bold tabular-nums text-win">{fmt(g.revenue, currency)}</span>
                  <span className="ml-2 font-mono text-[11px] text-ash">{g.units} ตัว</span>
                </span>
              </div>
              {sortSizes(g.sizes).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-spectre">
                  {sortSizes(g.sizes).map(([label, qty]) => (
                    <span key={label}>
                      <span className="keep-latin font-bold text-soul">{label}</span> {qty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
