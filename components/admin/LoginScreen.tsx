"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
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
        body: JSON.stringify({ password, totp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Login failed.");
      // Reload so the server component re-checks the httpOnly cookie.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
        <p className="mt-1 font-mono text-xs leading-relaxed text-ash">
          Secure access for managing live website content.
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
            Password
          </span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
            placeholder="••••••••"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
            2FA Code
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
            placeholder="123456"
          />
          <span className="mt-1 block font-mono text-[10px] leading-relaxed text-ash-dim">
            Required when ADMIN_TOTP_SECRET is enabled.
          </span>
        </label>

        {error && <p className="mt-3 font-mono text-xs text-loss">{error}</p>}

        <Button type="submit" variant="primary" disabled={busy} className="mt-5 w-full">
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
