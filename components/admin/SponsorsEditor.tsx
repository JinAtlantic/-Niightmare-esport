"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import { BilingualField, Button, Card, Label, TextArea, TextField } from "@/components/admin/ui";
import type { Bilingual, Sponsor, SponsorTier } from "@/lib/types";

interface SponsorsPageCopy {
  heroTitle: Bilingual;
  heroSubtitle: Bilingual;
  partnersLabel: Bilingual;
  tiersLabel: Bilingual;
  tiersIntro: Bilingual;
}

interface SponsorsFile {
  page?: SponsorsPageCopy;
  sponsors: Sponsor[];
  tiers: SponsorTier[];
}

const DEFAULT_PAGE: SponsorsPageCopy = {
  heroTitle: { en: "PARTNER WITH NIIGHTMARE", lo: "ຮ່ວມເປັນພາກສ່ວນກັບ NIIGHTMARE" },
  heroSubtitle: {
    en: "Join us as we dominate the Lao esports scene",
    lo: "ມາຮ່ວມກັບພວກເຮົາໃນຂະນະທີ່ພວກເຮົາຄອງວົງການອີສະປອດລາວ",
  },
  partnersLabel: { en: "OUR PARTNERS", lo: "ພາກສ່ວນຂອງພວກເຮົາ" },
  tiersLabel: { en: "SPONSORSHIP TIERS", lo: "ລະດັບການສະໜັບສະໜູນ" },
  tiersIntro: {
    en: "Three ways to put your brand in front of a passionate Lao gaming audience.",
    lo: "ສາມທາງໃນການນໍາແບຣນຂອງທ່ານໄປຫາຜູ້ຊົມເກມລາວທີ່ມີຄວາມຫຼົງໄຫຼ.",
  },
};

const uid = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function BilingualTextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-2 md:grid-cols-2">
        <TextArea
          label="EN"
          value={value.en}
          rows={rows}
          onChange={(en) => onChange({ ...value, en })}
        />
        <TextArea
          label="ລາວ"
          value={value.lo}
          rows={rows}
          onChange={(lo) => onChange({ ...value, lo })}
        />
      </div>
    </div>
  );
}

export default function SponsorsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<SponsorsFile>("sponsors");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด...</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { sponsors, tiers } = data;
  const page = { ...DEFAULT_PAGE, ...(data.page ?? {}) };
  const patchPage = (patch: Partial<SponsorsPageCopy>) =>
    setData({ ...data, page: { ...page, ...patch } });
  const setSponsors = (next: Sponsor[]) => setData({ ...data, sponsors: next });
  const setTiers = (next: SponsorTier[]) => setData({ ...data, tiers: next });

  const patchSponsor = (i: number, patch: Partial<Sponsor>) =>
    setSponsors(sponsors.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const patchTier = (i: number, patch: Partial<SponsorTier>) =>
    setTiers(tiers.map((tier, idx) => (idx === i ? { ...tier, ...patch } : tier)));
  const patchBenefit = (tierIndex: number, benefitIndex: number, value: SponsorTier["benefits"][number]) => {
    const tier = tiers[tierIndex];
    if (!tier) return;
    const benefits = tier.benefits.map((benefit, idx) =>
      idx === benefitIndex ? value : benefit
    );
    patchTier(tierIndex, { benefits });
  };

  const addSponsor = () =>
    setSponsors([
      ...sponsors,
      { id: uid("s"), name: "New Partner", url: "#" },
    ]);

  const addTier = () =>
    setTiers([
      ...tiers,
      {
        id: uid("tier"),
        name: { en: "NEW SPONSOR TIER", lo: "ລະດັບສະປອນເຊີໃໝ່" },
        color: "#A855F7",
        benefits: [{ en: "Benefit detail", lo: "ລາຍລະອຽດສິດປະໂຫຍດ" }],
      },
    ]);

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          {sponsors.length} partners / {tiers.length} tiers
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && (
            <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>
          )}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            Sponsors Page Copy
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            ข้อความบนหน้า Sponsors ทั้งหมดควรแก้จากตรงนี้ ไม่ต้องแก้โค้ด
          </p>
        </div>

        <Card className="space-y-4">
          <BilingualField
            label="Hero title"
            value={page.heroTitle}
            onChange={(heroTitle) => patchPage({ heroTitle })}
          />
          <BilingualTextArea
            label="Hero subtitle"
            value={page.heroSubtitle}
            onChange={(heroSubtitle) => patchPage({ heroSubtitle })}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <BilingualField
              label="Partners section label"
              value={page.partnersLabel}
              onChange={(partnersLabel) => patchPage({ partnersLabel })}
            />
            <BilingualField
              label="Tiers section label"
              value={page.tiersLabel}
              onChange={(tiersLabel) => patchPage({ tiersLabel })}
            />
          </div>
          <BilingualTextArea
            label="Tiers intro"
            value={page.tiersIntro}
            onChange={(tiersIntro) => patchPage({ tiersIntro })}
          />
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
              Partners
            </h2>
            <p className="mt-1 font-mono text-[11px] text-ash">
              รายชื่อพาร์ทเนอร์ที่แสดงในหน้า Sponsors
            </p>
          </div>
          <Button onClick={addSponsor}>+ เพิ่ม partner</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sponsors.map((sponsor, i) => (
            <Card key={sponsor.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-spectre">
                  {sponsor.name || "New Partner"}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button onClick={() => setSponsors(move(sponsors, i, -1))}>↑</Button>
                  <Button onClick={() => setSponsors(move(sponsors, i, 1))}>↓</Button>
                  <Button
                    variant="danger"
                    onClick={() => setSponsors(sponsors.filter((_, idx) => idx !== i))}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
              <TextField
                label="ชื่อ partner"
                value={sponsor.name}
                onChange={(name) => patchSponsor(i, { name })}
              />
              <TextField
                label="ลิงก์"
                value={sponsor.url}
                onChange={(url) => patchSponsor(i, { url })}
                placeholder="https://... หรือ #"
              />
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
              Sponsorship Tiers
            </h2>
            <p className="mt-1 font-mono text-[11px] text-ash">
              แพ็กเกจสปอนเซอร์และสิทธิประโยชน์ที่ใช้ต่อรองราคา
            </p>
          </div>
          <Button onClick={addTier}>+ เพิ่ม tier</Button>
        </div>

        <div className="space-y-4">
          {tiers.map((tier, i) => (
            <Card key={tier.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-spectre">
                  {tier.name.en || tier.name.lo || "New tier"}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button onClick={() => setTiers(move(tiers, i, -1))}>↑</Button>
                  <Button onClick={() => setTiers(move(tiers, i, 1))}>↓</Button>
                  <Button
                    variant="danger"
                    onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                  >
                    ลบ
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <BilingualField
                  label="ชื่อ tier"
                  value={tier.name}
                  onChange={(name) => patchTier(i, { name })}
                />
                <TextField
                  label="สี accent"
                  value={tier.color}
                  onChange={(color) => patchTier(i, { color })}
                  placeholder="#A855F7"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                    Benefits
                  </h3>
                  <Button
                    onClick={() =>
                      patchTier(i, {
                        benefits: [
                          ...tier.benefits,
                          { en: "New benefit", lo: "ສິດປະໂຫຍດໃໝ່" },
                        ],
                      })
                    }
                  >
                    + benefit
                  </Button>
                </div>
                <div className="space-y-3">
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <BilingualField
                        label={`Benefit ${benefitIndex + 1}`}
                        value={benefit}
                        onChange={(value) => patchBenefit(i, benefitIndex, value)}
                      />
                      <div className="flex items-end">
                        <Button
                          variant="danger"
                          onClick={() =>
                            patchTier(i, {
                              benefits: tier.benefits.filter(
                                (_, idx) => idx !== benefitIndex
                              ),
                            })
                          }
                        >
                          ลบ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
