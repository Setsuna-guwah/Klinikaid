# MASTER_CONTEXT.md
## KlinikAid — Web Portal
### Paste this at the top of EVERY phase prompt in Antigravity

---

## Project Identity

**System Name:** KlinikAid
**Client:** Bloodcare Medical Laboratory, Burgos, Rodriguez, Rizal
**Type:** Multi-role internal clinic management web portal
**Context:** Academic capstone project (Healthioneers team)
**Scope:** Web portal only. Mobile app (OCR, patient mobile client) is a separate team.

---

## The Five Objectives This System Must Answer

- **SO-A** — AI-driven chatbot (RAG-grounded, 24/7 clinic inquiries) + web document submission pathway
- **SO-B** — Centralized web portal for staff: automated document validation, patient queue management, reduced manual data-entry for receptionists and medical technologists
- **SO-C** — Descriptive Analytics Dashboard: longitudinal patient lab data vs. medical reference ranges, read-only for specialists, NO AI diagnostics
- **SO-D** — RBAC framework: admin full oversight, enforced data privacy, hard department access restrictions
- **SO-E** — ISO 25010 software quality evaluation: functional suitability, usability, reliability, performance efficiency, security

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Everything. Staff management, system logs, RAG manager, all queues |
| `receptionist` | Reception queue, document approval, triage routing |
| `department_staff` | Their own department only (laboratory/xray/ultrasound/ecg). Hard-blocked from others. |
| `medical_specialist` | Patient search + analytics dashboard. Read-only. |
| `patient` | Their own dashboard, chatbot, document submit, status tracker, results |

---

## Tech Stack
### Authoritative — overrides any conflicting choice in the v2 web guide

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | TypeScript throughout, no exceptions |
| Styling | Tailwind CSS v3 + shadcn/ui | Tailwind v3 specifically for shadcn compatibility |
| Charts | Recharts (raw) | NOT shadcn/ui Charts — raw recharts is already in the codebase |
| Forms | React Hook Form + Zod | All forms. Input.tsx ref forwarding already fixed in Phase 2 |
| Dates | date-fns + date-fns-tz | All timestamps in Asia/Manila (UTC+8) |
| Database | Supabase PostgreSQL | Replaces MySQL from v2 guide |
| Vector DB | Supabase pgvector | Same project. `vector(768)` dimensions. HNSW cosine index. |
| Auth | Supabase Auth | TOTP MFA supported natively |
| File Storage | Supabase Storage | Document file uploads |
| Realtime | Supabase Realtime | Reception queue live updates. No polling. |
| Mutations | Next.js Server Actions | Web-only mutations. API Routes for endpoints shared with mobile. |
| LLM | Gemini 1.5 Flash | Chatbot responses AND PDF text extraction |
| Embeddings | Gemini text-embedding-004 | 768 dimensions. OpenRouter fully dropped — user decision. |
| Email | Resend | Optional. Transactional notifications. |
| State | React built-ins only | useState, useContext. No Zustand, no React Query. |
| Deployment | Vercel | No VPS. Everything in Supabase. |

### Packages in use (confirmed after Phase 3)
```
@supabase/ssr @supabase/supabase-js
react-hook-form zod @hookform/resolvers
date-fns date-fns-tz
@google/generative-ai
recharts
resend (optional)
```

### Packages explicitly NOT used — reject if Antigravity generates them
```
mysql2, pg, firebase, firebase-admin
pdf-parse (use Gemini native PDF reading)
@tanstack/react-query (use Server Components + Supabase Realtime)
zustand
openai (OpenRouter fully dropped — Gemini handles all AI)
```

---

## Confirmed File Structure (do not deviate)

```
src/
  app/
    (auth)/
      login/
        page.tsx
        actions.ts
      logout/
        actions.ts
    (dashboard)/
      layout.tsx                   ← auth verification, sidebar wrapper
      admin/
        dashboard/
          page.tsx
          loading.tsx
          DepartmentChart.tsx      ← "use client" chart component pattern
        staff/
          page.tsx
      reception/
        dashboard/page.tsx         ← stub, will be upgraded in Phase 4
      department/
        dashboard/page.tsx         ← stub, will be upgraded in Phase 5
      specialist/
        dashboard/page.tsx         ← stub, will be upgraded in Phase 6
      patient/
        dashboard/page.tsx         ← stub, will be upgraded in Phase 9
    403/
      page.tsx
    api/
      admin/
        dashboard-stats/route.ts
        staff/route.ts
        staff/[id]/route.ts
  components/
    sidebar.tsx
    ui/                            ← shadcn components
      input.tsx                    ← ref forwarding fixed in Phase 2
      table.tsx
      dialog.tsx
      sheet.tsx
      select.tsx
      switch.tsx
      card.tsx
      badge.tsx
  lib/
    supabase/
      client.ts                    ← createBrowserClient
      server.ts                    ← createServerClient (cookies)
      admin.ts                     ← service role, server-only
      middleware.ts                ← session refresher
    auth/
      helpers.ts                   ← getCurrentUser(), requireRole(), requireDepartment()
    logger.ts                      ← logEvent() → system_logs
    api-response.ts                ← successResponse(), errorResponse()
    constants.ts                   ← roles, departments, event types, lab reference ranges
    db/
      schema.sql
  types/
    index.ts                       ← all DB types, strict, no `any`
  middleware.ts                    ← route protection by role
```

---

## Database: Key Decisions (confirmed in Phase 1)

- `public.profiles` extends `auth.users` via `auth.uid()`
- `on_auth_user_created` trigger auto-creates profile row on signup
- `get_auth_user_dept()` PostgreSQL helper used in all department-scoped RLS policies
- RLS enabled on all tables — this is SO-D enforced at DB level
- Vector dimensions: **768** (Gemini text-embedding-004), HNSW index

### `department_records` Query Patterns (confirmed in Phase 5)
- Storage: flat relational rows — one row per test parameter per patient visit
- Phase 5 display: groups rows by `created_at` client-side for cohesive report cards
- Phase 6 analytics: queries by `test_name` across multiple dates for time-series charting
  - `SELECT * FROM department_records WHERE patient_id = ? AND test_name = ? ORDER BY result_date ASC`
- `is_flagged` is computed server-side and stored — Phase 6 uses this to color data points red vs teal
- `result_date` is the correct field for X-axis of analytics chart (not `created_at`)

### `triage_notes` JSON Structure (established in Phase 4)
`patient_queue.triage_notes` stores a JSON string — parse with `JSON.parse()` in any phase that displays queue info:
```json
{
  "queue_number": "LAB-001",
  "vitals": {
    "blood_pressure": "120/80",
    "weight_kg": 70,
    "temperature_c": 36.5
  },
  "notes": "Optional receptionist notes"
}
```
Vitals fields are optional (null if not recorded). `queue_number` is always present.
Phase 5 (dept queue display) and Phase 9 (patient status tracker) must use this structure.

### Document Status Values (confirmed in Phase 4 pre-build scan)
- `documents.status` CHECK: `'pending'` | `'approved'` | `'rejected'`
- Initial value is `'pending'` — Phase 3 dashboard stats query is correct as-is
- Kanban columns are client-side inference from `ocr_confidence_score`:
  - pending + no OCR score → "Submitted"
  - pending + score ≥ 85 → "AI Verified"
  - pending + score < 85 → "Staff Review"
  - approved → "Approved" | rejected → "Rejected"
- `patient_queue.status` CHECK: `'waiting'` | `'in_progress'` | `'completed'` | `'cancelled'`
- Triage inserts `status = 'waiting'` (not `'routed'` — not a valid value)
- `patient_queue` has NO `queue_number` column — stored in `triage_notes` JSON
- `patient_queue.department` confirmed value: `'imaging'` (not `'xray'` — live insert test verified this in Phase 4)

---

## Standing Code Rules (enforced every phase)

1. **Session first** — Every Server Action and API Route calls `supabase.auth.getUser()` as its literal first line. Return 401 immediately if no valid session.
2. **Role from DB only** — Role and department come from `public.profiles` via `auth.uid()`. Never from request body, query params, or manually set cookies.
3. **RLS on every table** — Write policies immediately after `CREATE TABLE`. Never create a table without policies.
4. **Service role key is server-only** — `SUPABASE_SERVICE_ROLE_KEY` never appears in any `"use client"` file.
5. **Log all mutations** — Every create, update, delete, approve, reject → `logEvent()` → `system_logs`.
6. **No raw errors to client** — Use `errorResponse()` wrapper. Full errors to server console only.
7. **Interactive pages use a server + client split** — Pattern confirmed across Phases 3 and 4:
   - `[feature]/page.tsx` → server component, handles auth check + initial data fetch
   - `[Feature]Client.tsx` → `"use client"`, receives data as props, handles all interaction
   - Examples so far: `DepartmentChart.tsx`, `ReceptionKanban.tsx`, `DocumentApprovalClient.tsx`
   - Phases 5, 6, and 9 must follow this same split pattern
8. **`useSearchParams()` always in `<Suspense>`** — Required in this project to avoid Next.js build warnings.
9. **UTC+8 for all displayed timestamps** — Use `date-fns-tz` with `Asia/Manila` timezone.
10. **Supabase Realtime payloads don't include joins** — Realtime emits only the changed row. Client must patch joined data (e.g. patient name) from already-loaded state or trigger a targeted refetch. Never assume Realtime gives the full joined object.

---

## Phases Completed

| Phase | Status | Key Output |
|---|---|---|
| Phase 1 — Setup & DB Schema | ✅ Complete | All tables, RLS, auth helpers, types, constants, middleware |
| Phase 2 — Auth & Multi-Role Setup | ✅ Complete | Login/logout actions, MFA, sidebar, dashboard layout, role stubs |
| Phase 3 — Admin Dashboard & Staff Mgmt | ✅ Complete | Stats API, staff CRUD, Recharts dept chart, Puppeteer verified |
| Phase 4 — Reception Module | ✅ Complete | Kanban, DocumentApprovalClient, TriageModal, Realtime, reception dashboard upgraded |
| Phase 5 — Department Staff Module | ✅ Complete | Relational records, auto-flag blur validation, dynamic dept forms, build 28/28 |
| Phase 6 — Specialist Analytics | 🔲 Next | Patient search, longitudinal Recharts charts |
| Phase 7 — RAG Knowledge Base | 🔲 Upcoming | PDF upload, Gemini embedding, chatbot endpoint |
| Phase 8 — System Logs | 🔲 Upcoming | Event log viewer, chatbot audit, cost tracker |
| Phase 9 — Patient-Facing Pages | 🔲 Upcoming | Register, dashboard, chatbot UI, doc submit, status tracker |
| Phase 10 — Polish & Integration | 🔲 Upcoming | Error boundaries, loading states, final integration |
| Phase 11 — ISO 25010 Eval Prep | 🔲 Upcoming | Test cases, performance tools, UAT scorecard |

---

## Chart Color Standard (add to src/lib/constants.ts if not present)

Raw Recharts doesn't pull from CSS variables automatically, so all chart colors must
come from this shared constant. Every phase that builds a chart uses these — never
hardcoded hex strings inside chart components.

```typescript
export const CHART_COLORS = {
  laboratory: '#0D7C66',  // teal — primary brand color
  xray:       '#7C3AED',  // purple
  ultrasound: '#0891B2',  // cyan
  ecg:        '#EA580C',  // orange
  flagged:    '#DC2626',  // red — out-of-range values
  normal:     '#16A34A',  // green — within normal range
  normalBand: '#16A34A',  // green fill for reference area (use with low opacity)
  primary:    '#0D7C66',  // default line/bar color
  muted:      '#94A3B8',  // gray — secondary data
}
```

Phases that use charts: 3 (done), 5 (auto-flag display), 6 (analytics dashboard), 8 (cost tracker).
All must import from `CHART_COLORS`. If Phase 3's DepartmentChart.tsx has hardcoded hex values,
update them to use this constant when convenient — not urgently, but before Phase 11 evaluation.

---

## Things to Remove Before Defense
- Auto-generate password button in staff creation form (labeled "Development Convenience")

---

## Environment Variables
```
DATABASE_URL                      — Direct PostgreSQL connection string. Used by Antigravity to run migrations automatically via script. Never printed to chat.
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         ← server-only, never in "use client" files
GEMINI_API_KEY                    ← only AI key, handles LLM + embeddings
RESEND_API_KEY                    ← optional
NEXT_PUBLIC_CLINIC_NAME           = "Bloodcare Medical Laboratory"
NEXT_PUBLIC_CLINIC_ADDRESS        = "Burgos, Rodriguez, Rizal"
FREE_TIER_TOKEN_LIMIT             = 10000000
CHAT_RATE_LIMIT_PER_HOUR         = 20
```

---

## Current Phase
**Currently building: Phase 6 — Specialist Analytics**

