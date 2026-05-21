# Phase 3 — Admin Dashboard & Staff Management Checklist

- [x] Setup and Dependencies
    - [x] Install `recharts` package via npm
    - [x] Add/create shadcn UI components: `table`, `dialog`, `sheet`, `select`, `switch`
- [x] API Endpoints
    - [x] Create `/api/admin/dashboard-stats` endpoint for dynamic overview metrics
    - [x] Create `/api/admin/staff` GET and POST endpoint for listing/creating staff
    - [x] Create `/api/admin/staff/[id]` PUT and PATCH endpoint for editing/toggling status
- [x] UI Views & Components
    - [x] Implement `app/admin/dashboard/loading.tsx` skeletons
    - [x] Upgrade `app/admin/dashboard/page.tsx` with stats, charts, and recent events
    - [x] Create `app/admin/staff/page.tsx` with searchable, sortable staff datatable and add/edit Sheets
- [x] Verification
    - [x] Run `npm run build` to confirm zero TS/Next.js compiler warnings
    - [ ] Manually test staff registration and role claims via Supabase
    - [ ] Verify active status checks (dimming, warning alerts, session deactivation)
