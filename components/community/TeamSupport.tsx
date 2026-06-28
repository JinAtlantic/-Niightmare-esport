"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useFanAuth } from "@/components/context/FanAuthContext";
import TeamCommentModal from "@/components/community/TeamCommentModal";

const COPY = {
  kicker: { en: "Support the club", lo: "ເຊຍສະໂມສອນ" },
  like: { en: "Like NIIGHTMARE", lo: "ກົດໃຈ NIIGHTMARE" },
  liked: { en: "Liked NIIGHTMARE", lo: "ກົດໃຈ NIIGHTMARE ແລ້ວ" },
  comment: { en: "Comment", lo: "ຄອມເມັນ" },
};

function gaEvent(name: string, params: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name, params);
}

export default function TeamSupport() {
  const { pick } = useLanguage();
  const { db, session, openSignIn, ensureFanProfile } = useFanAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const supportsCommunity = Boolean(db && ready);

  const loadLikeState = async () => {
    if (!db) return;
    const { count, error } = await db.from("team_likes").select("id", { count: "exact", head: true });
    if (error) {
      setReady(false);
      return;
    }
    setReady(true);
    setLikes(count ?? 0);

    if (session?.user) {
      const { data } = await db
        .from("team_likes")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setLiked(Boolean(data));
    } else {
      setLiked(false);
    }
  };

  useEffect(() => {
    loadLikeState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, session?.user.id]);

  const toggleLike = async () => {
    if (!session?.user) {
      openSignIn();
      return;
    }
    if (!db || !supportsCommunity) return;
    setBusy(true);
    try {
      await ensureFanProfile();
      if (liked) {
        const { error } = await db.from("team_likes").delete().eq("user_id", session.user.id);
        if (error) throw error;
        setLiked(false);
        setLikes((value) => Math.max(0, value - 1));
      } else {
        const { error } = await db.from("team_likes").insert({ user_id: session.user.id });
        if (error) throw error;
        setLiked(true);
        setLikes((value) => value + 1);
      }
      gaEvent("team_voted", {
        team_name: "NIIGHTMARE",
        liked: !liked,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="max-w-xl border border-amethyst/40 bg-void/50 p-2 shadow-[0_0_28px_rgba(168,85,247,0.18)] backdrop-blur-md">
        <p className="px-2 pb-2 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
          {pick(COPY.kicker)}
        </p>
        <div className="grid gap-2 sm:grid-cols-[1.15fr_0.85fr]">
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy || !supportsCommunity}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 border px-4 py-3 font-display text-sm font-black uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              liked
                ? "border-loss/60 bg-loss/12 text-loss shadow-[0_0_22px_rgba(251,113,133,0.22)]"
                : "border-amethyst/70 bg-amethyst/15 text-soul hover:bg-amethyst/25 hover:shadow-[0_0_26px_rgba(168,85,247,0.28)]"
            }`}
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
            <span>{liked ? pick(COPY.liked) : pick(COPY.like)}</span>
            <span className="keep-latin font-mono text-[11px] text-spectre">{likes}</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentOpen(true)}
            disabled={!supportsCommunity}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-edge-bright bg-void/55 px-4 py-3 font-display text-sm font-black uppercase tracking-[0.14em] text-soul transition-colors hover:border-amethyst hover:bg-amethyst/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MessageCircle size={17} />
            {pick(COPY.comment)}
          </button>
        </div>
      </div>
      <TeamCommentModal
        open={commentOpen}
        supportsCommunity={supportsCommunity}
        onClose={() => setCommentOpen(false)}
      />
    </>
  );
}
