"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  LiquipediaIcon,
  MailIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import siteSeed from "@/data/site.json";
import { safeHref, safeHttpUrl, safeMailto } from "@/lib/safety";
import type { Bilingual } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";
type ContactKey = "email" | "facebook" | "instagram" | "youtube" | "tiktok" | "discord" | "liquipedia";
type FieldKey = "name" | "email" | "company" | "type" | "message" | "attachments";
type TypeKey = "sponsorship" | "media" | "general" | "tryout";

interface ContactPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  deskLabel: Bilingual;
  deskIntro: Bilingual;
  infoLabel: Bilingual;
  mediaKitLabel: Bilingual;
  mediaKitDesc: Bilingual;
  mediaKitButton: Bilingual;
  formLabel: Bilingual;
  formIntro: Bilingual;
  fieldLabels: Record<FieldKey, Bilingual>;
  typeLabels: Record<TypeKey, Bilingual>;
  channelLabels: Record<ContactKey, Bilingual>;
  submit: Bilingual;
  submitting: Bilingual;
  success: Bilingual;
  error: Bilingual;
}

const pageSeed = siteSeed.contactPage as ContactPageCopy;

const inputClass =
  "min-h-[48px] w-full border border-edge bg-void/70 px-4 py-3 text-base text-soul placeholder:text-ash/70 outline-none transition-colors hover:border-edge-bright focus:border-amethyst focus:shadow-glow-soft";
const LIQUIPEDIA_URL = "https://liquipedia.net/mobilelegends/Niightmare_Esports";

function isOldMediaKitCopy(value?: Bilingual) {
  const en = value?.en?.toLowerCase() ?? "";
  return en.includes("media kit") || en.includes("download media") || en.includes("logos, brand usage");
}

function mergeContactPage(page?: Partial<ContactPageCopy>): ContactPageCopy {
  const merged = {
    ...pageSeed,
    ...page,
    fieldLabels: { ...pageSeed.fieldLabels, ...(page?.fieldLabels ?? {}) },
    typeLabels: { ...pageSeed.typeLabels, ...(page?.typeLabels ?? {}) },
    channelLabels: { ...pageSeed.channelLabels, ...(page?.channelLabels ?? {}) },
  };
  return {
    ...merged,
    mediaKitLabel: isOldMediaKitCopy(merged.mediaKitLabel) ? pageSeed.mediaKitLabel : merged.mediaKitLabel,
    mediaKitDesc: isOldMediaKitCopy(merged.mediaKitDesc) ? pageSeed.mediaKitDesc : merged.mediaKitDesc,
    mediaKitButton: isOldMediaKitCopy(merged.mediaKitButton) ? pageSeed.mediaKitButton : merged.mediaKitButton,
  };
}

export default function ContactClient() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const [status, setStatus] = useState<Status>("idle");
  const page = mergeContactPage((site as { contactPage?: Partial<ContactPageCopy> }).contactPage);
  const contact = site.contact as Partial<Record<ContactKey, string>>;

  const contactRows = [
    {
      key: "email" as const,
      value: contact.email,
      href: safeMailto(contact.email),
      Icon: MailIcon,
      external: false,
    },
    {
      key: "facebook" as const,
      value: contact.facebook,
      href: safeHref(contact.facebook),
      Icon: FacebookIcon,
      external: true,
    },
    {
      key: "instagram" as const,
      value: contact.instagram,
      href: safeHref(contact.instagram),
      Icon: InstagramIcon,
      external: true,
    },
    {
      key: "youtube" as const,
      value: contact.youtube,
      href: safeHref(contact.youtube),
      Icon: YoutubeIcon,
      external: true,
    },
    {
      key: "tiktok" as const,
      value: contact.tiktok,
      href: safeHref(contact.tiktok),
      Icon: TiktokIcon,
      external: true,
    },
    {
      key: "discord" as const,
      value: contact.discord,
      href: safeHref(contact.discord),
      Icon: DiscordIcon,
      external: true,
    },
    {
      key: "liquipedia" as const,
      value: LIQUIPEDIA_URL,
      href: LIQUIPEDIA_URL,
      Icon: LiquipediaIcon,
      external: true,
    },
  ].filter((row) => row.href);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("submitting");
    try {
      const endpoint = safeHttpUrl(site.formspreeEndpoint);
      if (!endpoint) throw new Error("Contact endpoint is not configured.");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <PageHeader title={pick(page.title)} subtitle={pick(page.intro)} />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-edge bg-crypt/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:p-6">
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-soul">
              {pick(page.infoLabel)}
            </h2>
            <div className="mt-5 flex flex-col gap-2.5">
              {contactRows.map(({ key, value, href, Icon, external }) => (
                <a
                  key={key}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="hover-glow group flex items-center gap-4 border border-edge bg-void/55 p-4 text-soul"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-edge bg-crypt text-amethyst transition-colors group-hover:text-glow">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">
                      {pick(page.channelLabels[key])}
                    </span>
                    <span className="keep-latin mt-1 block break-all text-sm">
                      {key === "email" ? value : href}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div id="contact-form" className="scroll-mt-24 border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.74),rgba(11,7,16,0.92))] p-5 shadow-[0_0_28px_rgba(168,85,247,0.12)] md:p-6">
            <div className="border-b border-edge pb-5">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.08em] text-soul">
                {pick(page.formLabel)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ash">{pick(page.formIntro)}</p>
            </div>

            <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.name)}
                </label>
                <input id="name" name="name" type="text" required className={inputClass} />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.email)}
                </label>
                <input id="email" name="email" type="email" required className={inputClass} />
              </div>

              <div>
                <label htmlFor="company" className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.company)}
                </label>
                <input id="company" name="company" type="text" className={inputClass} />
              </div>

              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.type)}
                </label>
                <select id="type" name="type" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    -
                  </option>
                  <option value="Sponsorship">{pick(page.typeLabels.sponsorship)}</option>
                  <option value="Media">{pick(page.typeLabels.media)}</option>
                  <option value="General">{pick(page.typeLabels.general)}</option>
                  <option value="Tryout">{pick(page.typeLabels.tryout)}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.message)}
                </label>
                <textarea id="message" name="message" rows={5} required className={`${inputClass} resize-y`} />
              </div>

              <div>
                <p className="mb-1.5 block text-sm text-ash">
                  {pick(page.fieldLabels.attachments)}
                </p>
                <label
                  htmlFor="attachments"
                  className="hover-glow inline-flex min-h-[44px] cursor-pointer items-center border border-amethyst px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-soul hover:bg-amethyst/15"
                >
                  {pick(page.mediaKitButton)}
                </label>
                <input id="attachments" name="attachments" type="file" multiple className="sr-only" />
                <p className="mt-2 text-xs leading-relaxed text-ash-dim">
                  {pick(page.mediaKitDesc)}
                </p>
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="hover-glow w-full bg-amethyst px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-60"
              >
                {status === "submitting" ? pick(page.submitting) : pick(page.submit)}
              </button>

              {status === "success" ? (
                <p className="border border-win/60 bg-win/10 px-4 py-3 text-sm text-win">
                  {pick(page.success)}
                </p>
              ) : null}
              {status === "error" ? (
                <p className="border border-loss/60 bg-loss/10 px-4 py-3 text-sm text-loss">
                  {pick(page.error)} {contact.email}.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
