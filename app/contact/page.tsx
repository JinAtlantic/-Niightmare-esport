import type { Metadata } from "next";
import ContactClient from "@/components/ContactClient";

export const metadata: Metadata = {
  title: "Contact & Media Kit",
  description:
    "Get in touch with NIIGHTMARE Esports for sponsorships, media, tryouts, or general enquiries. Download our media kit.",
};

export default function ContactPage() {
  return <ContactClient />;
}
