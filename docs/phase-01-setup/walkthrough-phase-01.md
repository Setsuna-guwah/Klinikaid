# Walkthrough — Phase 1: Project Setup & Database Schema

Completed setup of the repository structure, database schema, core utilities, environment configurations, and initial page routes.

## 1. What Was Built

### Files Created
- `tailwind.config.ts` — configured for Tailwind v3 with standard HSL color mappings and tailwindcss-animate plugin.
- `src/app/globals.css` — initialized base Tailwind layers and configured variables for the Light/Dark slate and royal blue clinical theme.
- `src/app/layout.tsx` — root layout configured with the Google `Inter` font, system metadata, and Light/Dark HTML wrappers.
- `src/app/page.tsx` — default root page configured with force-dynamic rendering and automatic role-based/login redirects.
- `src/app/403/page.tsx` — custom Access Denied page displaying current session role and buttons to route to the user's dashboard or sign out.
- `src/middleware.ts` — application-wide middleware providing session refreshes and role-based path protection (`/admin/*`, `/reception/*`, `/department/*`, `/specialist/*`, `/patient/*`).
- `src/lib/supabase/client.ts` — browser client hook using `createBrowserClient` from `@supabase/ssr`.
- `src/lib/supabase/server.ts` — server-side cookie client hook using `createServerClient` from `@supabase/ssr`.
- `src/lib/supabase/admin.ts` — server-only client using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.
- `src/lib/supabase/middleware.ts` — cookie-handling session refresher for Next.js middleware.
- `src/lib/auth/helpers.ts` — helper guards: `getCurrentUser()`, `requireRole()`, and `requireDepartment()`.
- `src/lib/logger.ts` — safe-executing audit logger helper `logEvent()` that writes mutations to the `system_logs` table.
- `src/lib/api-response.ts` — standardized server action/handler response wrappers `successResponse()` and `errorResponse()`.
- `src/types/index.ts` — strict database type definitions for all tables and relations.
- `src/lib/constants.ts` — clinical variables, role colors, department badge mapping, and clinical lab reference ranges.
- `src/lib/db/schema.sql` — database migration file containing SQL tables, indexes, triggers, and Row Level Security policies.

## 2. Database Schema & RLS Policies

All MySQL references from the V2 Guide were mapped to Supabase PostgreSQL schema structures. Row Level Security (RLS) is enabled on all tables:

### Profiles Table
- **Purpose:** Extends `auth.users` with client metadata (roles, departments).
- **Triggers:** `on_auth_user_created` trigger fires `handle_new_user()` on signups, verifying roles/departments and logging registration.
- **RLS Policies:**
  - Admins: full CRUD access.
  - Staff: read-only access.
  - Users: read/update access to their own profile (with checks preventing role hijacking).

### Patients Table
- **Purpose:** Patient records.
- **RLS Policies:**
  - Admins & Receptionists: full CRUD access.
  - Staff & Specialists: read-only access.
  - Patients: read/update access to their own record (`profile_id = auth.uid()`).

### Patient Queue Table
- **Purpose:** Reception waitlist management.
- **RLS Policies:**
  - Admins & Receptionists: full CRUD access.
  - Department Staff: full CRUD access restricted to their own department (`department = get_auth_user_dept()`).
  - Specialists: read-only access.
  - Patients: read-only access to their own entries.

### Documents Table
- **Purpose:** Reception documents approval queue.
- **RLS Policies:**
  - Admins & Receptionists: full CRUD access.
  - Patients: read-only, create pending, and delete pending for their own records.

### Department Records Table
- **Purpose:** Medical lab/imaging test results.
- **RLS Policies:**
  - Admins: full CRUD access.
  - Department Staff: full CRUD access restricted to their own department.
  - Specialists: read-only access.
  - Patients: read-only access to their own records.

### System Logs Table
- **Purpose:** Audit logs.
- **RLS Policies:**
  - Admins: read-only access.
  - Authenticated Users: write-only access.

### Chatbot Logs Table
- **Purpose:** Token usage and Q&A history.
- **RLS Policies:**
  - Admins: read-only access.
  - Users: full access to their own chat history.

### RAG Documents Table
- **Purpose:** Vector KB for chatbot.
- **RLS Policies:**
  - Admins: full CRUD access.
  - Public: read-only access (for vector matches).
  - Indexing: HNSW index set up for cosine distance (`embedding vector_cosine_ops`).

## 3. Stack Decisions & Overrides

- **Tailwind Version:** Built on Tailwind v3 for stability with shadcn/ui.
- **Package Manager:** Standardized on `npm`.
- **Next.js Version:** Next.js 14 App Router.
- **SupabaseSSR:** Managed cookie serialization across Next.js boundary with `@supabase/ssr` server and browser clients.
- **TypeScript Strictness:** Removed all occurrences of `any` to prevent ESLint build failures. Used `unknown` and `@supabase/supabase-js`'s native `User` type.
- **AI Integration (OpenRouter Abandoned):** Abandoned OpenRouter. Integrated native Google Generative AI SDK for RAG/chat needs. Changed vector embedding model to `text-embedding-004` (768 dimensions), removing `openai` dependency.
