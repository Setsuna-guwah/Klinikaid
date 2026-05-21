# MASTER_CONTEXT.md
## KlinikAid — Web Portal
### Paste this at the top of EVERY phase prompt in Antigravity

---

## Project Identity

**System Name:** KlinikAid
**Client:** Bloodcare Medical Laboratory, Burgos, Rodriguez, Rizal
**Type:** Multi-role internal clinic management web portal
**Context:** Academic capstone project (Healthioneers team)
**Scope of this file:** Web portal only. Mobile app (OCR, patient mobile client) is handled separately by another team member.

---

## The Five Objectives This System Must Answer

Every feature we build maps to at least one of these. If something doesn't map, we don't build it.

- **SO-A** — AI-driven chatbot (RAG-grounded, 24/7 clinic inquiries) + web document submission pathway
- **SO-B** — Centralized web portal for staff: automated document validation, patient queue management, reduced manual data-entry for receptionists and medical technologists
- **SO-C** — Descriptive Analytics Dashboard: longitudinal patient lab data plotted against medical reference ranges, read-only for specialists, NO AI diagnostics whatsoever
- **SO-D** — RBAC framework: admin full oversight, enforced data privacy, hard department access restrictions
- **SO-E** — ISO 25010 software quality evaluation: functional suitability, usability, reliability, performance efficiency, security

---

## User Roles

| Role | What They Access |
|---|---|
| `admin` | Everything. Staff management, system logs, RAG manager, all queues |
| `receptionist` | Reception queue, document approval, triage routing |
| `department_staff` | Their department only (lab/xray/ultrasound/ecg). Hard-blocked from others. |
| `medical_specialist` | Patient search + analytics dashboard. Read-only. |
| `patient` | Their own dashboard, chatbot, document submit, status tracker, results |

---

## Final Tech Stack
### These decisions OVERRIDE any conflicting tool choices in the v2 web guide

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | TypeScript throughout, no exceptions |
| Styling | Tailwind CSS + shadcn/ui | All components from shadcn unless no option exists |
| Charts | shadcn/ui Charts | Built on Recharts. Use this, NOT raw Recharts directly |
| Forms | React Hook Form + Zod | All forms. Validation schemas defined with Zod |
| Dates | date-fns + date-fns-tz | All timestamps displayed in Asia/Manila (UTC+8) |
| Database | Supabase PostgreSQL | Replaces MySQL from v2 guide |
| Vector DB | Supabase pgvector | Same Supabase project, `CREATE EXTENSION vector`. Replaces separate pgvector instance from v2 guide |
| Auth | Supabase Auth | Replaces Firebase Auth from v2 guide. Supports TOTP MFA natively |
| File Storage | Supabase Storage | Replaces manual file path storage from v2 guide |
| Realtime | Supabase Realtime | For reception queue live updates. Replaces React Query polling from v2 guide |
| Mutations | Next.js Server Actions | For web-only mutations. API Routes only for endpoints shared with mobile (e.g., /api/chat) |
| LLM | Gemini 1.5 Flash | For chatbot responses AND PDF text extraction. Replaces OpenRouter LLM calls from v2 guide |
| Embeddings | OpenRouter API | Model: openai/text-embedding-ada-002, 1536 dimensions. Keep as-is from v2 guide |
| Email | Resend | Optional. Transactional emails (document approved, account created) |
| State | React built-ins | useState, useContext only. No Zustand, no React Query |
| Deployment | Vercel | No VPS needed. Everything is in Supabase |

### Packages to install (authoritative list)
```bash
npm install @supabase/ssr @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install date-fns date-fns-tz
npm install openai          # OpenRouter uses OpenAI SDK format
npm install @google/generative-ai
npm install resend
```

### Packages explicitly NOT used (remove if generated)
- ~~mysql2~~ — replaced by Supabase
- ~~pg~~ — replaced by Supabase
- ~~firebase~~ / ~~firebase-admin~~ — replaced by Supabase Auth
- ~~pdf-parse~~ — replaced by Gemini native PDF reading
- ~~@tanstack/react-query~~ — replaced by Server Components + Supabase Realtime
- ~~zustand~~ — not needed

---

## Database: Supabase Schema Decisions

### Auth
Supabase Auth handles the `auth.users` table. We extend it with a `public.profiles` table linked via `auth.uid()`.

### Row Level Security (RLS)
**RLS must be enabled on every table.** This is how we enforce SO-D at the database level — not just in the app. A department_staff user literally cannot query another department's rows even if they bypass the API.

Every table creation must be followed immediately by its RLS policies.

### pgvector
The `rag_documents` table lives in the same Supabase project. Enable the extension once:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Embedding dimensions: **1536** (matching text-embedding-ada-002).

---

## Security Rules (Apply to ALL Phases)

These are non-negotiable and must be implemented in every phase, not added later:

1. **Session first** — Every Server Action and API Route must call `supabase.auth.getUser()` as its first line. If no valid session, return immediately with 401/redirect.
2. **Role from session only** — User role and department are read from `public.profiles` using the authenticated `user.id`. Never from request body, query params, or cookies you set manually.
3. **RLS on every table** — Write RLS policies alongside table creation, not as an afterthought.
4. **Service role key is server-only** — `SUPABASE_SERVICE_ROLE_KEY` is used only in Server Actions and API Routes. Never in client components. Never in any file with `"use client"`.
5. **Anon key is public** — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose. They're locked down by RLS.
6. **Log all mutations** — Every create, update, delete, approve, reject operation must write a row to `system_logs`. Use the `logEvent()` utility (created in Phase 1).
7. **No raw errors to client** — API errors return generic messages. Full errors go to server console only.
8. **Department isolation** — Any query touching `department_records` must include a department filter sourced from the authenticated user's profile. The RLS policy enforces this as a backup.

---

## Prompt Protocol (How to Use This File)

### Structure of every Antigravity session:

```
[This MASTER_CONTEXT.md pasted in full]

---

[The phase prompt from the v2 web guide]

Note: Where the v2 guide mentions MySQL, use Supabase PostgreSQL.
Where it mentions Firebase Auth, use Supabase Auth.
Where it mentions React Query polling, use Supabase Realtime.
Where it mentions raw Recharts, use shadcn/ui Charts.
Where it mentions pdf-parse, use Gemini native PDF reading.

---

SECURITY REQUIREMENTS FOR THIS PHASE:
- Enable RLS on all new tables and write policies immediately after table creation
- All Server Actions must call supabase.auth.getUser() as the first operation
- Role and department must be sourced from public.profiles using auth.uid() only
- Log all mutations to system_logs using the logEvent() utility
- SUPABASE_SERVICE_ROLE_KEY must only appear in server-side files

---

BEFORE WRITING ANY CODE:
Output your plan for this phase:
1. Files you will create (full paths)
2. Tables you will create or query
3. RLS policies you will write
4. Server Actions vs API Routes decision for each operation
5. Any assumptions you are making
6. Potential conflicts with previously built phases

Do not write any code until I approve the plan.
```

---

## Environment Variables Reference

Tell Antigravity these variable names exist in `.env.local`. Never paste the actual values into any prompt.

```
NEXT_PUBLIC_SUPABASE_URL          — Supabase project URL (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY     — Supabase anon key (safe to expose, locked by RLS)
SUPABASE_SERVICE_ROLE_KEY         — Server-only. Bypasses RLS. Never in client code.
OPENROUTER_API_KEY                — For embeddings only (text-embedding-ada-002)
GEMINI_API_KEY                    — For chatbot LLM and PDF extraction
RESEND_API_KEY                    — For transactional emails (optional)
NEXT_PUBLIC_CLINIC_NAME           — "Bloodcare Medical Laboratory"
NEXT_PUBLIC_CLINIC_ADDRESS        — "Burgos, Rodriguez, Rizal"
FREE_TIER_TOKEN_LIMIT             — 10000000
CHAT_RATE_LIMIT_PER_HOUR          — 20
```

---

## Current Phase Being Built

**[ UPDATE THIS LINE EACH SESSION ]**
Currently building: Phase ___ — ___________________________

---
*This file is the source of truth for all stack decisions. It overrides any conflicting choices in the v2 web guide. The v2 guide remains the source of truth for feature logic, phase order, and objectives mapping.*
