import type { Metadata } from "next";
import NewsClient from "@/components/clients/NewsClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "Official NIIGHTMARE Esports newsroom for announcements, match reports, roster updates, and media-ready team stories.",
};

export default function NewsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Newsroom", path: "/news" },
        ])}
      />
      <NewsClient />
    </>
  );
}
