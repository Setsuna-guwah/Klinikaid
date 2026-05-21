import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

/**
 * Root Landing Page redirecting to Login or respective Role Dashboard.
 */
export default async function Home() {
  const { profile } = await getCurrentUser();

  if (profile) {
    if (profile.role === "admin") redirect("/admin/dashboard");
    if (profile.role === "receptionist") redirect("/reception/dashboard");
    if (profile.role === "department_staff") redirect("/department/dashboard");
    if (profile.role === "medical_specialist") redirect("/specialist/dashboard");
    if (profile.role === "patient") redirect("/patient/dashboard");
  }

  redirect("/login");
}
