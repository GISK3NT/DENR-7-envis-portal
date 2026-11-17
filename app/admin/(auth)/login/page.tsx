import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = { title: "Staff sign in · ENVIS" };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");
  return <LoginForm />;
}
