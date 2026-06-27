"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, LogIn, LogOut, MessageCircle, Send, Smartphone, Timer } from "lucide-react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useLanguage } from "@/components/context/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { calculateAge, countryFlag, formatBirthDate } from "@/lib/personProfile";
import type { Player } from "@/lib/types";

type AuthProvider = "google" | "facebook";

interface FanComment {
  id: string;
  body: string;
  created_at: string;
  fan_profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

const COPY = {
  back: { en: "Back to roster", lo: "ກັບໄປຫາ roster" },
  community: { en: "Fan Community", lo: "ຊຸມຊົນແຟນຄັບ" },
  intro: {
    en: "Vote for your favourite player and leave a clean support message. Login is required to prevent spam.",
    lo: "ໂຫວດໃຫ້ນັກກິລາທີ່ທ່ານມັກ ແລະຝາກຂໍ້ຄວາມເຊຍທີ່ສຸພາບ. ຕ້ອງ login ກ່ອນເພື່ອກັນ spam.",
  },
  loginRequired: {
    en: "Login with Google, Facebook, or phone OTP to vote and comment.",
    lo: "Login ດ້ວຍ Google, Facebook ຫຼື OTP ເບີໂທ ເພື່ອໂຫວດ ແລະຄອມເມັນ.",
  },
  loginGoogle: { en: "Continue with Google", lo: "ເຂົ້າດ້ວຍ Google" },
  loginFacebook: { en: "Continue with Facebook", lo: "ເຂົ້າດ້ວຍ Facebook" },
  phoneLogin: { en: "Login with phone OTP", lo: "Login ດ້ວຍ OTP ເບີໂທ" },
  phonePlaceholder: { en: "+85620XXXXXXXX", lo: "+85620XXXXXXXX" },
  requestOtp: { en: "Request OTP", lo: "ຂໍລະຫັດ OTP" },
  otpPlaceholder: { en: "Enter 4-6 digit OTP", lo: "ໃສ່ OTP 4-6 ໂຕເລກ" },
  verifyOtp: { en: "Verify OTP", lo: "ຢືນຢັນ OTP" },
  otpSent: {
    en: "OTP sent. Check your SMS and enter the code within 3 minutes.",
    lo: "ສົ່ງ OTP ແລ້ວ. ກວດ SMS ແລະໃສ່ລະຫັດພາຍໃນ 3 ນາທີ.",
  },
  otpExpired: { en: "OTP timer expired. Request a new code.", lo: "ເວລາ OTP ໝົດແລ້ວ. ຂໍລະຫັດໃໝ່." },
  logout: { en: "Logout", lo: "ອອກຈາກລະບົບ" },
  favorite: { en: "Favorite", lo: "ຂວັນໃຈ" },
  favorited: { en: "Favorited", lo: "ໂຫວດແລ້ວ" },
  votes: { en: "fan votes", lo: "ໂຫວດຈາກແຟນ" },
  comments: { en: "Comments", lo: "ຄອມເມັນ" },
  commentPlaceholder: {
    en: "Write a short message to cheer this player...",
    lo: "ຂຽນຂໍ້ຄວາມສັ້ນໆເພື່ອເຊຍນັກກິລາຄົນນີ້...",
  },
  send: { en: "Send comment", lo: "ສົ່ງຄອມເມັນ" },
  noComments: { en: "No comments yet. Be the first supporter.", lo: "ຍັງບໍ່ມີຄອມເມັນ. ມາເປັນແຟນຄົນທຳອິດ." },
  setupNeeded: {
    en: "Community database is not ready yet. Run the Community SQL block in Supabase first.",
    lo: "ຖານຂໍ້ມູນ Community ຍັງບໍ່ພ້ອມ. ກະລຸນາ run SQL Community ໃນ Supabase ກ່ອນ.",
  },
  unavailable: {
    en: "Community login is not configured yet.",
    lo: "Community login ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ.",
  },
  about: { en: "Player Profile", lo: "ໂປຣໄຟລ໌ນັກກິລາ" },
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function displayName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    user.email ||
    user.phone ||
    "NIIGHTMARE Fan"
  );
}

function avatarUrl(user: User) {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
}

function gaEvent(name: string, params: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name, params);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

async function upsertFanProfile(db: SupabaseClient, user: User) {
  await db.from("fan_profiles").upsert({
    id: user.id,
    display_name: displayName(user),
    avatar_url: avatarUrl(user),
    provider: user.app_metadata?.provider ?? null,
  });
}

export default function PlayerProfileClient({ player }: { player: Player }) {
  const { pick, lang } = useLanguage();
  const db = useMemo(() => getSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<FanComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setupError, setSetupError] = useState(false);

  const supportsCommunity = Boolean(db && isUuid(player.id));
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const flag = countryFlag(player.countryCode);
  const birthDate = formatBirthDate(player.birthDate, lang);
  const age = calculateAge(player.birthDate);

  const loadCommunity = async (activeSession = session) => {
    if (!db || !supportsCommunity) return;
    setError("");
    const [likesResult, commentsResult] = await Promise.all([
      db.from("player_likes").select("id", { count: "exact", head: true }).eq("player_id", player.id),
      db
        .from("player_comments")
        .select("id, body, created_at, fan_profiles(display_name, avatar_url)")
        .eq("player_id", player.id)
        .eq("status", "visible")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (likesResult.error || commentsResult.error) {
      setSetupError(true);
      return;
    }
    setSetupError(false);
    setLikes(likesResult.count ?? 0);
    setComments((commentsResult.data ?? []) as unknown as FanComment[]);

    const userId = activeSession?.user.id;
    if (userId) {
      const { data, error: likedError } = await db
        .from("player_likes")
        .select("id")
        .eq("player_id", player.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!likedError) setLiked(Boolean(data));
    } else {
      setLiked(false);
    }
  };

  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) await upsertFanProfile(db, data.session.user);
      await loadCommunity(data.session ?? null);
    });
    const { data: listener } = db.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) await upsertFanProfile(db, nextSession.user);
      await loadCommunity(nextSession);
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, player.id, supportsCommunity]);

  useEffect(() => {
    if (!otpExpiresAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const next = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setSecondsLeft(next);
      if (next <= 0) setOtpExpiresAt(null);
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt]);

  const signIn = async (provider: AuthProvider) => {
    if (!db) return setError(pick(COPY.unavailable));
    setError("");
    const { error: authError } = await db.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (authError) setError(authError.message);
  };

  const signOut = async () => {
    if (!db) return;
    await db.auth.signOut();
    setSession(null);
    setLiked(false);
  };

  const requestPhoneOtp = async () => {
    if (!db) return setError(pick(COPY.unavailable));
    const cleanPhone = normalizePhone(phone);
    if (!/^\+\d{8,15}$/.test(cleanPhone)) {
      setError("Use international phone format, e.g. +85620XXXXXXXX or +66XXXXXXXXX.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: otpError } = await db.auth.signInWithOtp({
        phone: cleanPhone,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setOtp("");
      setOtpSentTo(cleanPhone);
      setOtpExpiresAt(Date.now() + 3 * 60 * 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (!db || !otpSentTo) return;
    const cleanOtp = otp.replace(/\D/g, "");
    if (!/^\d{4,6}$/.test(cleanOtp)) {
      setError("OTP must be 4-6 digits.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data, error: verifyError } = await db.auth.verifyOtp({
        phone: otpSentTo,
        token: cleanOtp,
        type: "sms",
      });
      if (verifyError) throw verifyError;
      if (data.session?.user) {
        await upsertFanProfile(db, data.session.user);
        setSession(data.session);
        await loadCommunity(data.session);
      }
      setOtp("");
      setOtpSentTo("");
      setOtpExpiresAt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async () => {
    if (!db || !session?.user || !supportsCommunity) return;
    setBusy(true);
    setError("");
    try {
      await upsertFanProfile(db, session.user);
      if (liked) {
        const { error: deleteError } = await db
          .from("player_likes")
          .delete()
          .eq("player_id", player.id)
          .eq("user_id", session.user.id);
        if (deleteError) throw deleteError;
        setLiked(false);
        setLikes((value) => Math.max(0, value - 1));
      } else {
        const { error: insertError } = await db.from("player_likes").insert({
          player_id: player.id,
          user_id: session.user.id,
        });
        if (insertError) throw insertError;
        setLiked(true);
        setLikes((value) => value + 1);
      }
      gaEvent("player_voted", {
        player_id: player.id,
        player_name: player.ign,
        liked: !liked,
      });
    } catch (e) {
      setSetupError(true);
      setError(e instanceof Error ? e.message : "Could not update vote.");
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    const body = commentBody.trim();
    if (!db || !session?.user || !supportsCommunity || !body) return;
    setBusy(true);
    setError("");
    try {
      await upsertFanProfile(db, session.user);
      const { error: insertError } = await db.from("player_comments").insert({
        player_id: player.id,
        user_id: session.user.id,
        body,
      });
      if (insertError) throw insertError;
      setCommentBody("");
      await loadCommunity(session);
      gaEvent("player_commented", {
        player_id: player.id,
        player_name: player.ign,
        comment_length: body.length,
      });
    } catch (e) {
      setSetupError(true);
      setError(e instanceof Error ? e.message : "Could not send comment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <Link
        href="/roster"
        className="inline-flex items-center border border-edge bg-crypt px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul"
      >
        {pick(COPY.back)}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="overflow-hidden border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.88),rgba(11,7,16,1))]">
          <div className="relative aspect-[3/4] overflow-hidden bg-void">
            {player.photo ? (
              <Image
                src={player.photo}
                alt={player.ign}
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                style={{
                  objectPosition: `${crop.x}% ${crop.y}%`,
                  transform: `scale(${crop.zoom})`,
                  transformOrigin: `${crop.x}% ${crop.y}%`,
                }}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amethyst-deep/40 via-crypt to-void">
                <span className="keep-latin font-display text-8xl font-black text-spectre/25">{monogram}</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/86 to-transparent p-5 pt-28">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
                {pick(COPY.about)}
              </p>
              <h1 className="keep-latin mt-2 font-display text-5xl font-black uppercase leading-none text-soul md:text-6xl">
                {player.ign}
              </h1>
              <p className="mt-3 inline-flex border-l-2 border-amethyst pl-3 font-display text-lg font-bold uppercase tracking-[0.12em] text-glow">
                {pick(player.role)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {player.name && (
              <div className="border border-edge bg-void/45 px-3 py-2 sm:col-span-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">Real name</p>
                <p className="mt-1 text-sm font-semibold text-soul">{player.name}</p>
              </div>
            )}
            {(flag || player.countryCode) && (
              <div className="border border-edge bg-void/45 px-3 py-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">Country</p>
                <p className="mt-1 text-sm font-semibold text-soul">{flag} {player.countryCode?.toUpperCase()}</p>
              </div>
            )}
            {birthDate && (
              <div className="border border-edge bg-void/45 px-3 py-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">Born</p>
                <p className="mt-1 keep-latin text-sm font-semibold text-soul">{birthDate}</p>
              </div>
            )}
            {age !== null && (
              <div className="border border-edge bg-void/45 px-3 py-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">Age</p>
                <p className="mt-1 keep-latin text-sm font-semibold text-soul">{age}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="border border-edge bg-[linear-gradient(145deg,rgba(28,20,40,0.78),rgba(11,7,16,0.98))] p-5 shadow-glow-soft md:p-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
              {pick(COPY.community)}
            </p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.08em] text-soul md:text-4xl">
              {pick(COPY.favorite)} {player.ign}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">{pick(COPY.intro)}</p>

            {setupError && (
              <p className="mt-4 border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs leading-relaxed text-loss">
                {pick(COPY.setupNeeded)}
              </p>
            )}
            {error && (
              <p className="mt-3 border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs leading-relaxed text-loss">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!session || busy || !supportsCommunity}
                onClick={toggleLike}
                className={`inline-flex min-h-[52px] items-center justify-center gap-2 border px-6 py-3 font-display text-sm font-black uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  liked
                    ? "border-loss/70 bg-loss/15 text-loss shadow-[0_0_26px_rgba(251,113,133,0.22)]"
                    : "border-amethyst bg-amethyst/15 text-soul hover:bg-amethyst/25"
                }`}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
                {liked ? pick(COPY.favorited) : pick(COPY.favorite)}
              </button>
              <div className="border border-edge bg-void/55 px-5 py-3">
                <p className="keep-latin font-display text-3xl font-black text-glow">{likes}</p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ash-dim">{pick(COPY.votes)}</p>
              </div>
            </div>

            {!session ? (
              <div className="mt-6 border border-edge bg-void/45 p-4">
                <p className="text-sm text-spectre">{pick(COPY.loginRequired)}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => signIn("google")}
                    disabled={!db}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-crypt px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:border-amethyst disabled:opacity-50"
                  >
                    <LogIn size={16} /> {pick(COPY.loginGoogle)}
                  </button>
                  <button
                    type="button"
                    onClick={() => signIn("facebook")}
                    disabled={!db}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-crypt px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:border-amethyst disabled:opacity-50"
                  >
                    <LogIn size={16} /> {pick(COPY.loginFacebook)}
                  </button>
                </div>
                <div className="mt-5 border-t border-edge pt-5">
                  <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amethyst">
                    <Smartphone size={14} /> {pick(COPY.phoneLogin)}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      disabled={busy}
                      placeholder={pick(COPY.phonePlaceholder)}
                      className="min-h-[46px] border border-edge bg-void/70 px-4 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={requestPhoneOtp}
                      disabled={!db || busy}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {pick(COPY.requestOtp)}
                    </button>
                  </div>
                  {(otpSentTo || otpExpiresAt) && (
                    <div className="mt-4 border border-edge bg-crypt/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm leading-relaxed text-spectre">
                          {secondsLeft > 0 ? pick(COPY.otpSent) : pick(COPY.otpExpired)}
                        </p>
                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-glow">
                          <Timer size={14} /> {formatCountdown(secondsLeft)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={otp}
                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                          disabled={busy || secondsLeft <= 0}
                          placeholder={pick(COPY.otpPlaceholder)}
                          className="min-h-[46px] border border-edge bg-void/70 px-4 font-mono text-center text-lg font-bold tracking-[0.25em] text-soul outline-none transition-colors placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-ash-dim focus:border-amethyst disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={verifyPhoneOtp}
                          disabled={!db || busy || secondsLeft <= 0 || !otp.trim()}
                          className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-crypt px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:border-amethyst disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {pick(COPY.verifyOtp)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between gap-3 border border-edge bg-void/45 p-4">
                <p className="min-w-0 truncate text-sm font-semibold text-spectre">
                  {displayName(session.user)}
                </p>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex shrink-0 items-center gap-2 border border-edge bg-crypt px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul"
                >
                  <LogOut size={14} /> {pick(COPY.logout)}
                </button>
              </div>
            )}
          </div>

          <div className="border border-edge bg-crypt/55 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl font-black uppercase tracking-[0.08em] text-soul">
                {pick(COPY.comments)}
              </p>
              <MessageCircle size={20} className="text-amethyst" />
            </div>

            <div className="mt-5">
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value.slice(0, 500))}
                disabled={!session || busy || !supportsCommunity}
                placeholder={pick(COPY.commentPlaceholder)}
                rows={4}
                className="w-full resize-y border border-edge bg-void/70 px-4 py-3 text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-ash-dim">{commentBody.length}/500</span>
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!session || busy || !commentBody.trim() || !supportsCommunity}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send size={15} /> {pick(COPY.send)}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {comments.length === 0 ? (
                <p className="border border-edge bg-void/45 px-4 py-4 text-sm text-ash">{pick(COPY.noComments)}</p>
              ) : (
                comments.map((comment) => {
                  const profile = Array.isArray(comment.fan_profiles)
                    ? comment.fan_profiles[0]
                    : comment.fan_profiles;
                  const name = profile?.display_name || "NIIGHTMARE Fan";
                  return (
                    <article key={comment.id} className="border border-edge bg-void/45 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-amethyst/15">
                          {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-mono text-xs font-bold text-glow">{name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-soul">{name}</p>
                          <p className="keep-latin font-mono text-[10px] text-ash-dim">
                            {new Date(comment.created_at).toLocaleString(lang === "lo" ? "lo-LA" : "en-US")}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-spectre">{comment.body}</p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
