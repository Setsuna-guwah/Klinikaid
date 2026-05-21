import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared dashboard layout containing the Sidebar and main scrollable content area.
 * Validates user authentication and account status on the server.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClient();

  // 1. Retrieve session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch profile and status
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, department, full_name, is_active")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Session exists but profile is missing
    await supabase.auth.signOut();
    redirect("/login");
  }

  // 3. Prevent inactive accounts from accessing the system
  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=account_deactivated");
  }

  const sidebarUser = {
    id: profile.id,
    email: user.email || "",
    fullName: profile.full_name,
    role: profile.role,
    department: profile.department,
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar user={sidebarUser} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
