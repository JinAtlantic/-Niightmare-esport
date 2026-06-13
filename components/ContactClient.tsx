"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import PageHeader from "@/components/PageHeader";
import {
  DiscordIcon,
  FacebookIcon,
  MailIcon,
  YoutubeIcon,
  ArrowRightIcon,
} from "@/components/Icons";
import site from "@/data/site.json";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full border border-edge bg-void/60 px-4 py-3 text-text-primary placeholder:text-text-muted/70 outline-none transition-colors focus:border-primary focus:shadow-glow-soft";

export default function ContactClient() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");

  const contactRows = [
    {
      label: site.contact.email,
      href: `mailto:${site.contact.email}`,
      Icon: MailIcon,
      external: false,
    },
    {
      label: "Facebook",
      href: site.contact.facebook,
      Icon: FacebookIcon,
      external: true,
    },
    {
      label: "YouTube",
      href: site.contact.youtube,
      Icon: YoutubeIcon,
      external: true,
    },
    {
      label: "Discord",
      href: site.contact.discord,
      Icon: DiscordIcon,
      external: true,
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("submitting");
    try {
      const res = await fetch(site.formspreeEndpoint, {
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
      <PageHeader title={t("sections.contact_us")} subtitle={t("contact.intro")} />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact info */}
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-text-primary">
              {t("contact.info_label")}
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {contactRows.map(({ label, href, Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="hover-glow flex items-center gap-4 border border-edge bg-card p-4 text-text-primary"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-edge bg-void/60 text-accent">
                    <Icon size={20} />
                  </span>
                  <span className="break-all text-sm">{label}</span>
                </a>
              ))}
            </div>

            {/* Media kit */}
            <div className="mt-8 border border-edge bg-card p-6">
              <h3 className="font-display text-base font-semibold uppercase tracking-[0.18em] text-text-primary">
                {t("contact.mediakit_label")}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{t("contact.mediakit_desc")}</p>
              <a
                href={site.mediaKitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover-glow mt-4 inline-flex items-center gap-2 border border-primary px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary hover:bg-primary/15"
              >
                {t("contact.mediakit_btn")}
                <ArrowRightIcon size={16} />
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-text-primary">
              {t("contact.form_label")}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm text-text-muted">
                  {t("contact.field_name")}
                </label>
                <input id="name" name="name" type="text" required className={inputClass} />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm text-text-muted">
                  {t("contact.field_email")}
                </label>
                <input id="email" name="email" type="email" required className={inputClass} />
              </div>

              <div>
                <label htmlFor="company" className="mb-1.5 block text-sm text-text-muted">
                  {t("contact.field_company")}
                </label>
                <input id="company" name="company" type="text" className={inputClass} />
              </div>

              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm text-text-muted">
                  {t("contact.field_type")}
                </label>
                <select id="type" name="type" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    —
                  </option>
                  <option value="Sponsorship">{t("contact.type_sponsorship")}</option>
                  <option value="Media">{t("contact.type_media")}</option>
                  <option value="General">{t("contact.type_general")}</option>
                  <option value="Tryout">{t("contact.type_tryout")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm text-text-muted">
                  {t("contact.field_message")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className={`${inputClass} resize-y`}
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="hover-glow w-full bg-primary px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-60"
              >
                {status === "submitting" ? "..." : t("contact.submit")}
              </button>

              {status === "success" ? (
                <p className="border border-win/60 bg-win/10 px-4 py-3 text-sm text-win">
                  Message sent — we will get back to you soon.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="border border-loss/60 bg-loss/10 px-4 py-3 text-sm text-loss">
                  Something went wrong. Please email {site.contact.email} directly.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
