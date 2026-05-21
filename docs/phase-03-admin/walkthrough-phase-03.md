# Walkthrough — Phase 3: Admin Dashboard & Staff Management

Summary of achievements and verification steps for Phase 3.

## 1. What Was Accomplished

- **Setup and Dependencies**:
  - Installed `recharts` for visual data charting.
  - Installed/verified UI components: `table`, `dialog`, `sheet`, `select`, `switch` under `src/components/ui/`.
- **API Endpoints**:
  - `/api/admin/dashboard-stats` (GET): Dynamic overview metrics (today's patient count, pending docs, active staff count, chatbot logs count, department workload breakdown, and recent audit logs).
  - `/api/admin/staff` (GET, POST): GET maps `public.profiles` to `auth.users` emails via Admin Auth SDK. POST creates new Auth users and automatically hooks profile creation, adding auditing trails.
  - `/api/admin/staff/[id]` (PUT, PATCH): PUT edits profile names, emails, roles, and departments directly. PATCH toggles `is_active` status and globally signs out deactivated staff immediately using Admin Auth client.
- **UI Views & Components**:
  - `src/app/(dashboard)/admin/dashboard/loading.tsx`: Clean animated card & table skeletons for initial loads.
  - `src/app/(dashboard)/admin/dashboard/DepartmentChart.tsx`: Client-side Recharts dynamic bar workload chart.
  - `src/app/(dashboard)/admin/dashboard/page.tsx`: Core dashboard displaying KPI cards, the workload chart, and UTC+8 event logs.
  - `src/app/(dashboard)/admin/staff/page.tsx`: Complete searchable/filterable staff table, add/edit Sheet drawer, and active status switch toggles with warning dialog. Includes a labeled convenience "Auto-generate" password button for development and testing.

## 2. Verification & Testing

### Automated Build Verification
- Build compiles successfully via `npm run build` with zero warnings or errors.

### Automated End-to-End Verification (Puppeteer)
We successfully performed the following verification steps using automated Puppeteer scripts:
1. **Admin Login**:
   - Navigated to `/login`, filled credentials `admin@test.com` / `"1234567"`, and logged in.
2. **Dashboard Load**:
   - Verified that all dynamic widgets, department bar charts, and system audit logs load and render successfully.
3. **Ref Forwarding Fix**:
   - Identified and fixed a bug in `src/components/ui/input.tsx` where ref forwarding was missing.
   - Wrapping the `Input` component in `React.forwardRef` allowed correct integration with React Hook Form, resolving the client-side "Invalid input" validation errors.
4. **Staff Creation**:
   - Opened the "+ Add Staff" drawer.
   - Created a receptionist account `reception_test@example.com` / `password123` ("Test Receptionist").
   - Verified that the new staff member was added to the personnel registry.
5. **Staff Deactivation**:
   - Toggled the status switch for "Test Receptionist".
   - Confirmed the deactivation popup dialog.
   - Verified that the row dimmed instantly and its status changed to "Inactive".
6. **Enforced Sign-Out & Blocked Login**:
   - Signed out of the administrator account.
   - Attempted to log in using the newly deactivated `reception_test@example.com` credentials.
   - Verified that login was blocked and the UI displayed: `"Your account is deactivated. Please contact your administrator."`
