import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Audit trail logger utility.
 * Logs mutation events and system actions securely.
 * Catches all errors internally to prevent breaking the parent transaction/execution.
 *
 * @param supabase The active Supabase client instance (user or admin)
 * @param userId ID of the profile initiating the action
 * @param eventType Classification of the audit event (e.g. USER_LOGIN, DOCUMENT_APPROVED)
 * @param description Detailed text description of what occurred
 * @param ipAddress Optional IP address of the client request
 * @param metadata Optional JSON key-value bag for extra context
 */
export async function logEvent(
  supabase: SupabaseClient,
  userId: string | null,
  eventType: string,
  description: string,
  ipAddress?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  try {
    const { error } = await supabase.from("system_logs").insert({
      user_id: userId,
      event_type: eventType,
      description: description,
      ip_address: ipAddress || null,
      metadata: metadata || null,
    });

    if (error) {
      console.error("System Logger: failed to write log record to DB:", error);
    }
  } catch (err) {
    console.error("System Logger: unexpected exception during logging:", err);
  }
}
