"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import { safeHref, safeImageSrc } from "@/lib/safety";
import type { Lang } from "@/lib/types";
import {
  resolveShop,
  sizePrice,
  formatPrice,
  computeOrder,
  validateOrder,
  isOtherCourier,
  isOrderExpired,
  payWindowRemaining,
  qrFrameStyle,
  SHOP_QTY_MAX,
  type ShopContent,
  type ShopOrderItem,
  type ShopOrderRecord,
} from "@/lib/shop";

const STORAGE_KEY = "nm-shop-orders";
type TabId = "order" | "myorders";

const COPY = {
  tabOrder: { en: "Order", lo: "ສັ່ງຊື້" },
  tabMine: { en: "My Orders", lo: "ອໍເດີຂອງຂ້ອຍ" },
  reserved: { en: "Reserved", lo: "ສະຫງວນລິຂະສິດ" },
  orderTitle: { en: "Order your jersey", lo: "ສັ່ງຊື້ເສື້ອ" },
  pickQuantities: { en: "Choose quantity per size — order several sizes at once.", lo: "ເລືອກຈຳນວນຕໍ່ໄຊ້ — ສັ່ງຫຼາຍໄຊ້ໃນຄັ້ງດຽວໄດ້." },
  soldOut: { en: "Sold out", lo: "ໝົດ" },
  fullName: { en: "Full name", lo: "ຊື່ ແລະ ນາມສະກຸນ" },
  phone: { en: "Phone / WhatsApp", lo: "ເບີໂທ / WhatsApp" },
  courier: { en: "Courier", lo: "ບໍລິສັດຂົນສົ່ງ" },
  pickCourier: { en: "Select courier", lo: "ເລືອກບໍລິສັດຂົນສົ່ງ" },
  otherCourier: { en: "Type courier name", lo: "ພິມຊື່ບໍລິສັດຂົນສົ່ງ" },
  province: { en: "Province", lo: "ແຂວງ" },
  city: { en: "City / District", lo: "ເມືອງ" },
  branch: { en: "Branch", lo: "ສາຂາ" },
  items: { en: "Items", lo: "ລາຍການ" },
  total: { en: "Total", lo: "ລາຄາລວມ" },
  pieces: { en: "pcs", lo: "ໂຕ" },
  placeOrder: { en: "Order & pay", lo: "ສັ່ງຊື້ & ຈ່າຍເງິນ" },
  fixErrors: { en: "Select at least one size and fill the highlighted fields.", lo: "ເລືອກຢ່າງໜ້ອຍ 1 ໄຊ້ ແລະ ຕື່ມຂໍ້ມູນທີ່ໝາຍໄວ້." },
  askMore: { en: "Ask for more info", lo: "ສອບຖາມຂໍ້ມູນເພີ່ມເຕີມ" },
  payTitle: { en: "Transfer to pay", lo: "ໂອນເງິນເພື່ອຈ່າຍ" },
  scan: { en: "Scan this QR with your banking app", lo: "ສະແກນ QR ນີ້ດ້ວຍແອັບທະນາຄານ" },
  payExact: { en: "Amount to transfer", lo: "ຈຳນວນທີ່ຕ້ອງໂອນ" },
  refCode: { en: "Order reference", lo: "ເລກອ້າງອີງອໍເດີ" },
  copyRef: { en: "Copy", lo: "ກັອບປີ້" },
  copied: { en: "Copied!", lo: "ກັອບແລ້ວ!" },
  attachSlip: { en: "Attach payment slip", lo: "ແນບສະລິບການໂອນ" },
  slipPick: { en: "Tap to upload your slip", lo: "ກົດເພື່ອອັບໂຫລດສະລິບ" },
  slipChange: { en: "Change slip", lo: "ປ່ຽນສະລິບ" },
  slipRequired: { en: "Please attach your payment slip first.", lo: "ກະລຸນາແນບສະລິບການໂອນກ່ອນ." },
  bank: { en: "Bank", lo: "ທະນາຄານ" },
  accName: { en: "Account name", lo: "ຊື່ບັນຊີ" },
  accNo: { en: "Account number", lo: "ເລກບັນຊີ" },
  transferred: { en: "I've transferred", lo: "ໂອນເງິນແລ້ວ" },
  sending: { en: "Saving…", lo: "ກຳລັງບັນທຶກ…" },
  cancel: { en: "Cancel", lo: "ຍົກເລີກ" },
  success: { en: "Payment submitted!", lo: "ສົ່ງການຈ່າຍສຳເລັດ!" },
  successBody: {
    en: "Thank you — our team will verify your payment and confirm shipping.",
    lo: "ຂອບໃຈ — ທີມງານຈະກວດສອບການຈ່າຍເງິນ ແລະ ຢືນຢັນການຈັດສົ່ງ.",
  },
  payError: { en: "Could not save the order. Please try again or contact us.", lo: "ບັນທຶກບໍ່ສຳເລັດ. ລອງໃໝ່ ຫຼື ຕິດຕໍ່ພວກເຮົາ." },
  noOrders: { en: "You have no orders yet.", lo: "ທ່ານຍັງບໍ່ມີອໍເດີ." },
  goOrder: { en: "Start an order", lo: "ເລີ່ມສັ່ງຊື້" },
  statusAwaiting: { en: "Awaiting transfer", lo: "ລໍຖ້າການໂອນ" },
  statusPaid: { en: "Transferred · processing", lo: "ໂອນແລ້ວ · ກຳລັງດຳເນີນການ" },
  payNow: { en: "Pay now", lo: "ຈ່າຍເງິນ" },
  timeLeft: { en: "Time left to pay", lo: "ເຫຼືອເວລາຈ່າຍ" },
  removeOrder: { en: "Remove", lo: "ລຶບ" },
  removeConfirm: { en: "Remove this order from your list?", lo: "ລຶບອໍເດີນີ້ອອກຈາກລາຍການຂອງທ່ານບໍ?" },
  comingSoon: { en: "Store opening soon", lo: "ຮ້ານກຳລັງຈະເປີດ" },
  comingSoonBody: {
    en: "The NIIGHTMARE jersey store is being prepared. Check back shortly.",
    lo: "ຮ້ານເສື້ອທີມ NIIGHTMARE ກຳລັງຈັດກຽມ. ກັບມາເບິ່ງໃໝ່ໄວໆນີ້.",
  },
};

/** Human countdown ("2d 3h" / "2 ມື້ 3 ຊມ") for the pay window. */
function formatRemaining(ms: number, lang: Lang): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (lang === "lo") {
    if (d > 0) return `${d} ມື້ ${h} ຊມ`;
    if (h > 0) return `${h} ຊມ ${m} ນທ`;
    return `${m} ນທ`;
  }
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ShopClient() {
  const { pick, lang } = useLanguage();
  const { site } = useContent();
  const shop: ShopContent = resolveShop((site as { shop?: Partial<ShopContent> }).shop);

  const [tab, setTab] = useState<TabId>("order");

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [courier, setCourier] = useState("");
  const [courierOther, setCourierOther] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [branch, setBranch] = useState("");

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [orderError, setOrderError] = useState("");
  const [reserving, setReserving] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState("");
  const [copied, setCopied] = useState(false);
  const [myOrders, setMyOrders] = useState<ShopOrderRecord[]>([]);
  // The order the payment popup is collecting a transfer for (freshly reserved
  // or an existing "awaiting" order the buyer chose to pay now).
  const [payingOrder, setPayingOrder] = useState<ShopOrderRecord | null>(null);
  const [slip, setSlip] = useState("");
  const [slipName, setSlipName] = useState("");

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ShopOrderRecord[];
      // Drop reservations that blew past the 7-day pay window.
      const kept = parsed.filter((o) => !isOrderExpired(o.createdAt, o.status));
      setMyOrders(kept);
      if (kept.length !== parsed.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
    } catch {
      /* ignore */
    }
  }, []);

  // Tick so the My Orders countdown stays live, and auto-remove expired ones.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      setMyOrders((prev) => {
        const kept = prev.filter((o) => !isOrderExpired(o.createdAt, o.status));
        if (kept.length === prev.length) return prev;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
        } catch {
          /* ignore */
        }
        return kept;
      });
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  // Lock background scroll while the payment popup is open so it can't scroll away.
  useEffect(() => {
    if (!payOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [payOpen]);

  const orderItems: ShopOrderItem[] = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([sizeId, quantity]) => ({ sizeId, quantity }));
  const { lines, totalQty, total } = computeOrder(shop, orderItems);

  function persist(list: ShopOrderRecord[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  function removeOrder(idx: number) {
    if (!window.confirm(pick(COPY.removeConfirm))) return;
    setMyOrders((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      persist(next);
      return next;
    });
  }

  function adjustQty(sizeId: string, delta: number) {
    setQuantities((prev) => {
      const cur = prev[sizeId] ?? 0;
      return { ...prev, [sizeId]: Math.max(0, Math.min(SHOP_QTY_MAX, cur + delta)) };
    });
  }

  function setQtyExact(sizeId: string, raw: string) {
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    const value = Number.isFinite(n) ? Math.max(0, Math.min(SHOP_QTY_MAX, n)) : 0;
    setQuantities((prev) => ({ ...prev, [sizeId]: value }));
  }

  const effectiveCourier = isOtherCourier(courier) ? courierOther.trim() : courier;

  function currentInput() {
    return { items: orderItems, customerName, phone, courier: effectiveCourier, province, city, branch };
  }

  // Reserve the order (status awaiting_payment) so it lands in /admin and My
  // Orders with a 7-day countdown, then open the pay popup.
  async function startOrder() {
    const errs = validateOrder(currentInput());
    setErrors(errs as Record<string, boolean>);
    if (Object.keys(errs).length) {
      document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setOrderError("");
    setReserving(true);
    const ref = "NM-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    try {
      const res = await fetch("/api/shop/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "reserve", ref, ...currentInput() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "reserve failed");
      const record: ShopOrderRecord = {
        ...(json.order as ShopOrderRecord),
        createdAt: json.order?.createdAt || new Date().toISOString(),
        status: "awaiting_payment",
      };
      const next = [record, ...myOrders].slice(0, 12);
      setMyOrders(next);
      persist(next);
      setQuantities({});
      openPayFor(record);
    } catch {
      setOrderError(pick(COPY.payError));
    } finally {
      setReserving(false);
    }
  }

  function openPayFor(order: ShopOrderRecord) {
    setPayingOrder(order);
    setSlip("");
    setSlipName("");
    setPayError("");
    setPaySuccess(false);
    setCopied(false);
    setPayOpen(true);
  }

  function closePay() {
    if (submitting) return;
    setPayOpen(false);
    setPayingOrder(null);
  }

  async function onSlipPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayError("");
    try {
      const dataUrl = await downscaleImage(file);
      setSlip(dataUrl);
      setSlipName(file.name);
    } catch {
      setPayError(pick(COPY.payError));
    }
  }

  async function copyRef(code: string) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the code is still visible to type manually */
    }
  }

  async function confirmTransfer() {
    if (!payingOrder) return;
    if (!slip) {
      setPayError(pick(COPY.slipRequired));
      return;
    }
    setSubmitting(true);
    setPayError("");
    try {
      const payItems = (payingOrder.items ?? []).map((l) => ({ sizeId: l.sizeId, quantity: l.quantity }));
      const res = await fetch("/api/shop/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "pay",
          orderId: payingOrder.id,
          ref: payingOrder.refCode,
          slip,
          items: payItems,
          customerName: payingOrder.customerName,
          phone: payingOrder.phone,
          courier: payingOrder.courier,
          province: payingOrder.province,
          city: payingOrder.city,
          branch: payingOrder.branch,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "save failed");
      const slipUrl: string | undefined = json.order?.slipUrl;
      const serverId: string | undefined = json.order?.id ?? payingOrder.id;
      const target = payingOrder;
      setPaySuccess(true);
      const next = myOrders.map((o) => {
        const same = target.id ? o.id === target.id : o.refCode === target.refCode && o.status === "awaiting_payment";
        return same ? { ...o, status: "paid_declared", slipUrl, id: serverId } : o;
      });
      setMyOrders(next);
      persist(next);
      window.setTimeout(() => {
        setPayOpen(false);
        setPaySuccess(false);
        setPayingOrder(null);
        setTab("myorders");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1900);
    } catch {
      setPayError(pick(COPY.payError));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (bad?: boolean) =>
    `w-full rounded-md border bg-void/60 px-3.5 py-3 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst ${
      bad ? "border-loss/70" : "border-edge"
    }`;

  const contactHref = safeHref(shop.contactUrl);
  const qrSrc = safeImageSrc(shop.bank.qrImage);

  if (!shop.enabled) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4 pt-24">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-soul">{pick(COPY.comingSoon)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ash">{pick(COPY.comingSoonBody)}</p>
        </div>
      </main>
    );
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "order", label: pick(COPY.tabOrder) },
    { id: "myorders", label: `${pick(COPY.tabMine)}${myOrders.length ? ` (${myOrders.length})` : ""}` },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-24 md:px-6 md:pt-28">
      <header className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.3)] md:text-4xl">
          {pick(shop.productName)}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-spectre/85 md:text-base">{pick(shop.tagline)}</p>
      </header>

      {/* tabs — switch between Order and My Orders */}
      <div className="mb-8 flex items-center justify-center gap-1 border-b border-edge">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className={`relative -mb-px px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors md:px-8 md:text-base ${
                active ? "text-soul" : "text-ash hover:text-soul"
              }`}
            >
              <span className="keep-latin">{t.label}</span>
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-0 h-[2px] -skew-x-[24deg] bg-gradient-to-r from-amethyst to-glow transition-opacity duration-300 ${
                  active ? "opacity-100 shadow-[0_0_14px_rgba(168,85,247,0.7)]" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-fadeIn">
        {/* ── ORDER ──────────────────────────────────────────────────── */}
        {tab === "order" && (
          <section id="order-form" className="space-y-5">
            <div className="rounded-md border border-amethyst/35 bg-amethyst/[0.06] p-4">
              <p className="mb-1 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst">
                <LockGlyph /> {pick(COPY.reserved)}
              </p>
              <p className="text-[13px] leading-relaxed text-spectre/90">{pick(shop.rightsNote)}</p>
              <p className="mt-2 font-display text-sm font-bold uppercase tracking-wide text-soul">
                {shop.fixedJerseyName} · #{shop.fixedJerseyNumber}
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">{pick(COPY.orderTitle)}</h2>
              <p className="mt-1 text-[13px] text-spectre/80">{pick(COPY.pickQuantities)}</p>
            </div>

            <div className={`grid gap-2 rounded-md border p-2 ${errors.items ? "border-loss/70" : "border-edge"}`}>
              {shop.sizes.map((s) => {
                const price = sizePrice(shop, s);
                const qty = quantities[s.id] ?? 0;
                return (
                  <div key={s.id} className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 ${qty > 0 ? "bg-amethyst/[0.07]" : ""}`}>
                    <div className="min-w-0">
                      <span className="font-display text-base font-bold uppercase tracking-wide text-soul">{s.label}</span>
                      <span className="ml-2 font-mono text-[11px] text-ash">
                        {formatPrice(price, shop.currency)}
                        {s.surcharge > 0 ? ` (+${s.surcharge.toLocaleString("en-US")})` : ""}
                      </span>
                    </div>
                    {s.inStock ? (
                      <div className="inline-flex shrink-0 items-center rounded-md border border-edge bg-void/50">
                        <Stepper label="−" onClick={() => adjustQty(s.id, -1)} dim={qty === 0} />
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={`${s.label} quantity`}
                          value={qty === 0 ? "" : String(qty)}
                          placeholder="0"
                          onChange={(e) => setQtyExact(s.id, e.target.value)}
                          className={`w-12 bg-transparent text-center font-display text-base font-bold outline-none placeholder:text-ash-dim ${qty > 0 ? "text-soul" : "text-ash-dim"}`}
                        />
                        <Stepper label="+" onClick={() => adjustQty(s.id, 1)} />
                      </div>
                    ) : (
                      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-loss">{pick(COPY.soldOut)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <Field label={pick(COPY.fullName)} error={errors.customerName}>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass(errors.customerName)} autoComplete="name" />
            </Field>
            <Field label={pick(COPY.phone)} error={errors.phone}>
              <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass(errors.phone)} autoComplete="tel" placeholder="+856 …" />
            </Field>
            <Field label={pick(COPY.courier)} error={errors.courier}>
              <select value={courier} onChange={(e) => setCourier(e.target.value)} className={inputClass(errors.courier)}>
                <option value="">{pick(COPY.pickCourier)}</option>
                {shop.couriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {isOtherCourier(courier) && (
                <input
                  type="text"
                  value={courierOther}
                  onChange={(e) => setCourierOther(e.target.value)}
                  placeholder={pick(COPY.otherCourier)}
                  className={`mt-2 ${inputClass(errors.courier)}`}
                />
              )}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={pick(COPY.province)} error={errors.province}>
                <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass(errors.province)} />
              </Field>
              <Field label={pick(COPY.city)} error={errors.city}>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass(errors.city)} />
              </Field>
              <Field label={pick(COPY.branch)} error={errors.branch}>
                <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} className={inputClass(errors.branch)} />
              </Field>
            </div>

            <div className="rounded-md border border-edge bg-crypt/60 p-5">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ash">{pick(COPY.total)}</p>
                  {lines.length > 0 && (
                    <p className="mt-1 break-words font-mono text-[11px] text-spectre">{lines.map((l) => `${l.label}×${l.quantity}`).join(" · ")}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="whitespace-nowrap font-display text-2xl font-bold tabular-nums text-soul sm:text-3xl">{formatPrice(total, shop.currency)}</p>
                  <p className="font-mono text-[11px] text-ash">
                    {totalQty} {pick(COPY.pieces)}
                  </p>
                </div>
              </div>
              {Object.keys(errors).length > 0 && <p className="mt-3 font-mono text-[11px] text-loss">{pick(COPY.fixErrors)}</p>}
              {orderError && <p className="mt-3 font-mono text-[11px] text-loss">{orderError}</p>}
              <button
                type="button"
                onClick={startOrder}
                disabled={reserving}
                className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-base font-bold uppercase tracking-[0.16em] text-soul transition-all hover:bg-amethyst/25 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reserving ? pick(COPY.sending) : pick(COPY.placeOrder)}
              </button>
              {contactHref && (
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 block text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ash transition-colors hover:text-spectre"
                >
                  {pick(COPY.askMore)}
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── MY ORDERS ──────────────────────────────────────────────── */}
        {tab === "myorders" && (
          <section>
            {myOrders.length === 0 ? (
              <div className="rounded-md border border-edge bg-crypt/40 p-10 text-center">
                <p className="text-sm text-ash">{pick(COPY.noOrders)}</p>
                <button
                  type="button"
                  onClick={() => setTab("order")}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md border border-amethyst bg-amethyst/15 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul transition-all hover:bg-amethyst/25"
                >
                  {pick(COPY.goOrder)}
                </button>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {myOrders.map((o, i) => {
                  const awaiting = o.status === "awaiting_payment";
                  const expired = isOrderExpired(o.createdAt, o.status, now);
                  const remaining = payWindowRemaining(o.createdAt, now);
                  const badge = awaiting ? pick(COPY.statusAwaiting) : pick(COPY.statusPaid);
                  const badgeCls = awaiting ? "border-spectre/40 bg-spectre/10 text-spectre" : "border-win/40 bg-win/10 text-win";
                  return (
                    <div key={(o.id ?? o.refCode ?? "") + i} className="rounded-md border border-edge bg-void/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <span className="font-display text-sm font-bold uppercase tracking-wide text-soul">
                          {pick(shop.productName)} · {o.sizeSummary}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${badgeCls}`}>{badge}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[11px] text-ash">
                        <span>
                          {o.totalQty} {pick(COPY.pieces)}
                          {o.createdAt ? ` · ${new Date(o.createdAt).toLocaleDateString("en-GB")}` : ""}
                        </span>
                        <span className="font-display text-base font-bold tabular-nums text-soul">{formatPrice(o.total, o.currency)}</span>
                      </div>

                      {awaiting && !expired && (
                        <div className="mt-3 space-y-2.5 border-t border-edge pt-3">
                          <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
                            <span className="text-ash">{pick(COPY.refCode)}</span>
                            <button
                              type="button"
                              onClick={() => copyRef(o.refCode || "")}
                              className="keep-latin rounded border border-glow/50 bg-void/50 px-2 py-0.5 font-bold tracking-[0.12em] text-glow transition-colors hover:bg-glow/10"
                            >
                              {o.refCode} ⧉
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
                            <span className="text-ash">{pick(COPY.timeLeft)}</span>
                            <span className="tabular-nums text-spectre">{formatRemaining(remaining, lang)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPayFor(o)}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-win/60 bg-win/15 px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.16em] text-win transition-all hover:bg-win/25"
                          >
                            {pick(COPY.payNow)}
                          </button>
                        </div>
                      )}

                      <div className="mt-3 flex justify-end border-t border-edge/60 pt-2.5">
                        <button
                          type="button"
                          onClick={() => removeOrder(i)}
                          className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash-dim transition-colors hover:text-loss"
                        >
                          {pick(COPY.removeOrder)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── payment popup (portaled to body so it always centres in the viewport) ── */}
      {mounted &&
        payOpen &&
        payingOrder &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={pick(COPY.payTitle)}>
            <button type="button" className="absolute inset-0 bg-black/82 backdrop-blur-sm" aria-label={pick(COPY.cancel)} onClick={closePay} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-md border border-edge-bright bg-crypt p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] md:p-6">
              {paySuccess ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-win bg-win/15 text-win shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                    <CheckGlyph />
                  </span>
                  <h3 className="font-display text-2xl font-black uppercase tracking-wide text-soul">{pick(COPY.success)}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-spectre/90">{pick(COPY.successBody)}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-soul">{pick(COPY.payTitle)}</h3>
                    <button
                      type="button"
                      onClick={closePay}
                      aria-label={pick(COPY.cancel)}
                      className="grid h-9 w-9 place-items-center rounded-md border border-edge bg-void/60 text-ash transition-colors hover:border-amethyst hover:text-soul"
                    >
                      ✕
                    </button>
                  </div>

                  {/* QR — framed (zoom/pan set in /admin) so a long screenshot shows
                       only the QR, big enough to scan. The background is applied to the
                       aspect-square box itself (a percentage-height child collapses to 0
                       on mobile Safari when the parent is sized via aspect-ratio). */}
                  <div
                    className="mx-auto grid aspect-square w-full max-w-[300px] place-items-center overflow-hidden rounded-md border border-edge-bright bg-white"
                    role="img"
                    aria-label="Payment QR"
                    style={qrSrc ? qrFrameStyle(qrSrc, shop.bank) : undefined}
                  >
                    {!qrSrc && <span className="px-4 text-center font-mono text-[11px] text-void/70">QR code — set it in /admin</span>}
                  </div>
                  <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ash">{pick(COPY.scan)}</p>

                  {/* exact amount + a copyable order reference, plus the editable note */}
                  <div className="mt-4 rounded-md border border-amethyst/45 bg-amethyst/10 p-4 text-center">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-glow">{pick(COPY.payExact)}</p>
                    <p className="mt-1 break-words font-display text-2xl font-black tabular-nums text-soul sm:text-3xl">
                      {formatPrice(payingOrder.total, payingOrder.currency)}
                    </p>

                    <div className="mt-3 border-t border-amethyst/25 pt-3">
                      <p className="text-sm font-semibold leading-relaxed text-soul">{pick(shop.bank.refNote)}</p>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">{pick(COPY.refCode)}</p>
                      <div className="mt-1.5 flex items-center justify-center gap-2">
                        <span className="keep-latin rounded border border-glow/60 bg-void/60 px-3 py-1.5 font-mono text-xl font-black tracking-[0.18em] text-glow">
                          {payingOrder.refCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyRef(payingOrder.refCode || "")}
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-glow/50 bg-glow/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-glow transition-colors hover:bg-glow/20"
                        >
                          {copied ? pick(COPY.copied) : pick(COPY.copyRef)}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-md border border-edge bg-void/50 p-4 font-mono text-xs">
                    <Row label={pick(COPY.items)} value={(payingOrder.items ?? []).map((l) => `${l.label}×${l.quantity}`).join(", ")} />
                    <Row label={pick(COPY.bank)} value={shop.bank.bankName} />
                    <Row label={pick(COPY.accName)} value={shop.bank.accountName} />
                    <Row label={pick(COPY.accNo)} value={shop.bank.accountNumber} />
                  </div>
                  <p className="mt-3 text-center text-[12px] leading-relaxed text-spectre/80">{pick(shop.bank.note)}</p>

                  {/* attach payment slip (required) — the team verifies against this */}
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ash">{pick(COPY.attachSlip)}</p>
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onSlipPick} />
                      {slip ? (
                        <span className="flex items-center gap-3 rounded-md border border-win/50 bg-win/10 p-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={slip} alt="slip preview" className="h-16 w-16 shrink-0 rounded object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-[11px] text-soul">{slipName}</span>
                            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-win">{pick(COPY.slipChange)}</span>
                          </span>
                        </span>
                      ) : (
                        <span className="flex min-h-[56px] items-center justify-center gap-2 rounded-md border border-dashed border-edge-bright bg-void/40 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul">
                          {pick(COPY.slipPick)}
                        </span>
                      )}
                    </label>
                    {!slip && <p className="mt-2 font-mono text-[10px] leading-relaxed text-ash-dim">{pick(COPY.slipRequired)}</p>}
                  </div>

                  {payError && <p className="mt-3 text-center font-mono text-[11px] text-loss">{payError}</p>}

                  <button
                    type="button"
                    onClick={confirmTransfer}
                    disabled={submitting || !slip}
                    className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md border border-win/60 bg-win/15 px-5 py-3 font-display text-base font-bold uppercase tracking-[0.16em] text-win transition-all hover:bg-win/25 hover:shadow-[0_0_24px_rgba(52,211,153,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? pick(COPY.sending) : pick(COPY.transferred)}
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Read an image file, downscale it (longest edge ≤ 1400px) and return a JPEG
 *  data URL. Keeps the uploaded slip small (~100–300 KB) so it posts fast and
 *  loads instantly in the admin Orders tab. Falls back to the raw file on error. */
function downscaleImage(file: File, maxEdge = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new Image();
      img.onerror = () => resolve(src); // fall back to the original data URL
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        if (scale >= 1) return resolve(src);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function Field({ label, error, children }: { label: string; error?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] ${error ? "text-loss" : "text-ash"}`}>{label}</span>
      {children}
    </label>
  );
}

function Stepper({ label, onClick, dim }: { label: string; onClick: () => void; dim?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === "+" ? "increase" : "decrease"}
      className={`grid h-11 w-11 place-items-center font-display text-xl font-bold transition-colors hover:text-amethyst ${dim ? "text-ash-dim" : "text-spectre"}`}
    >
      {label}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ash">{label}</span>
      <span className={strong ? "font-display text-base font-bold text-soul" : "text-right text-spectre"}>{value}</span>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
