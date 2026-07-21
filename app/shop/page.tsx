import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ShopClient from "@/components/shop/ShopClient";
import ShopCatalogClient from "@/components/shop/ShopCatalogClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const shopDescription =
  "Browse official NIIGHTMARE Esports merchandise, choose product options, and order securely by bank transfer.";

export const metadata: Metadata = {
  title: "Shop — Official Merchandise",
  description: shopDescription,
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop — NIIGHTMARE Esports Merchandise", description: shopDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Shop — NIIGHTMARE Esports Merchandise", description: shopDescription, images: ["/twitter-image.png"] },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ collection?: string; view?: string }> }) {
  const params = await searchParams;
  if (params.collection) redirect(`/shop/${encodeURIComponent(params.collection)}`);
  const shopView = params.view === "cart" ? "cart" : params.view === "orders" ? "orders" : "catalog";
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
      {shopView === "catalog" ? <ShopCatalogClient /> : <ShopClient initialView={shopView} />}
    </>
  );
}
