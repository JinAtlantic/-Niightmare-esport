"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    const finish = async () => {
      const db = getSupabase();
      await db?.auth.getSession();
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "niightmare-auth-complete" }, window.location.origin);
        window.close();
        return;
      }

      window.location.replace(next);
    };
    finish();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-void px-4 text-center text-soul">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amethyst">NIIGHTMARE AUTH</p>
        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em]">Completing sign in...</h1>
      </div>
    </main>
  );
}
