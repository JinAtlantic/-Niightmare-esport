"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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

        <div className="mt-6 block">
          <label htmlFor="admin-password" className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPw ? "text" : "password"}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-edge bg-void/60 px-3 py-2 pr-12 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ash transition-colors hover:text-soul"
            >
              {showPw ? <EyeOffGlyph /> : <EyeGlyph />}
            </button>
          </div>
        </div>

        <div className="mt-4 block">
          <label htmlFor="admin-totp" className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
            2FA Code
          </label>
          <input
            id="admin-totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
            placeholder="123456"
          />
          <span className="mt-1 block font-mono text-[10px] leading-relaxed text-ash">
            Required when ADMIN_TOTP_SECRET is enabled.
          </span>
        </div>

        {error && <p className="mt-3 font-mono text-xs text-loss">{error}</p>}

        <Button type="submit" variant="primary" disabled={busy} className="mt-5 w-full">
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function EyeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.8M6.3 6.3A18 18 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.2-.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
