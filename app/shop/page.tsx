import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const shopDescription =
  "Order the official NIIGHTMARE Esports team jersey. Spin a 3D model, pick your size, and preview the fit before you buy.";

export const metadata: Metadata = {
  title: "Shop — Team Jersey",
  description: shopDescription,
  openGraph: { title: "Shop — NIIGHTMARE Esports Jersey", description: shopDescription },
  twitter: { title: "Shop — NIIGHTMARE Esports Jersey", description: shopDescription },
};

export default function ShopPage() {
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
      <ShopClient />
    </>
  );
}
