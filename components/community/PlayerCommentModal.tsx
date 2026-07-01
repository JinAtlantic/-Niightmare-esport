"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useFanAuth } from "@/components/context/FanAuthContext";
import { publicFanAvatar, publicFanName } from "@/lib/safety";
import type { Player } from "@/lib/types";

interface FanComment {
  id: string;
  body: string;
  created_at: string;
  fan_profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null | { display_name?: string | null; avatar_url?: string | null }[];
}

const COPY = {
  title: { en: "Fan Comments", lo: "ຄອມເມັນແຟນຄັບ" },
  close: { en: "Close comments", lo: "ປິດຄອມເມັນ" },
  placeholder: { en: "Write a clean support message...", lo: "ຂຽນຂໍ້ຄວາມເຊຍທີ່ສຸພາບ..." },
  send: { en: "Send", lo: "ສົ່ງ" },
  noComments: { en: "No comments yet. Be the first supporter.", lo: "ຍັງບໍ່ມີຄອມເມັນ. ມາເປັນແຟນຄົນທຳອິດ." },
  reviewQueued: {
    en: "Comment received. It is hidden until an admin reviews it.",
    lo: "ໄດ້ຮັບຄອມເມັນແລ້ວ. ຂໍ້ຄວາມນີ້ຈະຖືກເຊື່ອງໄວ້ກ່ອນຈົນກວ່າແອດມິນຈະກວດສອບ.",
  },
  posted: { en: "Comment posted.", lo: "ສົ່ງຄອມເມັນແລ້ວ." },
  unavailable: { en: "Community data is not ready for this player.", lo: "ຂໍ້ມູນ Community ຂອງນັກກິລາຄົນນີ້ຍັງບໍ່ພ້ອມ." },
};

function profileOf(comment: FanComment) {
  const profile = comment.fan_profiles;
  return Array.isArray(profile) ? profile[0] ?? null : profile ?? null;
}

function gaEvent(name: string, params: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name, params);
}

export default function PlayerCommentModal({
  player,
  open,
  supportsCommunity,
  onClose,
  onPosted,
}: {
  player: Player;
  open: boolean;
  supportsCommunity: boolean;
  onClose: () => void;
  onPosted?: () => void;
}) {
  const { pick, lang } = useLanguage();
  const { db, session, openSignIn, ensureFanProfile } = useFanAuth();
  const [comments, setComments] = useState<FanComment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  const loadComments = async () => {
    if (!db || !supportsCommunity) return;
    setLoading(true);
    setError("");
    const { data, error: loadError } = await db
      .from("player_comments")
      .select("id, body, created_at, fan_profiles(display_name, avatar_url)")
      .eq("player_id", player.id)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(50);
    if (loadError) {
      setError(loadError.message);
    } else {
      setComments((data ?? []) as unknown as FanComment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setNotice("");
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, db, player.id, supportsCommunity]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  const submitComment = async () => {
    const cleanBody = body.trim();
    if (!session?.user) {
      openSignIn();
      return;
    }
    if (!db || !supportsCommunity || !cleanBody) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await ensureFanProfile();
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ playerId: player.id, body: cleanBody }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; status?: "visible" | "review" };
      if (!response.ok) throw new Error(result.error || "Could not send comment.");
      setBody("");
      if (result.status === "review") {
        setNotice(pick(COPY.reviewQueued));
      } else {
        setNotice(pick(COPY.posted));
        await loadComments();
        onPosted?.();
      }
      gaEvent("player_commented", {
        player_id: player.id,
        player_name: player.ign,
        comment_length: cleanBody.length,
        moderation_status: result.status || "visible",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send comment.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center overflow-hidden px-3 py-4 sm:px-5 sm:py-6" role="dialog" aria-modal="true">
      <div aria-hidden className="absolute inset-0 bg-void/55" />
      <button
        type="button"
        aria-label={pick(COPY.close)}
        className="absolute inset-0 bg-black/78 backdrop-blur-xl"
        onClick={onClose}
      />
      <section className="relative flex h-[92svh] w-full max-w-5xl flex-col overflow-hidden border border-amethyst/45 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_36%),linear-gradient(145deg,rgba(28,20,40,0.98),rgba(11,7,16,0.99))] shadow-[0_0_72px_rgba(168,85,247,0.34)] sm:h-[88vh]">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glow/85 to-transparent" />
        <span aria-hidden className="pointer-events-none absolute -left-16 top-10 h-40 w-40 bg-amethyst/16 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -right-20 bottom-10 h-44 w-44 bg-loss/10 blur-3xl" />
        <header className="relative flex items-start justify-between gap-4 border-b border-edge bg-void/55 px-4 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
              {pick(COPY.title)}
            </p>
            <h2 className="keep-latin mt-1 truncate font-display text-3xl font-black uppercase tracking-[0.08em] text-soul md:text-5xl">
              {player.ign}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={pick(COPY.close)}
            className="grid h-10 w-10 shrink-0 place-items-center border border-edge bg-void/70 text-ash transition-colors hover:border-amethyst hover:text-soul"
          >
            <X size={18} />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          {!supportsCommunity ? (
            <p className="border border-loss/40 bg-loss/10 px-4 py-3 text-sm text-loss">{pick(COPY.unavailable)}</p>
          ) : loading ? (
            <p className="border border-edge bg-void/45 px-4 py-4 font-mono text-sm text-ash">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="border border-edge bg-void/45 px-4 py-4 text-sm text-ash">{pick(COPY.noComments)}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const profile = profileOf(comment);
                const name = publicFanName(profile?.display_name);
                const avatar = publicFanAvatar(profile?.avatar_url);
                return (
                  <article key={comment.id} className="border border-edge bg-void/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-amethyst/15">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-mono text-xs font-bold text-glow">{name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-soul">{name}</p>
                        <p className="keep-latin font-mono text-[10px] text-ash-dim">
                          {new Date(comment.created_at).toLocaleString(lang === "lo" ? "lo-LA" : "en-US", { hour12: false })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-spectre">{comment.body}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="relative border-t border-edge bg-crypt/85 p-4 md:p-5">
          {error && <p className="mb-3 border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs text-loss">{error}</p>}
          {notice && <p className="mb-3 border border-win/40 bg-win/10 px-4 py-3 text-sm text-win">{notice}</p>}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 500))}
              disabled={busy || !supportsCommunity}
              placeholder={pick(COPY.placeholder)}
              rows={2}
              className="min-h-[48px] resize-none border border-edge bg-void/70 px-4 py-3 text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={busy || !supportsCommunity || !body.trim()}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={15} /> {pick(COPY.send)}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-ash-dim">{body.length}/500</span>
            <MessageCircle size={15} className="text-amethyst" />
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );
}
