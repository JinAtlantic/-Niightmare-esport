import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import LoginScreen from "@/components/admin/LoginScreen";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  // Separate PWA identity (id/scope "/admin") so it installs as its own
  // home-screen app, distinct from the public site.
  manifest: "/admin.webmanifest",
};

export default async function AdminPage() {
  // Local-only: 404 on the deployed (Vercel) site.
  if (adminDisabled()) notFound();
  const authed = verifyToken((await cookies()).get(COOKIE_NAME)?.value);
  return authed ? <AdminApp /> : <LoginScreen />;
}
