import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export default async function SpecialistAnalyticsPage() {
  await requireRole(["admin", "medical_specialist"]);
  redirect("/specialist/patients");
}
