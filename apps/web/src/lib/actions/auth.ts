"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEV_OWNER_EMAIL } from "@/lib/auth";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function continueInDevMode() {
  if (isSupabaseConfigured()) throw new Error("Supabase is configured - use real sign-in instead.");

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, DEV_OWNER_EMAIL));
  if (!existing) {
    throw new Error("No dev owner account found. Run `pnpm db:seed` first.");
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/sign-in");
}
