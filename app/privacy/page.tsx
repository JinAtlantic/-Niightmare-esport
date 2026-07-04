import type { Metadata } from "next";
import PrivacyClient from "@/components/clients/PrivacyClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How NIIGHTMARE Esports collects, uses, and protects your information, including recruitment and tryout applicant data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <PrivacyClient />
    </>
  );
}
