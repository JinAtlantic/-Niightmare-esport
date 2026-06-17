import type { Metadata } from "next";
import TermsClient from "@/components/clients/TermsClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing use of the NIIGHTMARE Esports website, our intellectual property, third-party game trademarks, and submissions.",
};

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ])}
      />
      <TermsClient />
    </>
  );
}
