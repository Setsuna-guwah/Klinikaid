# Implementation Plan — Phase 4: Reception Module

Establish the receptionist's multi-role workflows: validate patient-uploaded diagnostic referrals (SO-B) and route patients to active department queues (SO-B) with strict authorization checks (SO-D) and comprehensive audit logging (SO-D, SO-E).

---

## Pre-Build Check & Database Findings

We inspected `src/lib/db/schema.sql` and ran experimental inserts against the live database using Supabase JS client to verify DB columns and constraints.

### 1. Document Status Findings
- In the schema, the `documents` table has:
  `status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))`
- **Result:** The initial status is `'pending'`. The dashboard stats in Phase 3 correctly query `status = 'pending'`. No adjustments are needed to Phase 3 dashboard queries.

### 2. Kanban Columns & Client-Side Mapping
The Kanban board requires 5 columns: `Submitted | AI Verified | Staff Review | Approved | Rejected`. Because the database restricts the physical column to `'pending'`, `'approved'`, or `'rejected'`, we will dynamically map `pending` documents on the client using `extracted_metadata` fields:
- **Submitted Column**: `status === 'pending'` AND the document has no OCR data (i.e. `ocr_confidence_score` is missing or null, which indicates a direct web upload).
- **AI Verified Column**: `status === 'pending'` AND `ocr_confidence_score` is present and `>= 85`.
- **Staff Review Column**: `status === 'pending'` AND `ocr_confidence_score` is present and `< 85` (indicating low AI confidence or flagged fields).
- **Approved Column**: `status === 'approved'`.
- **Rejected Column**: `status === 'rejected'`.

### 3. Patient Queue & Triage Findings
- The database table `patient_queue` has columns: `['id', 'patient_id', 'status', 'department', 'triage_notes', 'priority_level', 'estimated_wait_minutes', 'created_at', 'updated_at']`.
- **Constraint 1 (No `queue_number` column)**: The table does not have a physical `queue_number` column.
- **Constraint 2 (Status constraint)**: `status` has a CHECK constraint: `CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled'))`. A status of `'routed'` is NOT allowed by the database.
- **Constraint 3 (Department check)**: We tested live insertions on `patient_queue.department`.
  - Inserting `'imaging'` **succeeded** without errors.
  - Inserting `'xray'` **failed** violating `patient_queue_department_check`.
  - **Result**: The correct database value is `'imaging'`. Triage API will insert `'imaging'` (represented on UI as "Imaging (X-Ray)" and mapped to prefix `IMG` or `XRY`).
- **Solution**:
  - The API will insert status = `'waiting'` (satisfies the CHECK constraint, representing the patient waiting in the department).
  - Store `triage_notes` as a stringified JSON object. Phase 5 and Phase 9 will run `JSON.parse(triage_notes)` to display queue numbers and vitals.
    ```json
    {
      "queue_number": "IMG-001",
      "vitals": {
        "blood_pressure": "120/80",
        "weight_kg": 70,
        "temperature_c": 36.5
      },
      "notes": "Optional receptionist notes here"
    }
    ```
  - `assigned_by` (the receptionist's profile ID) will be captured inside `system_logs` metadata when logging the `TRIAGE_COMPLETED` audit event.

---

## User Review Required

> [!IMPORTANT]
> - **JSON Vitals and Queue Number Storage**: Because the physical DB columns for `queue_number` or vitals do not exist in the capstone's database schema, we store them in `triage_notes` as stringified JSON. This is documented in `MASTER_CONTEXT.md` to ensure compatibility with Phase 5 (Department Queue) and Phase 9 (Patient Tracker).
> - **Triage Status**: The queue status will be set to `'waiting'` in the database instead of `'routed'`, conforming to the DB's status check constraint.
> - **Rejection Validation**: Rejecting a document requires a receptionist note of **minimum 20 characters** to ensure clear feedback for patients on why their document was rejected.

---

## Proposed Changes

### Component 1: Shared System Constants & Core Configs

#### [MODIFY] [constants.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/lib/constants.ts)
- Add `CHART_COLORS` config as defined by the master context:
  ```typescript
  export const CHART_COLORS = {
    laboratory: '#0D7C66',
    xray:       '#7C3AED',
    ultrasound: '#0891B2',
    ecg:        '#EA580C',
    flagged:    '#DC2626',
    normal:     '#16A34A',
    normalBand: '#16A34A',
    primary:    '#0D7C66',
    muted:      '#94A3B8',
  }
  ```

#### [MODIFY] [DepartmentChart.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/admin/dashboard/DepartmentChart.tsx)
- Import `CHART_COLORS` from `@/lib/constants` and replace hardcoded color hex strings inside the component.

#### [MODIFY] [layout.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/layout.tsx)
- Import and wrap the application layout with `<Toaster position="top-right" richColors />` from `sonner`.

---

### Component 2: API Routes for Document Reviews and Triage

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/reception/documents/route.ts)
- **GET**: Fetches all documents from the database, joining patient profiles (`first_name`, `last_name`, `date_of_birth`, etc.). Supports optional `?status=` query filter.
- Role Guard: Enforces `admin` or `receptionist` using `requireRole`.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/reception/documents/[id]/approve/route.ts)
- **POST**:
  1. Authorizes session: `admin` or `receptionist`.
  2. Updates document status to `'approved'` and sets audit fields: `reviewed_by` and `reviewed_at`.
  3. Writes receptionist's optional notes to `review_notes`.
  4. Calls `logEvent()` to record `DOCUMENT_APPROVED` in `system_logs`.
  5. Returns success response containing the updated document.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/reception/documents/[id]/reject/route.ts)
- **POST**:
  1. Authorizes session: `admin` or `receptionist`.
  2. Parses and validates payload (requires `rejection_reason` parameter, min 20 chars).
  3. Updates document status to `'rejected'`, saves `rejection_reason` to `rejection_reason` / `review_notes`.
  4. Calls `logEvent()` to record `DOCUMENT_REJECTED` in `system_logs`.
  5. Returns success response.

#### [NEW] [route.ts](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/api/reception/triage/route.ts)
- **POST**:
  1. Authorizes session: `admin` or `receptionist`.
  2. Validates parameters: `patient_id`, `department` (`'laboratory'`, `'imaging'`, `'ultrasound'`, `'ecg'`), `notes`, `vitals` (BP, weight, temperature).
  3. Computes the next Daily Queue Number:
     - Selects count of queue entries for target department created today: `created_at >= startOfToday`.
     - Next number = count + 1.
     - Maps department to code: `laboratory -> LAB`, `imaging -> IMG`, `ultrasound -> ULT`, `ecg -> ECG`.
     - Formats as `{CODE}-{count+1, zero-padded to 3 digits}` (e.g. `IMG-001`).
  4. Formats `triage_notes` field as a stringified JSON containing: `queue_number`, `vitals` (`blood_pressure`, `weight_kg`, `temperature_c`), and `notes`.
  5. Inserts new row to `patient_queue` with status = `'waiting'`, `patient_id`, and `department` (note: inserting `'imaging'` for Imaging department).
  6. Calls `logEvent()` to record `TRIAGE_COMPLETED` with queue details and `assigned_by` (current user ID) in metadata.
  7. Returns the new queue record and generated `queue_number`.

---

### Component 3: Frontend Pages & Components

#### [MODIFY] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/documents/page.tsx)
- Redirects to `/reception/queue` or imports the `ReceptionKanban` board directly to unify the view.

#### [NEW] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/queue/page.tsx)
- Server-rendered container fetching initial document list with joined patient data.
- Imports and renders the Client-Component Kanban Board `ReceptionKanban`.

#### [NEW] [loading.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/queue/loading.tsx)
- Renders 5 columns of skeleton card blocks matching the layout of the Kanban board.

#### [NEW] [ReceptionKanban.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/ReceptionKanban.tsx)
- **"use client"** components rendering the 5 Kanban columns:
  `Submitted | AI Verified | Staff Review | Approved | Rejected`.
- Displays card counts on column headers.
- Adds an amber border to cards in the `Staff Review` column.
- Color codes the OCR badges:
  - Green (score >= 85%)
  - Yellow (70% - 84%)
  - Red (< 70%)
  - Gray / Neutral ("Web Upload") for direct submissions.
- Formats submission dates with `formatDistanceToNow` in relative formats (e.g., "5 minutes ago").
- **Supabase Realtime Channel**:
  - Sets up subscription to `public.documents` INSERT and UPDATE events.
  - Updates Kanban state locally on receiving events, triggering smooth UI transitions without reloading the page.

#### [NEW] [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/queue/[documentId]/page.tsx)
- Document approval screen with a beautiful 3-panel responsive layout:
  - **Left Panel (Document & Patient details)**: Patient name, DOB, code, doc type, uploaded date, submission channel.
  - **Center Panel (OCR Monospace Extraction)**: Renders `ocr_text`. Highlight flagged parameters listed in `extracted_metadata.ocr_flags` in red with a ⚠ icon. Displays fallback message if no OCR data is present.
  - **Right Panel (ML Kit Confidence Report)**: Renders progress bars for parameters showing confidence levels from `extracted_metadata`. Color matches the confidence thresholds.
  - **Bottom Action Bar**: Actions for Approve (opens Triage modal), Reject (requires notes, destructive button), and Staff Notes text area.

#### [NEW] [TriageModal.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/TriageModal.tsx)
- shadcn Dialog prompting for routing options:
  - Select department (Laboratory, X-Ray, Ultrasound, ECG).
  - Preview generated queue number on selection.
  - Collapsible Vitals card: Blood Pressure, Weight in kg, Temperature in °C.
  - Confirm button makes POST request to `/api/reception/triage` and redirects to `/reception/queue` showing a success toast.

---

## Verification Plan

### Zero Step (Verification of Department Constraint)
- Done: Tested live insert via script. `'imaging'` is verified as the constraint-conforming value.

### Automated Tests
- Build verification: Run `npm run build` to confirm zero compilation errors.
- System logs verification: Run a verification script that checks `system_logs` for `DOCUMENT_APPROVED`, `DOCUMENT_REJECTED`, and `TRIAGE_COMPLETED` entries.

### Manual Verification
1. Create mock document record with high confidence (>= 85%). Verify it sits in `AI Verified` column on the Kanban.
2. Create mock document with low confidence (< 70%). Verify it sits in `Staff Review` with an amber left border.
3. Open approval screen for direct web upload. Verify fallback info text is rendered correctly.
4. Click Reject with less than 20 characters in Notes. Verify form validations trigger error.
5. Reject document with valid notes. Verify it moves to `Rejected` column and audit log is registered.
6. Approve document. Select department, expand vitals card, fill out BP/Temp, click Confirm. Verify success toast pops up and patient is routed into `patient_queue`.
7. Keep Kanban board open in a tab, insert a record in Supabase. Check if it appears instantly via Realtime channel.
