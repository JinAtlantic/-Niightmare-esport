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
};

export default function AdminPage() {
  // Local-only: 404 on the deployed (Vercel) site.
  if (adminDisabled()) notFound();
  const authed = verifyToken(cookies().get(COOKIE_NAME)?.value);
  return authed ? <AdminApp /> : <LoginScreen />;
}
