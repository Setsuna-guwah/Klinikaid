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

### Manual Verification Steps
1. **Admin Dashboard Live Update**:
   - Access `/admin/dashboard` as admin.
   - Confirm charts, KPIs, and audit log items display in real-time.
2. **Staff Creation & Credentials**:
   - Navigate to `/admin/staff`.
   - Click "Add Staff", type credentials, click "Auto-generate" to populate password, and submit.
   - Verify receptionist registration and log creation.
3. **Deactivation Session Termination**:
   - Toggle switch on a staff row to disable.
   - Accept warnings in the Dialog popup.
   - Row dims immediately. The user session is invalidated globally on the Supabase backend.
