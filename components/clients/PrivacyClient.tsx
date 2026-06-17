"use client";

import React from "react";
import LegalLayout, { type LegalSectionData } from "@/components/layout/LegalLayout";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";

const LAST_UPDATED = "16 June 2026";

function sections(email: string): LegalSectionData[] {
  const mail = { href: `mailto:${email}`, label: { en: email, lo: email } };
  const dot = { en: ".", lo: "." };

  return [
    {
      heading: { en: "Introduction", lo: "ບົດນຳ" },
      blocks: [
        {
          p: {
            en: "NIIGHTMARE Esports (“NIIGHTMARE”, “we”, “us”, or “our”) is an esports organization based in the Lao People’s Democratic Republic. This Privacy Policy explains what information we collect through this website, how we use it, and the choices you have. By using this website or submitting a form, you accept the practices described here.",
            lo: "NIIGHTMARE Esports (ຕໍ່ໄປນີ້ເອີ້ນວ່າ “NIIGHTMARE”, “ພວກເຮົາ” ຫຼື “ຂອງພວກເຮົາ”) ເປັນອົງກອນອີສະປອດທີ່ຕັ້ງຢູ່ ສປປ ລາວ. ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວສະບັບນີ້ ອະທິບາຍວ່າພວກເຮົາເກັບກຳຂໍ້ມູນຫຍັງແດ່ຜ່ານເວັບໄຊ້ນີ້, ນຳໃຊ້ມັນແນວໃດ ແລະ ທ່ານມີທາງເລືອກຫຍັງແດ່. ການນຳໃຊ້ເວັບໄຊ້ ຫຼື ການສົ່ງແບບຟອມ ຖືວ່າທ່ານຍອມຮັບແນວທາງປະຕິບັດທີ່ໄດ້ລະບຸໄວ້ໃນນີ້.",
          },
        },
      ],
    },
    {
      heading: { en: "Information We Collect", lo: "ຂໍ້ມູນທີ່ພວກເຮົາເກັບກຳ" },
      blocks: [
        {
          p: {
            en: "We only collect information that you choose to give us:",
            lo: "ພວກເຮົາເກັບກຳສະເພາະຂໍ້ມູນທີ່ທ່ານເລືອກໃຫ້ພວກເຮົາເທົ່ານັ້ນ ໄດ້ແກ່:",
          },
        },
        {
          ul: [
            {
              en: "Tryout & recruitment data — your name or in-game name (IGN), email, contact or social handles, game and role, region, age range, and any details you include in an application.",
              lo: "ຂໍ້ມູນການທົດສອບ ແລະ ການສະໝັກ — ຊື່ ຫຼື ຊື່ໃນເກມ (IGN), ອີເມວ, ຊ່ອງທາງຕິດຕໍ່ ຫຼື ໂຊຊຽວ, ເກມ ແລະ ຕຳແໜ່ງ, ພາກພື້ນ, ຊ່ວງອາຍຸ ແລະ ລາຍລະອຽດອື່ນໆທີ່ທ່ານໃສ່ມາໃນໃບສະໝັກ.",
            },
            {
              en: "Contact & enquiry data — the name, email, organization, and message you provide when contacting us.",
              lo: "ຂໍ້ມູນການຕິດຕໍ່ ແລະ ສອບຖາມ — ຊື່, ອີເມວ, ອົງກອນ ແລະ ຂໍ້ຄວາມທີ່ທ່ານສົ່ງມາເມື່ອຕິດຕໍ່ຫາພວກເຮົາ.",
            },
            {
              en: "Technical data — basic, privacy-respecting analytics (such as anonymized page views) and a language preference stored locally in your browser. We do not run invasive ad-tracking.",
              lo: "ຂໍ້ມູນທາງເຕັກນິກ — ສະຖິຕິພື້ນຖານທີ່ເຄົາລົບຄວາມເປັນສ່ວນຕົວ (ເຊັ່ນ: ຈຳນວນການເຂົ້າຊົມແບບບໍ່ລະບຸຕົວຕົນ) ແລະ ການຕັ້ງຄ່າພາສາທີ່ເກັບໄວ້ໃນເບຣົາເຊີຂອງທ່ານ. ພວກເຮົາບໍ່ມີການຕິດຕາມເພື່ອການໂຄສະນາທີ່ລ່ວງລ້ຳຄວາມເປັນສ່ວນຕົວ.",
            },
          ],
        },
      ],
    },
    {
      heading: { en: "How We Use Your Information", lo: "ການນຳໃຊ້ຂໍ້ມູນຂອງທ່ານ" },
      blocks: [
        {
          ul: [
            { en: "To review and evaluate tryout and recruitment applications.", lo: "ເພື່ອພິຈາລະນາ ແລະ ປະເມີນໃບສະໝັກທົດສອບ ແລະ ການຮັບສະໝັກ." },
            { en: "To contact applicants about the status of their application.", lo: "ເພື່ອຕິດຕໍ່ຜູ້ສະໝັກກ່ຽວກັບສະຖານະຂອງໃບສະໝັກ." },
            { en: "To respond to sponsorship, media, and general enquiries.", lo: "ເພື່ອຕອບກັບການສອບຖາມເລື່ອງສະປອນເຊີ, ສື່ ແລະ ເລື່ອງທົ່ວໄປ." },
            { en: "To operate, maintain, and improve this website.", lo: "ເພື່ອດຳເນີນງານ, ດູແລ ແລະ ປັບປຸງເວັບໄຊ້ນີ້." },
          ],
        },
        {
          p: {
            en: "We never sell your personal data, and we do not use it for automated decisions that affect your legal rights.",
            lo: "ພວກເຮົາບໍ່ເຄີຍຂາຍຂໍ້ມູນສ່ວນຕົວຂອງທ່ານ ແລະ ບໍ່ນຳໃຊ້ມັນເພື່ອການຕັດສິນແບບອັດຕະໂນມັດທີ່ສົ່ງຜົນຕໍ່ສິດທິທາງກົດໝາຍຂອງທ່ານ.",
          },
        },
      ],
    },
    {
      heading: { en: "Recruitment Applicant Confidentiality", lo: "ການຮັກສາຄວາມລັບຂອງຜູ້ສະໝັກ" },
      blocks: [
        {
          p: {
            en: "We know that applying for a tryout means trusting us with your information. We treat recruitment data as confidential:",
            lo: "ພວກເຮົາເຂົ້າໃຈວ່າ ການສະໝັກທົດສອບ ໝາຍເຖິງການໄວ້ວາງໃຈມອບຂໍ້ມູນໃຫ້ພວກເຮົາ. ດ້ວຍເຫດນີ້ ພວກເຮົາຈຶ່ງຖືຂໍ້ມູນການສະໝັກເປັນຄວາມລັບ:",
          },
        },
        {
          ul: [
            {
              en: "It is accessed only by authorized NIIGHTMARE management and coaching staff involved in selection.",
              lo: "ເຂົ້າເຖິງໄດ້ສະເພາະຜູ້ບໍລິຫານ ແລະ ທີມຄູຝຶກຂອງ NIIGHTMARE ທີ່ໄດ້ຮັບອະນຸຍາດ ແລະ ມີສ່ວນຮ່ວມໃນການຄັດເລືອກເທົ່ານັ້ນ.",
            },
            {
              en: "It is used solely to evaluate your application — nothing else.",
              lo: "ນຳໃຊ້ເພື່ອປະເມີນໃບສະໝັກຂອງທ່ານເທົ່ານັ້ນ — ບໍ່ໄດ້ນຳໄປໃຊ້ໃນເລື່ອງອື່ນ.",
            },
            {
              en: "It is never sold, rented, or shared with third parties for marketing.",
              lo: "ບໍ່ມີການຂາຍ, ໃຫ້ເຊົ່າ ຫຼື ແບ່ງປັນໃຫ້ບຸກຄົນທີສາມເພື່ອການຕະຫຼາດ.",
            },
            {
              en: "It is kept only as long as the recruitment cycle needs, then deleted on request (see Sections 07 and 08).",
              lo: "ເກັບໄວ້ພຽງເທົ່າທີ່ຮອບການຮັບສະໝັກຕ້ອງການ ຈາກນັ້ນຈະຖືກລຶບເມື່ອມີການຮ້ອງຂໍ (ເບິ່ງຂໍ້ 07 ແລະ 08).",
            },
          ],
        },
      ],
    },
    {
      heading: { en: "Service Providers", lo: "ຜູ້ໃຫ້ບໍລິການ" },
      blocks: [
        {
          p: {
            en: "We rely on a small number of trusted providers to run this website and process form submissions, such as our form-handling service and our hosting provider. They process data only on our behalf and under their own security obligations. We do not share your data with anyone else except where the law requires it.",
            lo: "ພວກເຮົາອາໄສຜູ້ໃຫ້ບໍລິການທີ່ເຊື່ອຖືໄດ້ຈຳນວນໜຶ່ງ ເພື່ອດຳເນີນເວັບໄຊ້ ແລະ ປະມວນຜົນຂໍ້ມູນຈາກແບບຟອມ ເຊັ່ນ: ບໍລິການຈັດການແບບຟອມ ແລະ ຜູ້ໃຫ້ບໍລິການໂຮສຕິ້ງ. ພວກເຂົາປະມວນຜົນຂໍ້ມູນແທນພວກເຮົາ ແລະ ຢູ່ພາຍໃຕ້ພັນທະດ້ານຄວາມປອດໄພຂອງເຂົາເຈົ້າເອງ. ພວກເຮົາຈະບໍ່ແບ່ງປັນຂໍ້ມູນຂອງທ່ານໃຫ້ຜູ້ໃດ ນອກຈາກກໍລະນີທີ່ກົດໝາຍກຳນົດ.",
          },
        },
      ],
    },
    {
      heading: { en: "Data Security", lo: "ຄວາມປອດໄພຂອງຂໍ້ມູນ" },
      blocks: [
        {
          p: {
            en: "We apply reasonable technical and organizational measures to protect your information against loss, misuse, and unauthorized access — including encrypted (HTTPS) connections and restricted access to submissions. However, no method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
            lo: "ພວກເຮົານຳໃຊ້ມາດຕະການທາງເຕັກນິກ ແລະ ການຈັດການທີ່ເໝາະສົມ ເພື່ອປົກປ້ອງຂໍ້ມູນຂອງທ່ານຈາກການສູນເສຍ, ການນຳໃຊ້ຜິດ ແລະ ການເຂົ້າເຖິງໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ — ລວມທັງການເຊື່ອມຕໍ່ແບບເຂົ້າລະຫັດ (HTTPS) ແລະ ການຈຳກັດການເຂົ້າເຖິງຂໍ້ມູນທີ່ສົ່ງມາ. ເຖິງຢ່າງໃດກໍຕາມ ບໍ່ມີວິທີການສົ່ງ ຫຼື ການເກັບຮັກສາໃດທີ່ປອດໄພ 100% ສະນັ້ນ ພວກເຮົາຈຶ່ງບໍ່ສາມາດຮັບປະກັນຄວາມປອດໄພຢ່າງສົມບູນໄດ້.",
          },
        },
      ],
    },
    {
      heading: { en: "Data Retention", lo: "ໄລຍະການເກັບຮັກສາຂໍ້ມູນ" },
      blocks: [
        {
          p: {
            en: "We keep personal information only for as long as necessary for the purpose it was collected for — for example, the length of a recruitment cycle — after which it is deleted or anonymized. You can ask us to delete your data sooner at any time.",
            lo: "ພວກເຮົາເກັບຮັກສາຂໍ້ມູນສ່ວນຕົວໄວ້ພຽງເທົ່າທີ່ຈຳເປັນຕາມຈຸດປະສົງທີ່ໄດ້ເກັບກຳ — ຕົວຢ່າງ: ຕະຫຼອດໄລຍະຮອບການຮັບສະໝັກ — ຈາກນັ້ນຈະຖືກລຶບ ຫຼື ເຮັດໃຫ້ບໍ່ສາມາດລະບຸຕົວຕົນໄດ້. ທ່ານສາມາດຮ້ອງຂໍໃຫ້ພວກເຮົາລຶບຂໍ້ມູນກ່ອນກຳນົດໄດ້ທຸກເວລາ.",
          },
        },
      ],
    },
    {
      heading: { en: "Your Rights", lo: "ສິດທິຂອງທ່ານ" },
      blocks: [
        { p: { en: "At any time, you may request to:", lo: "ທ່ານສາມາດຮ້ອງຂໍສິ່ງຕໍ່ໄປນີ້ໄດ້ທຸກເວລາ:" } },
        {
          ul: [
            { en: "access the personal information we hold about you;", lo: "ເຂົ້າເຖິງຂໍ້ມູນສ່ວນຕົວທີ່ພວກເຮົາມີກ່ຽວກັບທ່ານ;" },
            { en: "correct information that is inaccurate or incomplete;", lo: "ແກ້ໄຂຂໍ້ມູນທີ່ບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ຄົບຖ້ວນ;" },
            { en: "delete your information; or", lo: "ລຶບຂໍ້ມູນຂອງທ່ານ; ຫຼື" },
            { en: "withdraw consent you previously gave.", lo: "ຖອນການຍິນຍອມທີ່ທ່ານເຄີຍໃຫ້ໄວ້." },
          ],
        },
        {
          p: { en: "To exercise any of these rights, contact us at", lo: "ເພື່ອໃຊ້ສິດທິເຫຼົ່ານີ້ ກະລຸນາຕິດຕໍ່ຫາພວກເຮົາທີ່" },
          link: mail,
          after: dot,
        },
      ],
    },
    {
      heading: { en: "Cookies & Local Storage", lo: "ຄຸກກີ້ ແລະ ການເກັບຂໍ້ມູນໃນເຄື່ອງ" },
      blocks: [
        {
          p: {
            en: "This site uses minimal browser storage — mainly to remember your language preference. We do not use cookies for cross-site advertising. You can clear this data at any time through your browser settings.",
            lo: "ເວັບໄຊ້ນີ້ນຳໃຊ້ການເກັບຂໍ້ມູນໃນເບຣົາເຊີໃຫ້ໜ້ອຍທີ່ສຸດ — ສ່ວນຫຼາຍແມ່ນເພື່ອຈົດຈຳການຕັ້ງຄ່າພາສາຂອງທ່ານ. ພວກເຮົາບໍ່ນຳໃຊ້ຄຸກກີ້ເພື່ອການໂຄສະນາຂ້າມເວັບໄຊ້. ທ່ານສາມາດລຶບຂໍ້ມູນນີ້ໄດ້ທຸກເວລາ ຜ່ານການຕັ້ງຄ່າເບຣົາເຊີ.",
          },
        },
      ],
    },
    {
      heading: { en: "Children’s Privacy", lo: "ຄວາມເປັນສ່ວນຕົວຂອງເຍົາວະຊົນ" },
      blocks: [
        {
          p: {
            en: "If you are under 18, please get consent from a parent or legal guardian before submitting an application or sharing personal information with us. We will delete information we learn was provided by a minor without proper consent.",
            lo: "ຫາກທ່ານມີອາຍຸຕ່ຳກວ່າ 18 ປີ ກະລຸນາຂໍຄຳຍິນຍອມຈາກພໍ່ແມ່ ຫຼື ຜູ້ປົກຄອງຕາມກົດໝາຍ ກ່ອນສົ່ງໃບສະໝັກ ຫຼື ແບ່ງປັນຂໍ້ມູນສ່ວນຕົວໃຫ້ພວກເຮົາ. ພວກເຮົາຈະລຶບຂໍ້ມູນທີ່ຮູ້ວ່າຖືກສົ່ງມາໂດຍຜູ້ເຍົາ ໂດຍບໍ່ມີການຍິນຍອມທີ່ເໝາະສົມ.",
          },
        },
      ],
    },
    {
      heading: { en: "Changes to This Policy", lo: "ການປ່ຽນແປງນະໂຍບາຍ" },
      blocks: [
        {
          p: {
            en: "We may update this Privacy Policy from time to time. When we do, we will revise the “Last updated” date at the top of this page. Continuing to use the website after changes means you accept the updated policy.",
            lo: "ພວກເຮົາອາດປັບປຸງນະໂຍບາຍຄວາມເປັນສ່ວນຕົວນີ້ເປັນແຕ່ລະໄລຍະ. ເມື່ອມີການປ່ຽນແປງ ພວກເຮົາຈະປັບວັນທີ “ອັບເດດລ່າສຸດ” ຢູ່ເທິງສຸດຂອງໜ້ານີ້. ການນຳໃຊ້ເວັບໄຊ້ຕໍ່ໄປຫຼັງຈາກມີການປ່ຽນແປງ ຖືວ່າທ່ານຍອມຮັບນະໂຍບາຍສະບັບປັບປຸງ.",
          },
        },
      ],
    },
    {
      heading: { en: "Contact Us", lo: "ຕິດຕໍ່ຫາພວກເຮົາ" },
      blocks: [
        {
          p: {
            en: "For any questions about this Privacy Policy or your data, contact us at",
            lo: "ຫາກມີຄຳຖາມກ່ຽວກັບນະໂຍບາຍຄວາມເປັນສ່ວນຕົວນີ້ ຫຼື ຂໍ້ມູນຂອງທ່ານ ກະລຸນາຕິດຕໍ່ຫາພວກເຮົາທີ່",
          },
          link: mail,
          after: dot,
        },
      ],
    },
  ];
}

export default function PrivacyClient() {
  const { t } = useLanguage();
  const { site } = useContent();

  return (
    <LegalLayout
      title={t("legal.privacy_title")}
      intro={t("legal.privacy_intro")}
      lastUpdated={LAST_UPDATED}
      sections={sections(site.contact.email)}
    />
  );
}
