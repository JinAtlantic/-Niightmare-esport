"use client";

import React from "react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Reveal from "@/components/ui/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { Bilingual } from "@/lib/types";

interface SnapshotStat {
  id: string;
  value: string;
  label: Bilingual;
  detail: Bilingual;
}

interface SnapshotPillar {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

interface SnapshotCta {
  label: Bilingual;
  href: string;
}

interface HomeSnapshot {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  stats: SnapshotStat[];
  pillars: SnapshotPillar[];
  primaryCta: SnapshotCta;
  secondaryCta: SnapshotCta;
}

const FALLBACK_SNAPSHOT: HomeSnapshot = {
  kicker: { en: "PARTNER-READY CLUB PROFILE", lo: "ໂປຣໄຟລ໌ທີມສໍາລັບພາກສ່ວນ" },
  title: { en: "TEAM SNAPSHOT", lo: "ພາບລວມຂອງທີມ" },
  intro: {
    en: "A fast read for fans, media, and brands: the competitions we play, the roster behind the tag, and the sponsor paths built into the club.",
    lo: "ພາບລວມສໍາລັບແຟນ, ສື່ ແລະ ແບຣນ: ລາຍການທີ່ເຮົາແຂ່ງ, ນັກກິລາໃນທີມ ແລະ ເສັ້ນທາງສໍາລັບພາກສ່ວນທີ່ຢາກຮ່ວມງານ.",
  },
  stats: [
    { id: "divisions", value: "2", label: { en: "DIVISIONS", lo: "ປະເພດເກມ" }, detail: { en: "MLBB / eFootball", lo: "MLBB / eFootball" } },
    { id: "roster", value: "8", label: { en: "ROSTER", lo: "ນັກກິລາ" }, detail: { en: "Active players across the current lineup.", lo: "ນັກກິລາທີ່ຢູ່ໃນລາຍຊື່ປັດຈຸບັນ." } },
    { id: "honours", value: "1", label: { en: "HONOURS", lo: "ລາງວັນ" }, detail: { en: "Tournament placements already in the cabinet.", lo: "ຜົນງານການແຂ່ງຂັນທີ່ຢູ່ໃນຕູ້ລາງວັນ." } },
    { id: "partners", value: "3+", label: { en: "PARTNER TIERS", lo: "ລະດັບພາກສ່ວນ" }, detail: { en: "Structured options for brands and community partners.", lo: "ທາງເລືອກສໍາລັບແບຣນ ແລະ ພາກສ່ວນຊຸມຊົນ." } },
  ],
  pillars: [
    { id: "matchday", title: { en: "MATCHDAY PRESENCE", lo: "ພ້ອມສໍາລັບວັນແຂ່ງ" }, body: { en: "The headline fixture gives visitors the next battle, opponent, tournament, and kickoff without digging through pages.", lo: "ຜູ້ເຂົ້າຊົມເຫັນນັດຕໍ່ໄປ, ຄູ່ແຂ່ງ, ລາຍການ ແລະ ເວລາເລີ່ມໄດ້ທັນທີ." } },
    { id: "proof", title: { en: "PROOF OF LEVEL", lo: "ຫຼັກຖານຂອງລະດັບ" }, body: { en: "Honours, match history, and news make the team look active instead of like a static logo page.", lo: "ລາງວັນ, ປະຫວັດການແຂ່ງ ແລະ ຂ່າວ ຊ່ວຍໃຫ້ທີມເບິ່ງມີການເຄື່ອນໄຫວ." } },
    { id: "partners", title: { en: "BUSINESS FLOW", lo: "ເສັ້ນທາງທຸລະກິດ" }, body: { en: "Sponsor and contact routes are visible from the home page, which helps with price discussions and partner trust.", lo: "ລິ້ງສໍາລັບສະປອນເຊີ ແລະ ການຕິດຕໍ່ຢູ່ໃນໜ້າຫຼັກ ຊ່ວຍໃນການຕໍ່ລອງ ແລະ ສ້າງຄວາມເຊື່ອໃຈ." } },
  ],
  primaryCta: { label: { en: "VIEW SPONSOR PATHS", lo: "ເບິ່ງທາງເລືອກສະປອນເຊີ" }, href: "/sponsors" },
  secondaryCta: { label: { en: "START A DEAL", lo: "ເລີ່ມຕິດຕໍ່ທຸລະກິດ" }, href: "/contact" },
};

function StatTile({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="group relative min-h-[154px] overflow-hidden border border-edge bg-gradient-to-br from-crypt/80 via-crypt/45 to-void/70 px-4 py-4 transition-colors duration-300 hover:border-amethyst/65 sm:min-h-[176px] sm:px-5 sm:py-6">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent opacity-70"
      />
      <span
        aria-hidden
        className="absolute -right-10 -top-10 h-24 w-24 border border-amethyst/20 bg-amethyst/5 blur-sm transition-opacity duration-300 group-hover:opacity-80"
      />
      <p className="relative font-display text-4xl font-bold uppercase leading-none text-soul [text-shadow:0_0_24px_rgba(168,85,247,0.35)] md:text-5xl">
        {value}
      </p>
      <p className="relative mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amethyst sm:text-[11px] sm:tracking-[0.22em]">
        {label}
      </p>
      <p className="relative mt-2 text-xs leading-relaxed text-ash sm:text-sm">{detail}</p>
    </div>
  );
}

export default function TeamSnapshot() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const snapshot = ((site as { homeSnapshot?: HomeSnapshot }).homeSnapshot ?? FALLBACK_SNAPSHOT);
  const stats = snapshot.stats.length ? snapshot.stats : FALLBACK_SNAPSHOT.stats;

  return (
    <section className="relative overflow-hidden border-y border-edge bg-gradient-to-b from-void via-crypt/35 to-void">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-64 w-[min(760px,92vw)] -translate-x-1/2 bg-amethyst/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045] [mask-image:linear-gradient(180deg,transparent,#000_18%,#000_82%,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.9) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-24 md:px-6 md:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel centered>
              {pick(snapshot.title)}
            </SectionLabel>
            <p className="mt-4 text-sm leading-relaxed text-ash sm:text-base md:mt-5 md:text-lg">
              {pick(snapshot.intro)}
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
          {stats.slice(0, 4).map((stat, i) => (
            <Reveal key={stat.id} delay={i * 80}>
              <StatTile value={stat.value} label={pick(stat.label)} detail={pick(stat.detail)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
