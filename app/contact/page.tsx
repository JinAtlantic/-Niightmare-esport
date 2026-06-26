import type { Metadata } from "next";
import ContactClient from "@/components/clients/ContactClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const contactDescription =
  "Get in touch with NIIGHTMARE Esports for sponsorships, media, tryouts, general enquiries, or file submissions.";

export const metadata: Metadata = {
  title: "Contact & File Submission",
  description: contactDescription,
  openGraph: { title: "Contact & File Submission - NIIGHTMARE Esports", description: contactDescription },
  twitter: { title: "Contact & File Submission - NIIGHTMARE Esports", description: contactDescription },
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
