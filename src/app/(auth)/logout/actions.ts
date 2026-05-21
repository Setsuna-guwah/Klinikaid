"use server";

import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/logger";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Signs the current user out, logs the logout event, and redirects to /login.
 */
export async function logoutAction(): Promise<never> {
  const supabase = createClient();
  const reqHeaders = headers();
  const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || null;

  // Retrieve current user session to audit who logged out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logEvent(supabase, user.id, "LOGOUT", "User logged out successfully", ipAddress);
  }

  await supabase.auth.signOut();
  redirect("/login");
}
