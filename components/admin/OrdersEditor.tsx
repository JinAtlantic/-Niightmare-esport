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
  { value: "shipped", label: "ส่งแล้ว", tone: "text-spectre" },
  { value: "cancelled", label: "ยกเลิก", tone: "text-loss" },
];

type TabId = "awaiting" | "checking" | "paid" | "shipped";

const TABS: { id: TabId; label: string; match: (s: string) => boolean }[] = [
  { id: "awaiting", label: "รอชำระ", match: (s) => s === "awaiting_payment" },
  { id: "checking", label: "กำลังตรวจ", match: (s) => s === "paid_declared" },
  { id: "paid", label: "จ่ายแล้ว", match: (s) => s === "verified" || s === "cancelled" },
  { id: "shipped", label: "ส่งแล้ว", match: (s) => s === "shipped" },
];

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
  const [tab, setTab] = useState<TabId>("checking");

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

  const counts: Record<TabId, number> = {
    awaiting: orders.filter((o) => TABS[0].match(o.status)).length,
    checking: orders.filter((o) => TABS[1].match(o.status)).length,
    paid: orders.filter((o) => TABS[2].match(o.status)).length,
    shipped: orders.filter((o) => TABS[3].match(o.status)).length,
  };

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[1];
  const visible = orders
    .filter((o) => activeTab.match(o.status))
    .sort((a, b) => new Date(orderTime(b)).getTime() - new Date(orderTime(a)).getTime());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-soul">ออเดอร์เสื้อ</h2>
        <Button onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </Button>
      </div>

      {/* sub-tabs so the boss checks one bucket at a time */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((t) => {
          const active = t.id === tab;
          const tone =
            t.id === "awaiting" ? "text-spectre" : t.id === "checking" ? "text-glow" : t.id === "shipped" ? "text-amethyst" : "text-win";
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

      {error && <p className="font-mono text-[11px] text-loss">{error}</p>}

      {tab === "shipped" && <SalesReport orders={visible} />}

      {!loading && visible.length === 0 && (
        <Card>
          <p className="text-center font-mono text-[11px] text-ash">ไม่มีออเดอร์ในหมวดนี้</p>
        </Card>
      )}

      <div className="space-y-3">
        {visible.map((o) => {
          const opt = STATUS_OPTS.find((s) => s.value === o.status);
          const expired = isOrderExpired(o.created_at, o.status);
          return (
            <Card key={o.id} className="space-y-3">
              {/* Order ref + amount — the two fields the boss matches against the slip */}
              <div className="flex flex-wrap items-stretch justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">เลขออเดอร์</span>
                  {o.ref_code ? (
                    <p className="keep-latin font-display text-2xl font-black tracking-[0.12em] text-glow">{o.ref_code}</p>
                  ) : (
                    <p className="font-mono text-sm text-ash-dim">—</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">ยอดโอน</span>
                  <p className="font-display text-2xl font-black tabular-nums text-soul">{fmt(o.total, o.currency)}</p>
                </div>
              </div>

              {/* what was ordered + status */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-edge pt-2.5">
                <span className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{o.size} · {o.quantity} ตัว</span>
                <span className={`font-mono text-[11px] ${expired ? "text-loss" : opt?.tone ?? "text-ash"}`}>
                  {expired ? "รอชำระ · หมดเวลา 24 ชม" : opt?.label ?? o.status}
                </span>
              </div>

              {/* date/time of the last change (transfer / status update) */}
              <p className="font-mono text-[11px] text-ash">{fmtDate(orderTime(o))}</p>

              {o.slip_url && (
                <a
                  href={o.slip_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md border border-edge bg-void/40 p-2.5 transition-colors hover:border-amethyst"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.slip_url} alt="payment slip" className="h-20 w-20 shrink-0 rounded object-cover" />
                  <span className="font-mono text-[11px] text-spectre">ดูสลิปเต็ม ↗</span>
                </a>
              )}

              {/* everything else folded into a dropdown */}
              <details className="group border-t border-edge pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ash transition-colors hover:text-soul [&::-webkit-details-marker]:hidden">
                  <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                  ข้อมูลลูกค้า / จัดส่ง
                </summary>
                <div className="mt-2.5 grid gap-1.5 font-mono text-[11px] text-spectre md:grid-cols-2">
                  <span>ชื่อ: {o.customer_name}</span>
                  {o.user_email && <span className="keep-latin break-all">บัญชี: {o.user_email}</span>}
                  <span>โทร: {o.phone}</span>
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

              <div className="flex flex-wrap gap-2 border-t border-edge pt-3">
                {STATUS_OPTS.map((s) => (
                  <Button
                    key={s.value}
                    variant={o.status === s.value ? "primary" : "ghost"}
                    onClick={() => setStatus(o.id, s.value)}
                    disabled={busyId === o.id}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sales summary (ส่งแล้ว tab): revenue, units and per-size, by day/month/year ── */

function SalesReport({ orders }: { orders: OrderRow[] }) {
  const [gran, setGran] = useState<"day" | "month" | "year">("month");
  const currency = orders[0]?.currency || "ກີບ";

  const totalRevenue = orders.reduce((a, o) => a + Number(o.total || 0), 0);
  const totalUnits = orders.reduce((a, o) => a + Number(o.quantity || 0), 0);
  const totalSizes: Record<string, number> = {};
  for (const o of orders) {
    const sc = sizeCounts(o);
    for (const k in sc) totalSizes[k] = (totalSizes[k] ?? 0) + sc[k];
  }

  const groups = new Map<string, { label: string; revenue: number; units: number; sizes: Record<string, number> }>();
  for (const o of orders) {
    const key = periodKey(o.created_at, gran);
    let g = groups.get(key);
    if (!g) {
      g = { label: periodLabel(o.created_at, gran), revenue: 0, units: 0, sizes: {} };
      groups.set(key, g);
    }
    g.revenue += Number(o.total || 0);
    g.units += Number(o.quantity || 0);
    const sc = sizeCounts(o);
    for (const k in sc) g.sizes[k] = (g.sizes[k] ?? 0) + sc[k];
  }
  const rows = [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([, g]) => g);

  const GRANS: { id: "day" | "month" | "year"; label: string }[] = [
    { id: "day", label: "รายวัน" },
    { id: "month", label: "รายเดือน" },
    { id: "year", label: "รายปี" },
  ];

  return (
    <Card className="space-y-4 border-amethyst/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">ยอดขายรวม (ส่งแล้ว)</p>
          <p className="font-display text-3xl font-black tabular-nums text-win">{fmt(totalRevenue, currency)}</p>
          <p className="mt-0.5 font-mono text-[11px] text-spectre">
            ขายได้ <span className="font-bold text-soul">{totalUnits}</span> ตัว · {orders.length} ออเดอร์
          </p>
        </div>
        <div className="flex gap-1.5">
          {GRANS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGran(g.id)}
              className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                gran === g.id ? "border-amethyst bg-amethyst/15 text-soul" : "border-edge bg-void/40 text-ash hover:text-soul"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
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

      {rows.length > 0 && (
        <div className="space-y-1.5 border-t border-edge pt-3">
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
