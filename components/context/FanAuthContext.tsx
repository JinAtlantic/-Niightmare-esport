"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Camera, LogIn, LogOut, Mail, Trash2, X } from "lucide-react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useLanguage } from "@/components/context/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { publicFanAvatar, publicFanName } from "@/lib/safety";

export interface FanProfile {
  display_name: string | null;
  avatar_url: string | null;
  pending_avatar_url?: string | null;
}

interface FanAuthContextValue {
  db: SupabaseClient | null;
  session: Session | null;
  profile: FanProfile | null;
  ready: boolean;
  busy: boolean;
  openSignIn: () => void;
  openProfile: () => void;
  signOut: () => Promise<void>;
  ensureFanProfile: () => Promise<void>;
}

const COPY = {
  title: { en: "Sign in to join the fan zone", lo: "ເຂົ້າລະບົບເພື່ອຮ່ວມ Fan Zone" },
  intro: {
    en: "Use Google for one-click access, or receive a secure Magic Link by email.",
    lo: "ໃຊ້ Google ເພື່ອເຂົ້າໄວ ຫຼື ຮັບ Magic Link ທີ່ປອດໄພຜ່ານອີເມວ.",
  },
  google: { en: "Continue with Google", lo: "ເຂົ້າດ້ວຍ Google" },
  magicTitle: { en: "Magic Link", lo: "Magic Link" },
  email: { en: "your@email.com", lo: "your@email.com" },
  send: { en: "Send Magic Link", lo: "ສົ່ງ Magic Link" },
  sent: {
    en: "Magic Link sent. Check your email and return to this page after signing in.",
    lo: "ສົ່ງ Magic Link ແລ້ວ. ກວດອີເມວ ແລ້ວກັບມາໜ້ານີ້ຫຼັງເຂົ້າລະບົບ.",
  },
  unavailable: { en: "Fan login is not configured yet.", lo: "Fan login ຍັງບໍ່ພ້ອມໃຊ້ງານ." },
  invalidEmail: { en: "Enter a valid email address.", lo: "ກະລຸນາໃສ່ອີເມວໃຫ້ຖືກຕ້ອງ." },
  // Profile editor
  profileTitle: { en: "Your fan profile", lo: "ໂປຣໄຟລ໌ແຟນຄັບຂອງທ່ານ" },
  profileIntro: {
    en: "Pick a display name and photo for your comments. No real name or photo required.",
    lo: "ຕັ້ງຊື່ ແລະ ຮູບທີ່ຈະສະແດງເວລາຄອມເມັນ. ບໍ່ຈຳເປັນຕ້ອງໃຊ້ຊື່ ຫຼື ຮູບຈິງ.",
  },
  nameLabel: { en: "Display name", lo: "ຊື່ທີ່ສະແດງ" },
  photoLabel: { en: "Profile photo", lo: "ຮູບໂປຣໄຟລ໌" },
  changePhoto: { en: "Upload photo", lo: "ອັບໂຫລດຮູບ" },
  removePhoto: { en: "Remove photo", lo: "ລົບຮູບ" },
  save: { en: "Save profile", lo: "ບັນທຶກໂປຣໄຟລ໌" },
  saving: { en: "Saving...", lo: "ກຳລັງບັນທຶກ..." },
  signOut: { en: "Sign out", lo: "ອອກຈາກລະບົບ" },
  checking: { en: "Checking image...", lo: "ກຳລັງກວດຮູບ..." },
  unsafePhoto: {
    en: "This image can't be used (it looks explicit). Please pick another.",
    lo: "ຮູບນີ້ໃຊ້ບໍ່ໄດ້ (ອາດມີເນື້ອຫາບໍ່ເໝາະສົມ). ກະລຸນາເລືອກຮູບອື່ນ.",
  },
  noChange: { en: "No changes to save.", lo: "ບໍ່ມີການປ່ຽນແປງ." },
  savedName: { en: "Profile saved.", lo: "ບັນທຶກໂປຣໄຟລ໌ແລ້ວ." },
};

const FanAuthContext = createContext<FanAuthContextValue | null>(null);

function displayName(user: User) {
  return publicFanName(
    user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.preferred_username
  );
}

function avatarUrl(user: User) {
  return publicFanAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture);
}

export function FanAuthProvider({ children }: { children: React.ReactNode }) {
  const { pick } = useLanguage();
  const db = useMemo(() => getSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Profile editor state
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const upsertFanProfile = useCallback(
    async (user: User) => {
      if (!db) return;
      // Insert-only: create the row once, never overwrite a customized profile.
      await db.from("fan_profiles").upsert(
        {
          id: user.id,
          display_name: displayName(user),
          avatar_url: avatarUrl(user),
          provider: user.app_metadata?.provider ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    },
    [db]
  );

  const loadProfile = useCallback(
    async (userId: string) => {
      if (!db) return;
      const full = await db
        .from("fan_profiles")
        .select("display_name, avatar_url, pending_avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (!full.error) {
        setProfile((full.data as FanProfile) ?? null);
        return;
      }
      // pending_avatar_url column may not exist yet — fall back gracefully.
      const basic = await db.from("fan_profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle();
      setProfile((basic.data as FanProfile) ?? null);
    },
    [db]
  );

  const syncUser = useCallback(
    async (user: User) => {
      await upsertFanProfile(user);
      await loadProfile(user.id);
    },
    [upsertFanProfile, loadProfile]
  );

  const refreshSession = useCallback(async () => {
    if (!db) return;
    const { data } = await db.auth.getSession();
    setSession(data.session ?? null);
    if (data.session?.user) {
      await syncUser(data.session.user);
      setModalOpen(false);
    }
  }, [db, syncUser]);

  useEffect(() => {
    if (!db) {
      setReady(true);
      return;
    }

    db.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) await syncUser(data.session.user);
      setReady(true);
    });

    const { data: listener } = db.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) await syncUser(nextSession.user);
      else setProfile(null);
      if (nextSession) setModalOpen(false);
      setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [db, syncUser]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string })?.type === "niightmare-auth-complete") {
        refreshSession();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshSession]);

  useEffect(() => {
    document.body.style.overflow = modalOpen || profileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, profileOpen]);

  const openSignIn = useCallback(() => {
    setError("");
    setSent(false);
    setModalOpen(true);
  }, []);

  const openProfile = useCallback(() => {
    if (!session?.user) {
      openSignIn();
      return;
    }
    setProfileError("");
    setProfileNotice("");
    setAvatarFile(null);
    setAvatarPreview("");
    setRemovePhoto(false);
    setNameInput(profile?.display_name || displayName(session.user));
    setProfileOpen(true);
  }, [session, profile, openSignIn]);

  const signOut = useCallback(async () => {
    if (!db) return;
    await db.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileOpen(false);
  }, [db]);

  const ensureFanProfile = useCallback(async () => {
    if (session?.user) await upsertFanProfile(session.user);
  }, [session, upsertFanProfile]);

  const signInWithGoogle = async () => {
    if (!db) {
      setError(pick(COPY.unavailable));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data, error: authError } = await db.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`,
          skipBrowserRedirect: true,
        },
      });
      if (authError) throw authError;
      if (!data.url) throw new Error(pick(COPY.unavailable));
      const popup = window.open(data.url, "niightmare-google-auth", "width=520,height=680");
      if (!popup) {
        window.location.assign(data.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : pick(COPY.unavailable));
    } finally {
      setBusy(false);
    }
  };

  const signInWithMagicLink = async () => {
    if (!db) {
      setError(pick(COPY.unavailable));
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(pick(COPY.invalidEmail));
      return;
    }
    setBusy(true);
    setError("");
    setSent(false);
    try {
      const { error: magicError } = await db.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.href,
          shouldCreateUser: true,
        },
      });
      if (magicError) throw magicError;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : pick(COPY.unavailable));
    } finally {
      setBusy(false);
    }
  };

  const onPickAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-picked after a rejection
    if (!file) return;
    setProfileError("");
    setProfileNotice("");
    // The avatar is screened by the server (lib/nsfwServer) on save — an unsafe
    // photo is rejected there, so there is no heavy in-browser model to run here.
    setAvatarFile(file);
    setRemovePhoto(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!session?.user) return;
    setSavingProfile(true);
    setProfileError("");
    setProfileNotice("");
    try {
      const form = new FormData();
      const name = nameInput.trim();
      if (name && name !== (profile?.display_name ?? "")) form.append("displayName", name);
      if (removePhoto) form.append("removeAvatar", "1");
      else if (avatarFile) form.append("avatar", avatarFile);

      if (Array.from(form.keys()).length === 0) {
        setProfileNotice(pick(COPY.noChange));
        setSavingProfile(false);
        return;
      }

      const res = await fetch("/api/community/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const result = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(result.error || "Could not save profile.");
      await loadProfile(session.user.id);
      setAvatarFile(null);
      setAvatarPreview("");
      setRemovePhoto(false);
      setProfileNotice(pick(COPY.savedName));
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const value = useMemo<FanAuthContextValue>(
    () => ({ db, session, profile, ready, busy, openSignIn, openProfile, signOut, ensureFanProfile }),
    [db, session, profile, ready, busy, openSignIn, openProfile, signOut, ensureFanProfile]
  );

  // Owner's own view may show a pending (not-yet-approved) photo so they can see
  // it uploaded; the public only ever sees the approved avatar_url.
  const previewAvatar = removePhoto
    ? ""
    : avatarPreview || profile?.pending_avatar_url || profile?.avatar_url || "";
  const initials = (nameInput || profile?.display_name || "NM").slice(0, 2).toUpperCase();

  return (
    <FanAuthContext.Provider value={value}>
      {children}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center px-4 py-6" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close sign in"
            className="absolute inset-0 bg-black/78 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md border border-edge bg-[linear-gradient(145deg,rgba(28,20,40,0.98),rgba(11,7,16,0.98))] p-5 shadow-[0_0_42px_rgba(168,85,247,0.22)] md:p-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center border border-edge text-ash transition-colors hover:border-amethyst hover:text-soul"
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
              NIIGHTMARE AUTH
            </p>
            <h2 className="mt-3 pr-8 font-display text-2xl font-black uppercase tracking-[0.08em] text-soul">
              {pick(COPY.title)}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">{pick(COPY.intro)}</p>

            {error && <p className="mt-4 border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs text-loss">{error}</p>}
            {sent && <p className="mt-4 border border-win/40 bg-win/10 px-4 py-3 text-sm text-win">{pick(COPY.sent)}</p>}

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={busy || !db}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul shadow-[0_0_22px_rgba(168,85,247,0.18)] transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LogIn size={16} /> {pick(COPY.google)}
            </button>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-edge" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ash-dim">or</span>
              <span className="h-px flex-1 bg-edge" />
            </div>

            <div className="border border-edge bg-void/45 p-4">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amethyst">
                <Mail size={14} /> {pick(COPY.magicTitle)}
              </p>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSent(false);
                }}
                disabled={busy}
                placeholder={pick(COPY.email)}
                className="min-h-[46px] w-full border border-edge bg-void/70 px-4 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst disabled:opacity-50"
              />
              <button
                type="button"
                onClick={signInWithMagicLink}
                disabled={busy || !db}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center border border-amethyst bg-amethyst/15 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pick(COPY.send)}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && session?.user && (
        <div className="fixed inset-0 z-[90] grid place-items-center px-4 py-6" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close profile"
            className="absolute inset-0 bg-black/78 backdrop-blur-sm"
            onClick={() => setProfileOpen(false)}
          />
          <div className="relative w-full max-w-md border border-edge bg-[linear-gradient(145deg,rgba(28,20,40,0.98),rgba(11,7,16,0.98))] p-5 shadow-[0_0_42px_rgba(168,85,247,0.22)] md:p-6">
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center border border-edge text-ash transition-colors hover:border-amethyst hover:text-soul"
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">NIIGHTMARE</p>
            <h2 className="mt-3 pr-8 font-display text-2xl font-black uppercase tracking-[0.08em] text-soul">
              {pick(COPY.profileTitle)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ash">{pick(COPY.profileIntro)}</p>

            {profileError && (
              <p className="mt-4 border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs text-loss">{profileError}</p>
            )}
            {profileNotice && (
              <p className="mt-4 border border-win/40 bg-win/10 px-4 py-3 text-sm text-win">{profileNotice}</p>
            )}

            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-amethyst/40 bg-amethyst/15">
                {previewAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-xl font-black text-glow">{initials}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-[38px] items-center justify-center gap-2 border border-edge bg-void/60 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:border-amethyst disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera size={14} /> {pick(COPY.changePhoto)}
                </button>
                {(previewAvatar || profile?.avatar_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemovePhoto(true);
                      setAvatarFile(null);
                      setAvatarPreview("");
                    }}
                    className="inline-flex min-h-[38px] items-center justify-center gap-2 border border-edge bg-void/60 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ash transition-colors hover:border-loss hover:text-loss"
                  >
                    <Trash2 size={14} /> {pick(COPY.removePhoto)}
                  </button>
                )}
              </div>
            </div>

            <label className="mt-5 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amethyst">
              {pick(COPY.nameLabel)}
            </label>
            <input
              type="text"
              value={nameInput}
              maxLength={40}
              onChange={(event) => setNameInput(event.target.value)}
              className="mt-2 min-h-[46px] w-full border border-edge bg-void/70 px-4 text-sm text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
            />

            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-colors hover:bg-amethyst/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {savingProfile ? pick(COPY.saving) : pick(COPY.save)}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 border border-edge bg-void/50 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-loss hover:text-loss"
            >
              <LogOut size={14} /> {pick(COPY.signOut)}
            </button>
          </div>
        </div>
      )}
    </FanAuthContext.Provider>
  );
}

export function useFanAuth() {
  const ctx = useContext(FanAuthContext);
  if (!ctx) throw new Error("useFanAuth must be used within FanAuthProvider");
  return ctx;
}
