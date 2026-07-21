"use client";

import React from "react";
import LegalLayout, { type LegalSectionData } from "@/components/layout/LegalLayout";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";

const LAST_UPDATED = "13 July 2026";

function sections(email: string): LegalSectionData[] {
  const mail = { href: `mailto:${email}`, label: { en: email, lo: email } };
  const dot = { en: ".", lo: "." };

  return [
    {
      heading: { en: "Acceptance of Terms", lo: "ການຍອມຮັບຂໍ້ກຳນົດ" },
      blocks: [
        {
          p: {
            en: "These Terms of Service (“Terms”) govern your access to and use of the NIIGHTMARE Esports website. By accessing or using the site, you agree to be bound by these Terms. If you do not agree, please do not use the website.",
            lo: "ຂໍ້ກຳນົດການນຳໃຊ້ສະບັບນີ້ (“ຂໍ້ກຳນົດ”) ຄວບຄຸມການເຂົ້າເຖິງ ແລະ ການນຳໃຊ້ເວັບໄຊ້ NIIGHTMARE Esports. ການເຂົ້າເຖິງ ຫຼື ນຳໃຊ້ເວັບໄຊ້ ຖືວ່າທ່ານຕົກລົງຜູກພັນຕາມຂໍ້ກຳນົດເຫຼົ່ານີ້. ຫາກທ່ານບໍ່ເຫັນດີ ກະລຸນາຢ່ານຳໃຊ້ເວັບໄຊ້.",
          },
        },
      ],
    },
    {
      heading: { en: "Use of the Website", lo: "ການນຳໃຊ້ເວັບໄຊ້" },
      blocks: [
        {
          p: {
            en: "You agree to use this website lawfully and respectfully. You must not:",
            lo: "ທ່ານຕົກລົງນຳໃຊ້ເວັບໄຊ້ນີ້ຢ່າງຖືກຕ້ອງຕາມກົດໝາຍ ແລະ ດ້ວຍຄວາມເຄົາລົບ. ທ່ານຕ້ອງບໍ່:",
          },
        },
        {
          ul: [
            { en: "copy, scrape, or harvest content or data by automated means;", lo: "ສຳເນົາ, ດຶງ ຫຼື ເກັບກວາດເນື້ອຫາ ຫຼື ຂໍ້ມູນດ້ວຍວິທີອັດຕະໂນມັດ;" },
            { en: "attempt to disrupt, overload, or gain unauthorized access to the site;", lo: "ພະຍາຍາມລົບກວນ, ເຮັດໃຫ້ລະບົບໂຫຼດໜັກເກີນ ຫຼື ເຂົ້າເຖິງເວັບໄຊ້ໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ;" },
            { en: "use the website for any unlawful, harmful, or fraudulent purpose; or", lo: "ນຳໃຊ້ເວັບໄຊ້ເພື່ອຈຸດປະສົງທີ່ຜິດກົດໝາຍ, ເປັນອັນຕະລາຍ ຫຼື ສໍ້ໂກງ; ຫຼື" },
            { en: "misrepresent your identity or impersonate NIIGHTMARE or others.", lo: "ບິດເບືອນຕົວຕົນຂອງທ່ານ ຫຼື ປອມຕົວເປັນ NIIGHTMARE ຫຼື ບຸກຄົນອື່ນ." },
          ],
        },
      ],
    },
    {
      heading: { en: "Intellectual Property", lo: "ຊັບສິນທາງປັນຍາ" },
      blocks: [
        {
          p: {
            en: "The NIIGHTMARE name, the “NIIGHTMARE ESPORTS” wordmark, our reaper emblem and logo, and all original text, graphics, and design on this website are the property of NIIGHTMARE Esports and are protected by intellectual-property and trademark law. You may not copy, reproduce, modify, distribute, or use them commercially without our prior written permission.",
            lo: "ຊື່ NIIGHTMARE, ໂລໂກ້ຕົວອັກສອນ “NIIGHTMARE ESPORTS”, ສັນຍາລັກ ແລະ ໂລໂກ້ຮູບຍົມມະທູດຂອງພວກເຮົາ ພ້ອມທັງຂໍ້ຄວາມ, ຮູບພາບ ແລະ ການອອກແບບຕົ້ນສະບັບທັງໝົດໃນເວັບໄຊ້ນີ້ ເປັນຊັບສິນຂອງ NIIGHTMARE Esports ແລະ ໄດ້ຮັບການປົກປ້ອງຕາມກົດໝາຍຊັບສິນທາງປັນຍາ ແລະ ເຄື່ອງໝາຍການຄ້າ. ທ່ານບໍ່ສາມາດສຳເນົາ, ເຮັດຊ້ຳ, ດັດແປງ, ເຜີຍແຜ່ ຫຼື ນຳໄປໃຊ້ໃນທາງການຄ້າ ໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດເປັນລາຍລັກອັກສອນຈາກພວກເຮົາກ່ອນ.",
          },
        },
      ],
    },
    {
      heading: {
        en: "Third-Party Game Content & Trademarks",
        lo: "ເນື້ອຫາ ແລະ ເຄື່ອງໝາຍການຄ້າຂອງເກມ (ບຸກຄົນທີສາມ)",
      },
      blocks: [
        {
          p: {
            en: "This website may reference or display game titles, hero artwork, logos, and other assets that belong to their respective owners, including Moonton and Mobile Legends: Bang Bang (MLBB), and the publishers of eFootball. NIIGHTMARE Esports is not affiliated with, endorsed by, or sponsored by these companies. Such materials are used for informational and identification purposes under applicable fan-content policies, and all rights remain with their respective owners.",
            lo: "ເວັບໄຊ້ນີ້ອາດອ້າງອີງ ຫຼື ສະແດງຊື່ເກມ, ຮູບແຕ້ມຮີໂຣ່, ໂລໂກ້ ແລະ ຊັບສິນອື່ນໆ ທີ່ເປັນຂອງເຈົ້າຂອງລິຂະສິດແຕ່ລະລາຍ ລວມທັງ Moonton ແລະ Mobile Legends: Bang Bang (MLBB) ພ້ອມທັງຜູ້ເຜີຍແຜ່ເກມ eFootball. NIIGHTMARE Esports ບໍ່ໄດ້ມີຄວາມກ່ຽວຂ້ອງ, ບໍ່ໄດ້ຮັບການຮັບຮອງ ຫຼື ການສະໜັບສະໜູນຈາກບໍລິສັດເຫຼົ່ານີ້. ເນື້ອຫາດັ່ງກ່າວຖືກນຳໃຊ້ເພື່ອຈຸດປະສົງໃຫ້ຂໍ້ມູນ ແລະ ການລະບຸຕົວຕົນ ພາຍໃຕ້ນະໂຍບາຍ fan content ທີ່ກ່ຽວຂ້ອງ ແລະ ລິຂະສິດທັງໝົດຍັງເປັນຂອງເຈົ້າຂອງເດີມ.",
          },
        },
      ],
    },
    {
      heading: { en: "Recruitment & Tryouts", lo: "ການຮັບສະໝັກ ແລະ ການທົດສອບ" },
      blocks: [
        {
          p: {
            en: "Submitting a tryout or recruitment application does not create any contract or guarantee of selection, a roster spot, or any other outcome. Selection is at the sole discretion of NIIGHTMARE management. You are responsible for making sure the information you submit is accurate and that you are entitled to share it.",
            lo: "ການສົ່ງໃບສະໝັກທົດສອບ ຫຼື ການຮັບສະໝັກ ບໍ່ໄດ້ກໍ່ໃຫ້ເກີດສັນຍາ ຫຼື ການຮັບປະກັນວ່າຈະຖືກຄັດເລືອກ, ໄດ້ຕຳແໜ່ງໃນທີມ ຫຼື ຜົນຮັບອື່ນໆ. ການຄັດເລືອກຂຶ້ນກັບການພິຈາລະນາຂອງຝ່າຍບໍລິຫານ NIIGHTMARE ແຕ່ພຽງຜູ້ດຽວ. ທ່ານມີໜ້າທີ່ຮັບຜິດຊອບໃຫ້ຂໍ້ມູນທີ່ສົ່ງມາຖືກຕ້ອງ ແລະ ທ່ານມີສິດແບ່ງປັນຂໍ້ມູນນັ້ນ.",
          },
        },
      ],
    },
    {
      heading: { en: "Your Submissions", lo: "ການສົ່ງຂໍ້ມູນຂອງທ່ານ" },
      blocks: [
        {
          p: {
            en: "By submitting a form, you confirm that the information is true and your own, and you consent to us contacting you in response. We handle the data you submit in line with our",
            lo: "ການສົ່ງແບບຟອມ ຖືວ່າທ່ານຢືນຢັນວ່າຂໍ້ມູນເປັນຄວາມຈິງ ແລະ ເປັນຂອງທ່ານເອງ ພ້ອມທັງຍິນຍອມໃຫ້ພວກເຮົາຕິດຕໍ່ກັບຄືນ. ພວກເຮົາຈັດການຂໍ້ມູນທີ່ທ່ານສົ່ງມາຕາມ",
          },
          link: {
            href: "/privacy",
            label: { en: "Privacy Policy", lo: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ" },
          },
          after: { en: ".", lo: " ຂອງພວກເຮົາ." },
        },
      ],
    },
    {
      heading: { en: "Shop Orders & Payment", lo: "ອໍເດີຮ້ານຄ້າ ແລະ ການຊຳລະ" },
      blocks: [
        {
          ul: [
            { en: "An order is reserved for 24 hours. If payment is not declared within that window, the reservation may expire and stock is not guaranteed.", lo: "ອໍເດີຈະຖືກຈອງໄວ້ 24 ຊົ່ວໂມງ. ຫາກບໍ່ແຈ້ງການຊຳລະພາຍໃນເວລາດັ່ງກ່າວ ການຈອງອາດໝົດອາຍຸ ແລະ ບໍ່ຮັບປະກັນສິນຄ້າ." },
            { en: "Prices are calculated by the server from the selected sizes and quantities. You must transfer the displayed total and include the order reference where possible.", lo: "ລາຄາຄຳນວນໂດຍລະບົບຈາກຂະໜາດ ແລະ ຈຳນວນທີ່ເລືອກ. ທ່ານຕ້ອງໂອນຕາມຍອດທີ່ສະແດງ ແລະ ໃສ່ລະຫັດອ້າງອີງເມື່ອສາມາດ." },
            { en: "Uploading a slip and selecting ‘I've transferred’ is a declaration, not automatic payment confirmation. NIIGHTMARE verifies the transfer manually before preparing or shipping the order.", lo: "ການແນບສະລິບ ແລະ ເລືອກ ‘ໂອນແລ້ວ’ ເປັນການແຈ້ງຊຳລະ ບໍ່ແມ່ນການຢືນຢັນອັດຕະໂນມັດ. NIIGHTMARE ຈະກວດກາການໂອນດ້ວຍຕົນເອງກ່ອນກຽມ ຫຼື ຈັດສົ່ງ." },
            { en: "You are responsible for checking sizes, quantities, phone number and delivery details before payment. Delivery dates are estimates and may depend on the courier.", lo: "ທ່ານຮັບຜິດຊອບກວດສອບຂະໜາດ, ຈຳນວນ, ເບີໂທ ແລະ ລາຍລະອຽດຈັດສົ່ງກ່ອນຊຳລະ. ວັນຈັດສົ່ງເປັນພຽງການຄາດຄະເນ ແລະ ຂຶ້ນກັບຜູ້ຂົນສົ່ງ." },
            { en: "For a cancellation, correction, refund or return request, contact NIIGHTMARE as soon as possible. Eligibility is reviewed case by case according to payment status, fulfillment progress, product condition and applicable law; no request is approved until NIIGHTMARE confirms it in writing.", lo: "ຫາກຕ້ອງການຍົກເລີກ, ແກ້ໄຂ, ຂໍຄືນເງິນ ຫຼື ຄືນສິນຄ້າ ກະລຸນາຕິດຕໍ່ NIIGHTMARE ໃຫ້ໄວທີ່ສຸດ. ສິດໃນການດຳເນີນການຈະພິຈາລະນາເປັນກໍລະນີຕາມສະຖານະຊຳລະ, ຂັ້ນຕອນຈັດກຽມ, ສະພາບສິນຄ້າ ແລະ ກົດໝາຍທີ່ນຳໃຊ້; ຄຳຮ້ອງຍັງບໍ່ຖືກອະນຸມັດຈົນກວ່າ NIIGHTMARE ຈະຢືນຢັນເປັນລາຍລັກອັກສອນ." },
          ],
        },
      ],
    },
    {
      heading: { en: "External Links", lo: "ລິ້ງພາຍນອກ" },
      blocks: [
        {
          p: {
            en: "The website may contain links to third-party sites, such as social media or sponsors. We are not responsible for the content, policies, or practices of those sites and provide the links for convenience only.",
            lo: "ເວັບໄຊ້ອາດມີລິ້ງໄປຫາເວັບໄຊ້ຂອງບຸກຄົນທີສາມ ເຊັ່ນ: ໂຊຊຽວມີເດຍ ຫຼື ສະປອນເຊີ. ພວກເຮົາບໍ່ຮັບຜິດຊອບຕໍ່ເນື້ອຫາ, ນະໂຍບາຍ ຫຼື ການປະຕິບັດຂອງເວັບໄຊ້ເຫຼົ່ານັ້ນ ແລະ ໃຫ້ລິ້ງໄວ້ເພື່ອຄວາມສະດວກເທົ່ານັ້ນ.",
          },
        },
      ],
    },
    {
      heading: { en: "Disclaimer of Warranties", lo: "ການປະຕິເສດການຮັບປະກັນ" },
      blocks: [
        {
          p: {
            en: "The website is provided “as is” and “as available”, without warranties of any kind, whether express or implied. We do not warrant that the site will be uninterrupted, error-free, or free of harmful components.",
            lo: "ເວັບໄຊ້ໃຫ້ບໍລິການ “ຕາມສະພາບທີ່ເປັນຢູ່” ແລະ “ຕາມທີ່ມີໃຫ້ບໍລິການ” ໂດຍບໍ່ມີການຮັບປະກັນໃດໆ ບໍ່ວ່າຈະໂດຍກົງ ຫຼື ໂດຍປະລິຍາຍ. ພວກເຮົາບໍ່ຮັບປະກັນວ່າເວັບໄຊ້ຈະເຮັດວຽກໂດຍບໍ່ຂາດຕອນ, ປາສະຈາກຂໍ້ຜິດພາດ ຫຼື ປາສະຈາກອົງປະກອບທີ່ເປັນອັນຕະລາຍ.",
          },
        },
      ],
    },
    {
      heading: { en: "Limitation of Liability", lo: "ການຈຳກັດຄວາມຮັບຜິດຊອບ" },
      blocks: [
        {
          p: {
            en: "To the fullest extent permitted by law, NIIGHTMARE Esports shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, this website.",
            lo: "ເທົ່າທີ່ກົດໝາຍອະນຸຍາດ, NIIGHTMARE Esports ຈະບໍ່ຮັບຜິດຊອບຕໍ່ຄວາມເສຍຫາຍທາງອ້ອມ, ໂດຍບັງເອີນ ຫຼື ທີ່ເປັນຜົນຕາມມາ ຈາກການນຳໃຊ້ ຫຼື ການບໍ່ສາມາດນຳໃຊ້ເວັບໄຊ້ນີ້.",
          },
        },
      ],
    },
    {
      heading: { en: "Governing Law", lo: "ກົດໝາຍທີ່ນຳໃຊ້ບັງຄັບ" },
      blocks: [
        {
          p: {
            en: "These Terms are governed by the laws of the Lao People’s Democratic Republic, without regard to its conflict-of-law provisions.",
            lo: "ຂໍ້ກຳນົດເຫຼົ່ານີ້ ຢູ່ພາຍໃຕ້ການບັງຄັບໃຊ້ຂອງກົດໝາຍແຫ່ງ ສປປ ລາວ ໂດຍບໍ່ຄຳນຶງເຖິງຫຼັກການວ່າດ້ວຍການຂັດກັນຂອງກົດໝາຍ.",
          },
        },
      ],
    },
    {
      heading: { en: "Changes to These Terms", lo: "ການປ່ຽນແປງຂໍ້ກຳນົດ" },
      blocks: [
        {
          p: {
            en: "We may revise these Terms at any time. The “Last updated” date above reflects the latest version. Your continued use of the website after changes means you accept the revised Terms.",
            lo: "ພວກເຮົາອາດປັບປຸງຂໍ້ກຳນົດເຫຼົ່ານີ້ໄດ້ທຸກເວລາ. ວັນທີ “ອັບເດດລ່າສຸດ” ຢູ່ດ້ານເທິງ ສະແດງເຖິງສະບັບຫຼ້າສຸດ. ການນຳໃຊ້ເວັບໄຊ້ຕໍ່ໄປຫຼັງຈາກມີການປ່ຽນແປງ ຖືວ່າທ່ານຍອມຮັບຂໍ້ກຳນົດສະບັບປັບປຸງ.",
          },
        },
      ],
    },
    {
      heading: { en: "Contact Us", lo: "ຕິດຕໍ່ຫາພວກເຮົາ" },
      blocks: [
        {
          p: {
            en: "Questions about these Terms can be sent to",
            lo: "ຄຳຖາມກ່ຽວກັບຂໍ້ກຳນົດເຫຼົ່ານີ້ ສາມາດສົ່ງມາທີ່",
          },
          link: mail,
          after: dot,
        },
      ],
    },
  ];
}

export default function TermsClient() {
  const { t } = useLanguage();
  const { site } = useContent();

  return (
    <LegalLayout
      title={t("legal.terms_title")}
      intro={t("legal.terms_intro")}
      lastUpdated={LAST_UPDATED}
      sections={sections(site.contact.email)}
    />
  );
}
