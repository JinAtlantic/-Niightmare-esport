"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "เข้าสู่ระบบไม่สำเร็จ");
      // reload so the server component re-checks the cookie and renders the app
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-void px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-edge bg-crypt p-7 shadow-[0_0_40px_rgba(168,85,247,0.12)]"
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-amethyst">
          NIIGHTMARE
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-soul">
          Admin Login
        </h1>
        <p className="mt-1 font-mono text-xs text-ash">เข้าสู่ระบบเพื่อจัดการข้อมูลเว็บไซต์</p>

        <label className="mt-6 block">
          <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
            รหัสผ่าน
          </span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors focus:border-amethyst"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="mt-3 font-mono text-xs text-loss">{error}</p>}

        <Button type="submit" variant="primary" disabled={busy} className="mt-5 w-full">
          {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </Button>
      </form>
    </div>
  );
}
