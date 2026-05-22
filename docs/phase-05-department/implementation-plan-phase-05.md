# Implementation Plan — Phase 5: Department Staff Module

This phase implements the results entry workflow for medical technologists (department staff), answering **SO-B** (reducing manual data-entry workloads via auto-flagging), **SO-C** (storing flagged indicators for analytics), and **SO-D** (enforcing strict department-level access control).

---

## User Review Required

> [!IMPORTANT]
> - **Daily Queue Definition**: We will filter today's queue by comparing the `created_at` timestamp with the current day in `Asia/Manila` (UTC+8) timezone.
> - **JSON results format**: We will serialize test parameters in `test_results` as a JSON object, storing the value, unit, reference range min/max, and an `is_flagged` boolean for each parameter.
> - **Imaging Department check**: The department is `'imaging'` in the database (not `'xray'`). We will map it to the UI display label "Imaging (X-Ray)".
> - **Form Date Input**: We will use a highly functional, native HTML `<Input type="date" />` for maximum compatibility, ease of styling, and zero heavy package overhead.

---

## Proposed Changes

### Database & RLS
- Enforced at both the API layer (session-derived department) and database layer (RLS policy using `get_auth_user_dept()`).
- When results are saved, the patient's queue status in `patient_queue` is updated from `'waiting'` to `'in_progress'` for today's entry.

---

### Component Split & Files

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/department/queue/route.ts)
GET API for today's patient queue routed to the staff's department. Sources department from session.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/department/records/route.ts)
GET and POST API for historical results and result insertion. Handles range checking and sets `is_flagged` and `reference_range_status` server-side.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/department/patients/%5BpatientId%5D/route.ts)
GET patient info and history for context.

#### [MODIFY] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/department/records/page.tsx)
Server component. Verifies role and fetches initial queue and history. Renders `DepartmentRecordsClient.tsx`.

#### [NEW] [DepartmentRecordsClient.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/DepartmentRecordsClient.tsx)
`"use client"` wrapper for records dashboard. Handles search filtering, tab switching, and displays historical tables.

#### [NEW] [loading.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/department/records/loading.tsx)
Skeletons for queue cards and historical table rows.

#### [NEW] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/department/records/entry/%5BpatientId%5D/page.tsx)
Server component wrapper for results entry. Fetches patient context and renders `RecordEntryClient.tsx`.

#### [NEW] [RecordEntryClient.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/RecordEntryClient.tsx)
`"use client"` entry form. Contains individual schemas per department, auto-focuses the first field, and highlights out-of-range inputs in red on blur.

#### [MODIFY] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/department/dashboard/page.tsx)
Redirects logged-in staff to `/department/records`.

#### [MODIFY] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/department/entry/page.tsx)
Redirects staff to `/department/records` to select a patient from the queue first.

---

## Verification Plan

## Automated Tests
- Run `npm run build` to confirm clean compilation and zero type errors.

## Manual Verification
1. Log in as a Laboratory Technologist. Verify landing redirects to `/department/records`.
2. Confirm the department header shows "Laboratory Department" and only today's `laboratory` queue is visible.
3. Select a patient, input an out-of-range hemoglobin value (`5.0`), and verify that the input turns red and shows a warning on blur.
4. Input a normal value (`14.5`), verify the indicator turns green ("✓ Normal").
5. Submit the form, verify success toast, and check that the patient queue status updates to `'in_progress'` in the database.
6. Verify `system_logs` records `RECORD_ENTERED` with the correct count of flagged items.
7. Log in as an Imaging Technologist, verify records entry form shows only "Findings" and "Impression" textareas.
