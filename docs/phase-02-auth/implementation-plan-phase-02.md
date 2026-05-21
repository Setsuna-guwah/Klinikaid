# Phase 2 — Authentication & Multi-Role Setup Plan

Implement the clinic authentication portal and the multi-role framework, including role-based dashboard layouts and dynamic sidebar navigation.

## Proposed Changes

### 1. Authentication Portal & Actions
- Implement `src/app/(auth)/login/actions.ts` containing Server Actions for sign-in.
- Support password verification, user active state verification (`is_active = true`), multi-factor authentication (MFA verification flow), and routing logic.
- Implement `src/app/(auth)/logout/actions.ts` containing Server Actions for sign-out.
- Build the Login UI page (`src/app/(auth)/login/page.tsx`) with animated tabs, MFA code input, loading status, and form validation.

### 2. Multi-Role Shell and Navigation
- Create global dashboard layout `src/app/(dashboard)/layout.tsx` that reads active user role and fetches details for dashboard views.
- Build `<Sidebar />` component in `src/components/sidebar.tsx` that displays navigation links, role-badge styling, and sign-out triggers based on the active role:
  - Admin: Staff management, audit logs, vector index controls.
  - Receptionist: Queue controls, intake upload review, triage routing.
  - Department Staff: Patient lists, test form inputs.
  - Specialist: Patient records search, analytics chart panels.
  - Patient: Profile summary, chatbot logs, result summaries.

### 3. Role Dashboard Page Stubs
- Implement skeleton files for each dashboard:
  - Admin: `src/app/(dashboard)/admin/dashboard/page.tsx`
  - Receptionist: `src/app/(dashboard)/reception/dashboard/page.tsx`
  - Department Staff: `src/app/(dashboard)/department/dashboard/page.tsx`
  - Specialist: `src/app/(dashboard)/specialist/dashboard/page.tsx`
  - Patient: `src/app/(dashboard)/patient/dashboard/page.tsx`

## Verification Plan
- Build check: Verify compiling `/login` and dashboard roots compiles with no warnings.
- Navigation testing: Check role redirections (e.g. check receptionist logins redirect to receptionist page).
