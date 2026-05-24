# Database & Schema Reference
*Details of schemas, triggers, Row-Level Security, migrations, and RPC functions in KlinikAid*

This document serves as the authoritative schema guide for the KlinikAid Supabase PostgreSQL database.

---

## Database Tables

KlinikAid uses 8 primary tables to manage application state:

### 1. `profiles`
- **Purpose**: Extends Supabase auth.users with application-specific roles and metadata. Created automatically by database triggers on auth signup.
- **Key Columns**:
  - `id` (uuid, PK, FK `auth.users.id` ON DELETE CASCADE)
  - `full_name` (text, NOT NULL)
  - `role` (text, NOT NULL, CHECK: `'admin' | 'receptionist' | 'department_staff' | 'medical_specialist' | 'patient'`)
  - `department` (text, CHECK: `'laboratory' | 'imaging' | 'ultrasound' | 'ecg'`)
  - `is_active` (boolean, default true, NOT NULL)
  - `accepted_privacy_at` (timestamp with time zone, nullable)
- **RLS Summary**:
  - Admins: Full access.
  - Staff & Specialists: Select access to all profiles.
  - Owners (auth.uid() = id): Select own profile, and Update own profile (role change is blocked during update).

### 2. `patients`
- **Purpose**: Stores clinical profiles of patients. Every patient user has a `profiles` row (role `'patient'`) linked to a `patients` row.
- **Key Columns**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `profile_id` (uuid, FK `profiles.id` ON DELETE SET NULL)
  - `first_name`, `last_name` (text, NOT NULL)
  - `date_of_birth` (date, NOT NULL)
  - `gender` (text, CHECK: `'male' | 'female' | 'other'`)
  - `contact_number`, `address` (text, NOT NULL)
  - `email` (text, nullable)
- **RLS Summary**:
  - Admins: Full access.
  - Receptionists: Full access.
  - Department Staff & Specialists: Select access.
  - Owners (`profile_id = auth.uid()`): Select own record, and Update own details.

### 3. `patient_queue`
- **Purpose**: Manages active clinical department waitlists and triage records.
- **Key Columns**:
  - `id` (bigint, PK, identity)
  - `patient_id` (uuid, FK `patients.id` ON DELETE CASCADE, NOT NULL)
  - `status` (text, default `'waiting'`, CHECK: `'waiting' | 'in_progress' | 'completed' | 'cancelled'`)
  - `department` (text, CHECK: `'laboratory' | 'imaging' | 'ultrasound' | 'ecg'`)
  - `triage_notes` (text) — **CRITICAL**: Stored as a JSON string containing queue details and vitals (e.g. `{"queue_number": "L-001", "vitals": {"blood_pressure": "120/80", "weight_kg": 70, "temperature_c": 36.5}}`).
  - `priority_level` (text, default `'routine'`, CHECK: `'routine' | 'urgent' | 'emergency'`)
  - `estimated_wait_minutes` (integer)
- **RLS Summary**:
  - Admins: Full access.
  - Receptionists: Full access.
  - Department Staff: Full access but locked to their own profile department (`department = public.get_auth_user_dept()`).
  - Specialists: Select access.
  - Patients: Select own queue entries.

### 4. `documents`
- **Purpose**: Tracks patient diagnostic uploads requiring front-desk review and validation.
- **Key Columns**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `patient_id` (uuid, FK `patients.id` ON DELETE CASCADE)
  - `uploader_id` (uuid, FK `profiles.id` ON DELETE SET NULL, NOT NULL)
  - `file_name` (text, NOT NULL)
  - `file_path` (text, NOT NULL) — Holds the object key inside the storage bucket.
  - `file_type` (text, NOT NULL)
  - `status` (text, default `'pending'`, CHECK: `'pending' | 'approved' | 'rejected'`)
  - `ocr_text` (text, nullable)
  - `extracted_metadata` (jsonb, nullable)
  - `rejection_reason` (text, nullable)
- **RLS Summary**:
  - Admins & Receptionists: Full access.
  - Patients: Select own documents, Insert own documents, and Update own documents (only if status is `'pending'`).

### 5. `department_records`
- **Purpose**: Stores clinical values and results recorded by department personnel. Follows a flat relational structure (one row per parameter per visit).
- **Key Columns**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `patient_id` (uuid, FK `patients.id` ON DELETE CASCADE, NOT NULL)
  - `recorder_id` (uuid, FK `profiles.id` ON DELETE SET NULL, NOT NULL)
  - `department` (text, CHECK: `'laboratory' | 'imaging' | 'ultrasound' | 'ecg'`)
  - `test_type` (text, NOT NULL)
  - `test_name` (text, NOT NULL)
  - `test_value` (text, NOT NULL)
  - `unit` (text)
  - `reference_range_min`, `reference_range_max` (numeric)
  - `is_flagged` (boolean, default false, NOT NULL) — Flagged if `test_value` falls out of normal ranges.
- **RLS Summary**:
  - Admins: Full access.
  - Department Staff: Full access limited strictly to their own department (`department = public.get_auth_user_dept()`).
  - Specialists: Select access to all records.
  - Patients: Select access to own records.

### 6. `system_logs`
- **Purpose**: Audit trail documenting administrative actions, security failures, and portal updates.
- **Key Columns**:
  - `id` (bigint, PK, identity)
  - `user_id` (uuid, FK `profiles.id` ON DELETE SET NULL, nullable)
  - `event_type` (text, NOT NULL) — Maps to `SYSTEM_EVENT_TYPES` keys.
  - `description` (text, NOT NULL)
  - `ip_address` (text, nullable)
  - `metadata` (jsonb, nullable)
- **RLS Summary**:
  - Admins: Select access.
  - Authenticated Users: Insert access.

### 7. `chatbot_logs`
- **Purpose**: Tracks patient queries, AI responses, and token counts.
- **Key Columns**:
  - `id` (bigint, PK, identity)
  - `user_id` (uuid, FK `profiles.id` ON DELETE CASCADE, nullable)
  - `session_id` (text, NOT NULL)
  - `user_message` (text, NOT NULL)
  - `bot_response` (text, NOT NULL)
  - `tokens_used` (integer, default 0, NOT NULL)
- **RLS Summary**:
  - Admins: Select access.
  - Owners (`user_id = auth.uid()`): Full access.

### 8. `rag_documents`
- **Purpose**: Stores RAG knowledge chunks for grounding the AI assistant.
- **Key Columns**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `title` (text, NOT NULL)
  - `content` (text, NOT NULL)
  - `embedding` (vector(768), NOT NULL) — 768-dimensional float array.
  - `metadata` (jsonb, nullable)
- **RLS Summary**:
  - Admins: Full access.
  - Public: Select access.

---

## Migration History

The schema has evolved through four key migrations under `src/lib/db/`:

1. **`migration_07.sql`** (pgvector Search)
   - Created the `match_documents` similarity search RPC.
2. **`migration_08.sql`** (Token Management & Indexing)
   - Created the `get_daily_token_usage` RPC and added the index `idx_chatbot_logs_session_id`.
3. **`migration_09.sql`** (Storage Bucket)
   - Created the private `patient-documents` bucket and added storage policies.
4. **`migration_10.sql`** (Data Privacy Gate)
   - Added the `accepted_privacy_at` consent timestamp to `public.profiles`.

---

## RPCs and Trigger Functions

### `public.handle_new_user()`
- **Type**: `TRIGGER` (AFTER INSERT on `auth.users`)
- **Behavior**:
  1. Extracts metadata (`full_name`, `role`, `department`) provided during signup.
  2. Ensures the role defaults to `'patient'` if invalid.
  3. Enforces department constraints (null unless role is `'department_staff'`).
  4. Inserts a matching row into `public.profiles`.
  5. Inserts an audit log entry (`USER_REGISTERED`) into `public.system_logs`.

### `public.match_documents(query_embedding vector(768), match_threshold float, match_count int)`
- **Type**: `RPC`
- **Returns**: `TABLE (id, title, content, metadata, similarity)`
- **Behavior**: Scans `rag_documents` table using cosine distance (`<=>`) to return context chunks matching similarity $\ge$ `match_threshold`.

### `public.get_daily_token_usage(start_date timestamptz)`
- **Type**: `RPC`
- **Returns**: `TABLE (date, total_tokens, query_count)`
- **Behavior**: Sums total tokens used by chatbot in Asia/Manila (UTC+8) terms since `start_date`.

### `public.get_auth_user_role()` / `public.get_auth_user_dept()`
- **Type**: `HELPER`
- **Behavior**: Retrieves role and department of `auth.uid()` securely on the database side to resolve RLS checks without recursion.

---

## Important Enumerated Values

Devs must use these exact values to prevent database inserts from failing the constraints:

- **Clinicial Departments**: `'laboratory'`, `'imaging'`, `'ultrasound'`, `'ecg'` (never use `'xray'`).
- **User Roles**: `'admin'`, `'receptionist'`, `'department_staff'`, `'medical_specialist'`, `'patient'`.
- **Priority Levels**: `'routine'`, `'urgent'`, `'emergency'`.
- **Queue Status**: `'waiting'`, `'in_progress'`, `'completed'`, `'cancelled'`.
- **Document Status**: `'pending'`, `'approved'`, `'rejected'`.
