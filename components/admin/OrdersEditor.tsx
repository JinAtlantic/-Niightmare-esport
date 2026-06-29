"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/admin/ui";

interface OrderRow {
  id: string;
  created_at: string;
  quantity: number;
  size: string;
  unit_price: number;
  total: number;
  currency: string;
  customer_name: string;
  phone: string;
  courier: string;
  province: string;
  city: string;
  branch: string;
  status: string;
}

const STATUS_OPTS: { value: string; label: string; tone: string }[] = [
  { value: "paid_declared", label: "รอตรวจสอบ", tone: "text-glow" },
  { value: "verified", label: "จ่ายแล้ว", tone: "text-win" },
  { value: "shipped", label: "ส่งแล้ว", tone: "text-spectre" },
  { value: "cancelled", label: "ยกเลิก", tone: "text-loss" },
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

  const pending = orders.filter((o) => o.status === "paid_declared").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-soul">ออเดอร์เสื้อ</h2>
          <p className="mt-0.5 font-mono text-[11px] text-ash">
            ทั้งหมด {orders.length} รายการ · รอตรวจสอบ <span className="text-glow">{pending}</span>
          </p>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </Button>
      </div>

      {error && <p className="font-mono text-[11px] text-loss">{error}</p>}

      {!loading && orders.length === 0 && (
        <Card>
          <p className="text-center font-mono text-[11px] text-ash">ยังไม่มีออเดอร์</p>
        </Card>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const opt = STATUS_OPTS.find((s) => s.value === o.status);
          return (
            <Card key={o.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold uppercase tracking-wide text-soul">
                    {o.customer_name} · {o.size} · x{o.quantity}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-ash">{fmtDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-soul">{fmt(o.total, o.currency)}</p>
                  <p className={`font-mono text-[11px] ${opt?.tone ?? "text-ash"}`}>{opt?.label ?? o.status}</p>
                </div>
              </div>

              <div className="grid gap-1.5 border-t border-edge pt-3 font-mono text-[11px] text-spectre md:grid-cols-2">
                <span>โทร: {o.phone}</span>
                <span>ขนส่ง: {o.courier}</span>
                <span>แขวง: {o.province}</span>
                <span>เมือง: {o.city}</span>
                <span>สาขา: {o.branch}</span>
                <span>ต่อตัว: {fmt(o.unit_price, o.currency)}</span>
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
