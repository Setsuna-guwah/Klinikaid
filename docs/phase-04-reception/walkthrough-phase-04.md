# Walkthrough — Phase 4: Reception Module

The Reception Module provides the clinic receptionist and admin with tools to validate patient-uploaded referrals (SO-B) and route patients to active department queues (SO-B) under a secure RBAC framework (SO-D).

## Changes Made

### 1. Unified Reception Queue Board
- Created [ReceptionKanban.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/ReceptionKanban.tsx) to render a 5-column dashboard (`Submitted`, `AI Verified`, `Staff Review`, `Approved`, `Rejected`).
- Integrated a live Supabase Realtime subscription (`postgres_changes` on the `documents` table). Any uploads or review status updates trigger instant UI card movements.
- Configured dynamic client-side categorization:
  - **Submitted**: Status is `'pending'` and uploader was a patient (no OCR confidence score).
  - **AI Verified**: Status is `'pending'` and OCR confidence is >= 85%.
  - **Staff Review**: Status is `'pending'` and OCR confidence is < 85%.
  - **Approved**: Status is `'approved'`.
  - **Rejected**: Status is `'rejected'`.
- Implemented styled indicators: amber borders for cards under `Staff Review` and colored OCR confidence badges.

### 2. Interactive Document Validation Screen
- Created [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/queue/[documentId]/page.tsx) and [DocumentApprovalClient.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/DocumentApprovalClient.tsx).
- Features a premium 3-panel layout:
  - **Left Panel**: Patient demographic details and document metadata.
  - **Center Panel**: Raw monospace OCR text rendering. High-risk parameters listed under `ocr_flags` are highlighted dynamically in red with warning icons.
  - **Right Panel**: ML Kit confidence scores, rendered with HSL progress gauges matching confidence levels.
  - **Bottom Action Bar**: Contains buttons to approve or reject the submission.

### 3. Integrated Triage Modal & Routing API
- Updated [TriageModal.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/components/TriageModal.tsx) to call `/api/reception/documents/[id]/approve` to approve the document before calling `/api/reception/triage` to insert the patient into the department queue.
- The triage API:
  - Validates session permissions.
  - Generates the next sequential Daily Queue Number formatted as `{DEPT}-{index}` (e.g. `IMG-001`).
  - Serializes vitals, notes, and the queue number into a single `triage_notes` JSON string.
  - Inserts a record into `patient_queue` with status `'waiting'`.
  - Logs `DOCUMENT_APPROVED` and `TRIAGE_COMPLETED` audit events in `system_logs`.

### 4. Polished Receptionist Dashboard
- Upgraded [page.tsx](file:///c:/Users/johnr/Desktop/Klinikaid/src/app/(dashboard)/reception/dashboard/page.tsx) to fetch and display actual counts of active queue patients, pending submissions, and total patients routed today, along with a recent activity list.

---

## Verification Plan

### Automated Build Check
- Run `npm run build` to verify zero compilation warnings/errors.

### Manual Verification Steps
1. **Queue Categorization Check**:
   - Access the `/reception/queue` Kanban board. Verify cards display in correct columns based on their OCR confidence levels.
2. **Document Inspection & Highlighting**:
   - Open a document card. Verify the 3-panel layout renders patient info, monospace OCR text, and AI confidence reports.
   - Confirm flagged parameters are highlighted in red in the center panel.
3. **Approval & Triage Workflow**:
   - Click "Approve & Route Patient". Select a department (e.g. Imaging).
   - Expand the Vitals card and record values. Click Confirm.
   - Confirm the success toast shows, the document moves to "Approved" on the Kanban board, and a queue entry is created.
4. **Rejection Workflow**:
   - Click "Reject Document" on a pending card.
   - Enter a message less than 20 characters. Verify that the button is disabled and an error helper appears.
   - Enter a detailed reason (>= 20 characters) and confirm rejection. Verify the card moves to "Rejected".
5. **Real-time Live Sync**:
   - Open the Kanban queue in a browser tab.
   - Insert a mock document into the Supabase database. Verify it appears on the board immediately.
