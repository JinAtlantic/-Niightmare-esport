"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useFanAuth } from "@/components/context/FanAuthContext";
import TeamCommentModal from "@/components/community/TeamCommentModal";

const COPY = {
  kicker: { en: "Support the club", lo: "ເຊຍສະໂມສອນ" },
  like: { en: "Like", lo: "ກົດໃຈ" },
  liked: { en: "Liked", lo: "ກົດໃຈແລ້ວ" },
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
      {/* Slim utility row — secondary to the hero's primary Shop CTA. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-spectre/55">
          {pick(COPY.kicker)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy || !supportsCommunity}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-md border px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              liked
                ? "border-loss/60 bg-loss/10 text-loss"
                : "border-edge-bright/70 bg-void/40 text-spectre hover:border-amethyst hover:text-soul"
            }`}
          >
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
            <span>{liked ? pick(COPY.liked) : pick(COPY.like)}</span>
            {likes > 0 && (
              <span className="keep-latin font-mono text-[11px] text-ash">{likes}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCommentOpen(true)}
            disabled={!supportsCommunity}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-md border border-edge-bright/70 bg-void/40 px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-spectre backdrop-blur-sm transition-colors hover:border-amethyst hover:text-soul disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MessageCircle size={15} />
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
