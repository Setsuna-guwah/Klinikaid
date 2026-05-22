# KlinikAid Project Changelog

This changelog tracks all technical implementations, architectural decisions, and critical recommendations across all development phases of KlinikAid.

---

## Phase 6: Specialist Analytics
*Active Iteration (Current)*

### Technical Changes
- **Longitudinal Charting**: Implemented `SpecialistAnalyticsClient` with Recharts `ComposedChart` featuring teal line plots, HSL-mapped normal range bands, red-dashed reference limit lines, and custom scatter dots (red for flagged, teal for normal).
- **UUID Search Cast**: Solved PostgreSQL UUID pattern search limitation (`operator does not exist: uuid ~~ unknown`) by switching to a range-based index-friendly query (`.gte()` and `.lte()`) using padded bounds:
  - Lower Bound: `${prefix}000000000000000000000000`
  - Upper Bound: `${prefix}ffffffffffffffffffffffff`
- **Render Optimizations**: Relocated Recharts `CustomTooltip` definition outside the main render lifecycle of `SpecialistAnalyticsClient` to prevent tooltip unmounting/flickering on chart interactions.
- **Shared Utils**: Refactored duplicate helper functions (`getAge`, `formatPhTime`, `formatPhTimeFull`) into a single file at `src/lib/utils.ts` and updated components to import them cleanly.
- **Aggregations & Limits**: Replaced hardcoded limitations, cast `PatientData` dynamically, and increased query record limits to `50000` to prevent truncation. Added documentation warning about JavaScript-side aggregations for large datasets.
- **Loading Skeleton**: Added `loading.tsx` for `/specialist/patients/[patientId]/analytics` to prevent UX layout shift.
- **Auth Guard Enforcement**: Ensured `supabase.auth.getUser()` is called as the literal first line of all specialist API routes (`patients/route.ts`, `metrics/route.ts`, `analytics/route.ts`) to comply with Standing Code Rule #1.

### Recommendations & Actions
- [x] Use range-based query on UUID instead of PostgREST `like` to ensure query success and database index reuse.
- [x] Define nested components (like tooltips) outside parent render methods to avoid re-instantiation.
- [ ] Monitor Vercel serverless function execution times; if patient record volume grows, migrate JavaScript-side record aggregation to database-level RPCs or Postgres Views.

---

## Phase 5: Department Staff Module

### Technical Changes
- **Relational Data Storage**: Refactored `department_records` to store flat relational entries (e.g. `test_name`, `test_value`, `unit`, `reference_range_min`, `reference_range_max`, `is_flagged`) instead of unstructured JSON blobs.
- **Auto-Flagging on Blur**: Configured client-side auto-flagging on laboratory inputs during the blur event. Fields validate against age/gender-specific norms and update borders (red for warning, green for correct).
- **Modality Adaptation**: Modified the clinical results form to dynamically display findings/impression textareas for narrative-based departments (`imaging`, `ultrasound`, `ecg`).
- **Real-Time Integration**: Integrated status updates that transition patient queue state from `'waiting'` to `'in_progress'` upon record entry.
- **Timezone Standardization**: Standardized all date manipulations and DB queries using `Asia/Manila` (UTC+8) using `date-fns-tz` formatting helpers.

### Recommendations & Actions
- [x] Standardize database department labels strictly on `'imaging'` matching the database check constraints, deprecating references to `'xray'`.
- [x] Group flat relational rows client-side by their creation timestamp to reconstruct cohesive multi-parameter reports (e.g., CBC panels).

---

## Phase 4: Reception Module

### Technical Changes
- **Kanban Board**: Created `ReceptionKanban.tsx` featuring 5 status swimlanes (`Submitted`, `AI Verified`, `Staff Review`, `Approved`, `Rejected`).
- **Supabase Realtime Sync**: Configured dynamic subscription to the `documents` table to trigger automatic card updates without browser refreshes.
- **Document Approval UI**: Designed a 3-panel document validation view displaying demographics (left), raw OCR text with red highlights for flags (center), and HSL ML Kit progress gauges (right).
- **Triage Routing**: Created `/api/reception/triage` to insert patients into active queue boards, auto-generating sequential daily queue tokens (e.g., `IMG-001`).
- **Audit Logging**: Added trigger logs for `DOCUMENT_APPROVED` and `TRIAGE_COMPLETED` within `system_logs`.

### Recommendations & Actions
- [x] Validate reject action inputs to ensure comments are at least 20 characters long.
- [x] Leverage OCR confidence scores (>85% for AI Verified, <85% for Staff Review) to automate triaging columns.

---

## Phase 3: Admin Dashboard & Staff Management

### Technical Changes
- **Workload Workspaces**: Created visual department workload breakdown using Recharts dynamic bar charts.
- **Personnel API**: Built `/api/admin/staff` to create, read, and update personnel data, linking authentication accounts to public profile directories.
- **Staff Control Actions**: Implemented deactivation switch. When staff are marked inactive, their profile is updated, and they are signed out of all devices immediately using the Supabase Admin Auth API.
- **Dynamic Skeletons**: Built Tailwind-based loaders inside `loading.tsx` for visual structure.

### Recommendations & Actions
- [x] Resolved input ref-forwarding bug in `src/components/ui/input.tsx` to fix integration with React Hook Form validation.
- [x] Implement instant active status toggle warning modals to prevent accidental staff lockout.

---

## Phase 2: Authentication & Multi-Role Setup

### Technical Changes
- **Server Action Auth**: Implemented credential signing, MFA assurance checks (TOTP), and dynamic role-based redirects inside login/logout actions.
- **Dynamic Sidebar**: Built a sidebar reading user profiles to render role-specific routes.
- **Next.js Suspense Wrapper**: Wrapped login forms inside `<Suspense>` to eliminate Next.js build-time de-optimization caused by `useSearchParams()`.
- **Role Routing Guards**: Implemented `/403` access denied route and application-wide role validation via Next.js Middleware.

---

## Phase 1: Project Setup & Database Schema

### Technical Changes
- **Database Schema**: Configured Supabase PostgreSQL schema with RLS policies, indexing, and triggers.
- **Profile Synchronizer**: Implemented Postgres function `handle_new_user()` triggered on `auth.users` creation.
- **Core Helpers**: Configured browser, server, and service-role Supabase clients alongside audit logging utilities (`logEvent()`).
- **Tailwind System**: Configured CSS variables, HSL color tokens, and font styling for light/dark theme support.
- **LLM Setup**: Configured native Google Generative AI SDK, removing `openai` and OpenRouter dependencies.
