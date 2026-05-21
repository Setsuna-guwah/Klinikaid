# Phase 1 — Project Setup & Database Schema Plan

Establish the foundational architecture, including repository structures, PostgreSQL schema, RLS safety protocols, and server/client Supabase integrations.

## Proposed Changes

### 1. Project Configuration
- Scaffold Next.js 14 App Router project with Tailwind CSS v3 & shadcn/ui.
- Configure `tsconfig.json` and strict typing rules.
- Set up `.env.local` configurations.

### 2. Supabase Integration Layer
- Implement `src/lib/supabase/client.ts` (browser hook).
- Implement `src/lib/supabase/server.ts` (server actions client).
- Implement `src/lib/supabase/admin.ts` (bypasses RLS for admin scripts).
- Implement `src/lib/supabase/middleware.ts` (session refresh inside Next middleware).

### 3. Database Schema (`src/lib/db/schema.sql`)
- Implement PostgreSQL tables:
  - `profiles`: user roles & departments mapping.
  - `patients`: medical card records.
  - `patient_queue`: waitlist traffic.
  - `documents`: referrals waiting validation.
  - `department_records`: laboratory/imaging results.
  - `system_logs`: audit logging.
  - `chatbot_logs`: LLM conversations.
  - `rag_documents`: vector store for Q&A (pgvector).
- Write custom triggers: `on_auth_user_created` trigger to auto-generate profile record on sign up.
- Enforce Row Level Security (RLS) on all tables.

### 4. Router Security
- Configure `src/middleware.ts` to block path prefixes based on role categories: `/admin`, `/reception`, `/department`, `/specialist`, `/patient`.

## Verification Plan
- Build check: `npm run build` succeeds.
- Database validation: check all tables, triggers, and indices execute properly.
