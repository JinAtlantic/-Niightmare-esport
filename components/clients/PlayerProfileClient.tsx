"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { calculateAge, countryFlag, formatBirthDate } from "@/lib/personProfile";
import type { Player } from "@/lib/types";

const COPY = {
  back: { en: "Back to roster", lo: "ກັບໄປຫາ roster" },
  about: { en: "Player Profile", lo: "ໂປຣໄຟລ໌ນັກກິລາ" },
};

export default function PlayerProfileClient({ player }: { player: Player }) {
  const { pick, lang } = useLanguage();
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const flag = countryFlag(player.countryCode);
  const birthDate = formatBirthDate(player.birthDate, lang);
  const age = calculateAge(player.birthDate);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <Link
        href="/roster"
        className="inline-flex items-center border border-edge bg-crypt px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul"
      >
        {pick(COPY.back)}
      </Link>

      <div className="mt-6 mx-auto w-full max-w-md overflow-hidden border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.88),rgba(11,7,16,1))]">
        <div className="relative aspect-[3/4] overflow-hidden bg-void">
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.ign}
              fill
              sizes="(min-width: 768px) 28rem, 100vw"
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

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {player.name && (
            <div className="border border-edge bg-void/45 px-3 py-2 sm:col-span-2">
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
    </section>
  );
}
