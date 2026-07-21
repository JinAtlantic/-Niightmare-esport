import type { Metadata } from "next";
import GalleryClient from "@/components/clients/GalleryClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const description = "Explore NIIGHTMARE Esports photos from tournaments, team moments, and the community.";

export const metadata: Metadata = {
  title: "Gallery",
  description,
  alternates: { canonical: "/gallery" },
  openGraph: { title: "Gallery — NIIGHTMARE Esports", description, images: ["/opengraph-image.png"] },
  twitter: { title: "Gallery — NIIGHTMARE Esports", description, images: ["/twitter-image.png"] },
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }])} />
      <GalleryClient />
    </>
  );
}
