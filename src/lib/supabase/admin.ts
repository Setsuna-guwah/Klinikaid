import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Enforce server-only execution
if (typeof window !== "undefined") {
  throw new Error("CRITICAL: src/lib/supabase/admin.ts must never be imported in client-side code.");
}

/**
 * Creates a server-only admin client that bypasses Row Level Security (RLS).
 * WARNING: Use with extreme caution. Never expose the service role key to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
