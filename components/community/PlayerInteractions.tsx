"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useFanAuth } from "@/components/context/FanAuthContext";
import PlayerCommentModal from "@/components/community/PlayerCommentModal";
import type { Player } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COPY = {
  like: { en: "Like", lo: "ກົດໃຈ" },
  liked: { en: "Liked", lo: "ກົດແລ້ວ" },
  comments: { en: "Comment", lo: "ຄອມເມັນ" },
};

function gaEvent(name: string, params: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name, params);
}

export default function PlayerInteractions({ player }: { player: Player }) {
  const { pick } = useLanguage();
  const { db, session, openSignIn, ensureFanProfile } = useFanAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const supportsCommunity = Boolean(db && UUID.test(player.id));

  const loadLikeState = async () => {
    if (!db || !supportsCommunity) return;
    const { count } = await db
      .from("player_likes")
      .select("id", { count: "exact", head: true })
      .eq("player_id", player.id);
    setLikes(count ?? 0);

    if (session?.user) {
      const { data } = await db
        .from("player_likes")
        .select("id")
        .eq("player_id", player.id)
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
  }, [db, session?.user.id, player.id, supportsCommunity]);

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
        const { error } = await db
          .from("player_likes")
          .delete()
          .eq("player_id", player.id)
          .eq("user_id", session.user.id);
        if (error) throw error;
        setLiked(false);
        setLikes((value) => Math.max(0, value - 1));
      } else {
        const { error } = await db.from("player_likes").insert({
          player_id: player.id,
          user_id: session.user.id,
        });
        if (error) throw error;
        setLiked(true);
        setLikes((value) => value + 1);
      }
      gaEvent("player_voted", {
        player_id: player.id,
        player_name: player.ign,
        liked: !liked,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 border-x border-b border-edge bg-crypt/70 p-2">
        <button
          type="button"
          onClick={toggleLike}
          disabled={busy || !supportsCommunity}
          className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 border px-2 py-2 font-display text-xs font-black uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            liked
              ? "border-loss/60 bg-loss/12 text-loss shadow-[0_0_18px_rgba(251,113,133,0.18)]"
              : "border-edge bg-void/45 text-soul hover:border-amethyst hover:bg-amethyst/15"
          }`}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
          <span>{liked ? pick(COPY.liked) : pick(COPY.like)}</span>
          <span className="keep-latin font-mono text-[10px] text-ash">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          disabled={!supportsCommunity}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 border border-edge bg-void/45 px-2 py-2 font-display text-xs font-black uppercase tracking-[0.12em] text-soul transition-colors hover:border-amethyst hover:bg-amethyst/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <MessageCircle size={15} />
          {pick(COPY.comments)}
        </button>
      </div>
      <PlayerCommentModal
        player={player}
        open={commentOpen}
        supportsCommunity={supportsCommunity}
        onClose={() => setCommentOpen(false)}
      />
    </>
  );
}
