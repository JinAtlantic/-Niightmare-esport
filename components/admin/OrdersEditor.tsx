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
  status: string;
}

const STATUS_OPTS: { value: string; label: string; tone: string }[] = [
  { value: "awaiting_payment", label: "รอชำระ", tone: "text-ash" },
  { value: "paid_declared", label: "รอตรวจสอบ", tone: "text-glow" },
  { value: "verified", label: "จ่ายแล้ว", tone: "text-win" },
  { value: "shipped", label: "ส่งแล้ว", tone: "text-spectre" },
  { value: "cancelled", label: "ยกเลิก", tone: "text-loss" },
];

type TabId = "awaiting" | "checking" | "paid";

const TABS: { id: TabId; label: string; match: (s: string) => boolean }[] = [
  { id: "awaiting", label: "รอชำระ", match: (s) => s === "awaiting_payment" },
  { id: "checking", label: "กำลังตรวจ", match: (s) => s === "paid_declared" },
  { id: "paid", label: "จ่ายแล้ว", match: (s) => s === "verified" || s === "shipped" || s === "cancelled" },
];

const fmt = (n: number, c: string) => `${Number(n || 0).toLocaleString("en-US")} ${c}`;
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
      setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
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
  };

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[1];
  const visible = orders
    .filter((o) => activeTab.match(o.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-soul">ออเดอร์เสื้อ</h2>
        <Button onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </Button>
      </div>

      {/* 3 sub-tabs so the boss checks one bucket at a time */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => {
          const active = t.id === tab;
          const tone = t.id === "awaiting" ? "text-spectre" : t.id === "checking" ? "text-glow" : "text-win";
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

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-edge pt-2.5">
                <span className="font-display text-sm font-bold uppercase tracking-wide text-soul">
                  {o.customer_name} · {o.size} · x{o.quantity}
                </span>
                <span className={`font-mono text-[11px] ${expired ? "text-loss" : opt?.tone ?? "text-ash"}`}>
                  {expired ? "รอชำระ · หมดเวลา 7 วัน" : opt?.label ?? o.status}
                </span>
              </div>
              <p className="font-mono text-[11px] text-ash">{fmtDate(o.created_at)}</p>

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

              {Array.isArray(o.items) && o.items.length > 1 && (
                <div className="border-t border-edge pt-3 font-mono text-[11px] text-spectre">
                  {o.items.map((l, idx) => (
                    <span key={idx} className="mr-3 inline-block">
                      {l.label} × {l.quantity} = {fmt(l.lineTotal, o.currency)}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-1.5 border-t border-edge pt-3 font-mono text-[11px] text-spectre md:grid-cols-2">
                <span>โทร: {o.phone}</span>
                <span>ขนส่ง: {o.courier}</span>
                <span>แขวง: {o.province}</span>
                <span>เมือง: {o.city}</span>
                <span>สาขา: {o.branch}</span>
                <span>รวม: {o.quantity} ตัว</span>
              </div>

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
