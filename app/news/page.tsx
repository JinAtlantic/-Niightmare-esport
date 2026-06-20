import type { Metadata } from "next";
import NewsClient from "@/components/clients/NewsClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const newsDescription =
  "Official NIIGHTMARE Esports newsroom for announcements, match reports, roster updates, and media-ready team stories.";

export const metadata: Metadata = {
  title: "Newsroom",
  description: newsDescription,
  openGraph: { title: "Newsroom — NIIGHTMARE Esports", description: newsDescription },
  twitter: { title: "Newsroom — NIIGHTMARE Esports", description: newsDescription },
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
