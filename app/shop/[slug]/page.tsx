import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import ShopProductClient from "@/components/shop/ShopProductClient";
import { breadcrumbSchema } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Product — Shop",
    description: "View NIIGHTMARE Esports merchandise, choose a size, and add it to your cart.",
    alternates: { canonical: `/shop/${encodeURIComponent(slug)}` },
  };
}

export default async function ShopProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: "Product", path: `/shop/${encodeURIComponent(slug)}` },
        ])}
      />
      <ShopProductClient slug={decodeURIComponent(slug)} />
    </>
  );
}
