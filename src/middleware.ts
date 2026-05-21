import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Define route prefixes
  const isAdminRoute = path.startsWith("/admin");
  const isReceptionRoute = path.startsWith("/reception");
  const isDepartmentRoute = path.startsWith("/department");
  const isSpecialistRoute = path.startsWith("/specialist");
  const isPatientRoute = path.startsWith("/patient");

  const isProtectedRoute =
    isAdminRoute || isReceptionRoute || isDepartmentRoute || isSpecialistRoute || isPatientRoute;

  // Retrieve user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user logic
  if (user) {
    // Fetch profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Redirect already logged-in users away from login page to their dashboard
    if (path === "/login" || path === "/") {
      if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      if (role === "receptionist") return NextResponse.redirect(new URL("/reception/dashboard", request.url));
      if (role === "department_staff") return NextResponse.redirect(new URL("/department/dashboard", request.url));
      if (role === "medical_specialist") return NextResponse.redirect(new URL("/specialist/dashboard", request.url));
      if (role === "patient") return NextResponse.redirect(new URL("/patient/dashboard", request.url));
    }

    // Role-based route protection (SO-D)
    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    if (isReceptionRoute && role !== "admin" && role !== "receptionist") {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    if (isDepartmentRoute && role !== "admin" && role !== "department_staff") {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    if (isSpecialistRoute && role !== "admin" && role !== "medical_specialist") {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    if (isPatientRoute && role !== "patient") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images/assets under public
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
