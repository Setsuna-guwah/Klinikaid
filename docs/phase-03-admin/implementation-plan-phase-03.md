# Phase 3 — Admin Dashboard & Staff Management

Implement the clinic administrator's control center, providing dynamic system-wide metrics, a department workload breakdown chart, a real-time system audit logs viewer, and a staff accounts CRUD management portal using Supabase Admin APIs.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Service Role Key:** This phase requires `SUPABASE_SERVICE_ROLE_KEY` to be defined in `.env.local` because the admin dashboard must create, update, and toggle active status for staff accounts using the Supabase Admin Auth client. Verified as present in `.env.local`.
>
> [!IMPORTANT]
> **Dependencies:** We need to install `recharts` for the department patient count bar chart. We will run `npm install recharts` before implementing the page.
>
> [!IMPORTANT]
> **UI Component Additions:** We need to install several shadcn UI components (`table`, `dialog`, `sheet`, `select`, `switch`) to construct the searchable staff table and the creation panel. We will use shadcn CLI or write light Tailwind-compliant versions.

---

## Open Questions

1. **Staff Password Generation:** Should we allow the administrator to type a temporary password manually, or should we auto-generate a secure random password and display it?
   - *Resolution:* Add a button to auto-generate a temporary password for convenience, but label it clearly as "Development Convenience" to be removed at the end of development and testing.
2. **Staff Email Updates:** Supabase Auth by default requires confirmation for email changes. Should we update the email directly via the Admin SDK `updateUserById` which bypasses confirmation, or do we allow editing name and role only?
   - *Resolution:* Update the email directly via the Admin SDK `updateUserById` to ensure consistency.

---

## Proposed Changes

### 1. Database & API Endpoints

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/admin/dashboard-stats/route.ts)
- **Method:** `GET`
- **Purpose:** Fetches administrative overview metrics.
- **Logic:**
  1. Authenticate session and require the `'admin'` role.
  2. Query counts from Supabase:
     - **Today's Patients:** Count of `patient_queue` records created today (UTC+8).
     - **Pending Document Reviews:** Count of `documents` where status is `'pending'`.
     - **Active Staff:** Count of `profiles` where role != `'patient'` and is_active is true.
     - **Chatbot Queries Today:** Count of `chatbot_logs` created today (UTC+8).
     - **Department Breakdown:** A grouped count of today's queue entries per department (`laboratory`, `imaging`, `ultrasound`, `ecg`).
     - **Recent Logs:** Fetch last 10 entries from `system_logs` joined with `profiles(full_name)` sorted by `created_at DESC`.
  3. Return JSON payload containing all stats.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/admin/staff/route.ts)
- **Method:** `GET`, `POST`
- **Purpose:** Lists all staff accounts and registers new staff.
- **Logic:**
  - `GET`: Fetch all profiles where role != `'patient'`, sorted by `created_at DESC`.
  - `POST`:
    1. Authenticate administrator.
    2. Extract `email`, `password`, `fullName`, `role`, and optional `department`.
    3. Invoke `adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, role, department } })`.
    4. Note: The database trigger `on_auth_user_created` will automatically create the corresponding profile row and write a `USER_REGISTERED` log.
    5. Write an explicit `STAFF_CREATED` event log into `system_logs` with the creator's user ID.
    6. Return the created user profile.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/admin/staff/[id]/route.ts)
- **Method:** `PUT`, `PATCH`
- **Purpose:** Updates or toggles status of a staff member.
- **Logic:**
  - `PUT`: Update a staff profile's name, email, role, and department.
    1. Authenticate administrator.
    2. Update Auth metadata via `adminClient.auth.admin.updateUserById(id, { email, user_metadata: { full_name, role, department } })`.
    3. Update `public.profiles` database row (since user trigger only fires on creation).
    4. Log `STAFF_UPDATED` in `system_logs`.
  - `PATCH`: Toggles the staff member's active status.
    1. Authenticate administrator.
    2. Read current active status or take incoming `is_active` boolean.
    3. Update `is_active` in `public.profiles`.
    4. If deactivating (`is_active = false`), revoke session by calling `adminClient.auth.admin.signOut(id)`.
    5. Log `STAFF_DEACTIVATED` or `STAFF_ACTIVATED` in `system_logs`.

---

### 2. Administrator Pages & UI Components

#### [MODIFY] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/admin/dashboard/page.tsx)
- Upgrade the static admin dashboard stub to load dynamic metrics from `/api/admin/dashboard-stats`.
- Render 4 styled KPI cards using shadcn `Card`.
- Render a responsive department patient workload chart using `Recharts` (`BarChart`, `XAxis`, `YAxis`, `Bar`, `Tooltip`).
- Render a "Recent System Events" table showing the last 10 logs with color-coded badges for event types.
- Ensure the page handles loading states gracefully (suspense/loading boundaries).

#### [NEW] [loading.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/admin/dashboard/loading.tsx)
- Skeletons for KPI cards, chart container, and recent events list to prevent layout shifts.

#### [NEW] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/admin/staff/page.tsx)
- Renders the Staff Management control panel.
- Integrates a searchable data table of staff profiles.
- Action triggers:
  - **Add Staff Button:** Opens a slide-out Sheet form with validation (Zod + React Hook Form). Conditional input: show Department select dropdown only when role is set to `department_staff`.
  - **Edit Button:** Populates and opens the same Sheet for updating information.
  - **Active/Inactive Toggle:** A confirmation dialog to deactivate staff, revoking their active tokens.
  - Inactive staff rows are visually dimmed (reduced opacity) with a red "Inactive" badge.

---

### 3. shadcn UI components

- Install or implement UI controls for the staff table:
  - `table.tsx` - Table structures.
  - `dialog.tsx` - Confirming deactivations.
  - `sheet.tsx` - Staff creation/edit panel.
  - `select.tsx` - Choosing role and department.
  - `switch.tsx` - Deactivation toggle.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js static rendering/compilation succeeds.
- Run `npm run dev` and perform local network request validations.

### Manual Verification
1. **Admin Dashboard Live Updates:**
   - Queue a mock patient under a department ➔ Check if "Today's Patients" count increments and the BarChart updates.
   - Insert a mock system event ➔ Confirm it lists at the top of the events table with UTC+8 conversion.
2. **Staff Creation & Auth:**
   - Create a receptionist account `reception_test@example.com`.
   - Verify `system_logs` contains the `STAFF_CREATED` audit trail record.
   - Open an incognito window, log in with `reception_test@example.com`, and verify redirection to `/reception/queue` (or reception dashboard stub).
3. **Deactivation Enforcement:**
   - As Admin, toggle the receptionist to Inactive. Confirm warning dialog appears.
   - Verify row opacity is dimmed and status displays red badge.
   - Attempt to log in again with `reception_test@example.com` ➔ Verify login fails with "account deactivated" error.
