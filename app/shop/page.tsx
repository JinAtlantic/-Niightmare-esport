import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const shopDescription =
  "Order the official NIIGHTMARE Esports team jersey, choose your size, and pay by bank transfer.";

export const metadata: Metadata = {
  title: "Shop — Team Jersey",
  description: shopDescription,
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop — NIIGHTMARE Esports Jersey", description: shopDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Shop — NIIGHTMARE Esports Jersey", description: shopDescription, images: ["/twitter-image.png"] },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
        ]}
      />
      <ShopClient initialCollection={params.collection} />
    </>
  );
}
