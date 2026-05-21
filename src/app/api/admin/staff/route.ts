import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/helpers";
import { errorResponse, successResponse } from "@/lib/api-response";
import { logEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET: list all staff members (non-patients) with merged email from Auth
export async function GET() {
  try {
    await requireRole(["admin"]);
    const supabase = createClient();
    const adminClient = createAdminClient();

    // Fetch profiles and auth users in parallel
    const [profilesResult, usersResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .neq("role", "patient")
        .order("created_at", { ascending: false }),
      adminClient.auth.admin.listUsers({
        perPage: 1000
      })
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (usersResult.error) throw usersResult.error;

    // Map user id -> email
    const emailMap = new Map<string, string>();
    usersResult.data.users.forEach((u) => {
      emailMap.set(u.id, u.email || "");
    });

    const staffWithEmails = profilesResult.data.map((profile) => ({
      ...profile,
      email: emailMap.get(profile.id) || "",
    }));

    return successResponse(staffWithEmails);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse("Failed to list staff", 500, message);
  }
}

// POST: create a new staff member
export async function POST(request: Request) {
  try {
    const adminProfile = await requireRole(["admin"]);
    const body = await request.json();
    const { email, password, fullName, role, department } = body;

    // Validate request body
    if (!email || !password || !fullName || !role) {
      return errorResponse("Missing required fields: email, password, fullName, role", 400);
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with metadata (trigger will auto-create profile and registration log)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        department: role === "department_staff" ? department : null,
      },
    });

    if (authError || !authData.user) {
      throw authError || new Error("Auth user creation failed");
    }

    // 2. Fetch the newly created profile row. Retries if the database trigger is asynchronous
    const supabase = createClient();
    let profile = null;
    let retries = 5;

    while (retries > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!error && data) {
        profile = data;
        break;
      }
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (!profile) {
      throw new Error("Trigger failed to create public.profiles record.");
    }

    // 3. Log the administrative audit event
    await logEvent(
      supabase,
      adminProfile.id,
      "STAFF_CREATED",
      `Staff user created: ${fullName} (${email}) as ${role}`,
      null,
      { target_user_id: authData.user.id, role, department }
    );

    return successResponse(
      { ...profile, email: authData.user.email },
      "Staff account created successfully",
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse("Failed to create staff member", 500, message);
  }
}
