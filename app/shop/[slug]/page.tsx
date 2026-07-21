import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ShopProductClient from "@/components/shop/ShopProductClient";
import { breadcrumbSchema, productSchema } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";
import { resolveShop, type ShopContent } from "@/lib/shop";

async function getProduct(slug: string) {
  const content = await getSiteContent();
  const site = content.site as { shop?: Partial<ShopContent> } | undefined;
  const shop = resolveShop(site?.shop);
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    return undefined;
  }
  return shop.collections.find(
    (entry) =>
      entry.enabled && (entry.slug === decodedSlug || entry.id === decodedSlug)
  );
}

function metadataDescription(description: string, fallback: string): string {
  const value = (description || fallback).replace(/\s+/g, " ").trim();
  return value.length > 160 ? `${value.slice(0, 157).trimEnd()}...` : value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }
  const description = metadataDescription(product.description.en, product.tagline.en);
  const image = product.frontImage || product.productImage || product.backImage || "/opengraph-image.png";
  const canonical = `/shop/${encodeURIComponent(product.slug)}`;
  return {
    title: product.productName.en,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${product.productName.en} — NIIGHTMARE Esports`,
      description,
      images: [{ url: image, alt: product.productName.en }],
    },
    twitter: {
      title: `${product.productName.en} — NIIGHTMARE Esports`,
      description,
      images: [image],
    },
  };
}

export default async function ShopProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return (
    <>
      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            {
              name: product.productName.en,
              path: `/shop/${encodeURIComponent(product.slug)}`,
            },
          ]),
        ]}
      />
      <ShopProductClient slug={product.slug} />
    </>
  );
}
