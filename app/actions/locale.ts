"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/lib/locale";

export async function setLocaleAction(formData: FormData) {
  const raw = String(formData.get("locale") ?? "en");
  const locale = raw === "fil" ? "fil" : "en";
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
