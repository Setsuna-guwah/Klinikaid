# Tasks — Phase 4: Reception Module

Task tracking for building the reception module's components, APIs, and pages.

## Checklist

### 1. Database & Config Preparation
- [ ] Add `CHART_COLORS` to `src/lib/constants.ts`
- [ ] Update `DepartmentChart.tsx` to reference `CHART_COLORS`
- [ ] Install shadcn components: `progress`, `textarea`, `sonner`
- [ ] Configure `RootLayout` (`src/app/layout.tsx`) to render `<Toaster />` from `sonner`

### 2. API Endpoints
- [ ] Create GET `/api/reception/documents`
- [ ] Create POST `/api/reception/documents/[id]/approve`
- [ ] Create POST `/api/reception/documents/[id]/reject`
- [ ] Create POST `/api/reception/triage`

### 3. Frontend UI Components
- [ ] Create `TriageModal.tsx` dialog (department selection, collapsible vitals, and notes)
- [ ] Create `ReceptionKanban.tsx` (5 columns, badges, relative timings, Realtime Supabase subscription)

### 4. Pages & Routing
- [ ] Redirect `/reception/documents` to `/reception/queue` in `src/app/(dashboard)/reception/documents/page.tsx`
- [ ] Create Kanban Queue Page `src/app/(dashboard)/reception/queue/page.tsx`
- [ ] Create Skeleton Page `src/app/(dashboard)/reception/queue/loading.tsx`
- [ ] Create Document Approval Page `src/app/(dashboard)/reception/queue/[documentId]/page.tsx`

### 5. Verification & Testing
- [ ] Run `npm run build` to verify zero compilation warnings/errors
- [ ] Insert mock documents in database to test each Kanban column categorization
- [ ] Test real-time UI updates by inserting records directly in database
- [ ] Verify form validation (e.g. 20-character min requirement for rejection)
- [ ] Route a patient and verify queue generation format (`{DEPT}-{count}`) and vitals formatting in `triage_notes`
- [ ] Verify `system_logs` entries for document approvals, rejections, and triage events
