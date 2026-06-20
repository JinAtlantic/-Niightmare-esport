import type { Metadata } from "next";
import ContactClient from "@/components/clients/ContactClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const contactDescription =
  "Get in touch with NIIGHTMARE Esports for sponsorships, media, tryouts, or general enquiries. Download our media kit.";

export const metadata: Metadata = {
  title: "Contact & Media Kit",
  description: contactDescription,
  openGraph: { title: "Contact & Media Kit — NIIGHTMARE Esports", description: contactDescription },
  twitter: { title: "Contact & Media Kit — NIIGHTMARE Esports", description: contactDescription },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <ContactClient />
    </>
  );
}
