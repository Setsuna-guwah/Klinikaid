# KlinikAid — Web Implementation Guide (v2)
### Actionable Build Plan with Antigravity Prompts
### Now with Objectives Traceability
**Focus: Web Portal Only (Admin, Receptionist, Department Staff, Medical Specialist, Patient)**

---

## READ THIS FIRST — Your Objectives Are Your Acceptance Criteria

Before writing a single line of code, internalize this: your specific objectives are not just academic writing. They are the **checklist your panelists, advisers, and client will use to judge whether your system succeeded.** Every screen you build, every API route you write, every feature you add must be traceable to at least one of these objectives. If it isn't, it's scope creep. If an objective has no corresponding working feature, your defense has a hole in it.

This guide is structured so that every phase explicitly states which objective(s) it answers, and how.

---

## Your Objectives — Stated Clearly

### General Objective (GO)
> To design an AI-assisted web and mobile clinic communication platform that will help assist Bloodcare Medical Laboratory with **information dissemination, inquiry handling, and administrative document management** in a clinic setting.

This is your umbrella. Every specific objective contributes to this. When your system is complete, you should be able to demonstrate all three pillars — information dissemination, inquiry handling, and document management — are working.

---

### Specific Objectives

**SO-A** — To design a mobile-accessible platform that empowers patients with an **AI-driven chatbot** for 24/7 routine clinic inquiries and **Edge OCR technology** for the secure, remote submission of diagnostic referral documents.

**SO-B** — To develop a **centralized web portal** tailored for core operational staff, automating document validation and streamlining patient queue management to significantly **reduce manual data-entry workloads** for receptionists and medical technologists.

**SO-C** — To create a **secure Descriptive Analytics Dashboard** that visualizes longitudinal patient diagnostic data against standardized medical baselines, aiding visiting medical specialists in clinical assessments **without employing AI-driven diagnostics.**

**SO-D** — To implement a **secure, Role-Based Access Control (RBAC)** framework that grants the clinic administrator full system oversight, strictly enforces data privacy, and securely restricts departmental access.

**SO-E** — To **evaluate the system's software quality** among all end-users — patients, staff, doctors, and administrators — using the **ISO 25010 model** to rate functional suitability, usability, reliability, performance efficiency, and security.

---

## Objectives Traceability Matrix

This table shows exactly which phase of your web build answers which objective. Use this as your **defense map** — when a panelist asks "how does your system achieve SO-C?", you point to Phase 6.

| Phase | What's Built | GO | SO-A | SO-B | SO-C | SO-D | SO-E |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** — Setup & DB Schema | Foundation: all tables, both databases | ✓ | | | | | |
| **2** — Auth & RBAC | Login, MFA, role middleware, sidebar | ✓ | | | | **✓** | |
| **3** — Admin Dashboard & Staff Mgmt | Admin overview, staff CRUD | ✓ | | ✓ | | **✓** | |
| **4** — Reception Module | Queue, Document Approval, Triage | ✓ | | **✓** | | ✓ | |
| **5** — Department Staff Module | Dept records, record entry, auto-flagging | ✓ | | **✓** | ✓ | ✓ | |
| **6** — Specialist Analytics | Patient search, longitudinal charts | ✓ | | | **✓** | ✓ | |
| **7** — RAG Knowledge Base | Policy indexing, chatbot RAG endpoint | ✓ | **✓** | | | | |
| **8** — System Logs | Event logs, chatbot audit, cost tracker | ✓ | | | | **✓** | ✓ |
| **9** — Patient-Facing Pages | Register, dashboard, chatbot UI, doc submit | ✓ | **✓** | | | | |
| **10** — Polish & Integration | Error handling, loading states, types | ✓ | | | | | ✓ |
| **11** *(NEW)* — ISO 25010 Evaluation Prep | Measurable criteria, UAT instruments | ✓ | | | | | **✓** |

**Bold ✓** = this phase is the *primary* answer to that objective.
**Plain ✓** = this phase *contributes to* that objective.

---

## Important Note on SO-A (Web's Role)

SO-A is primarily a **mobile objective** — Edge OCR lives entirely on the Android app. However, the web portal is still responsible for two things that make SO-A possible:

1. **The RAG chatbot API endpoint** (Phase 7) — the web backend hosts this. Without it, the mobile chatbot has no intelligence. This is your web team's contribution to SO-A.
2. **The web version of patient document submission** (Phase 9) — patients on desktop can still submit documents (without OCR pre-screening). This is a secondary fulfillment of SO-A's document submission goal.

When writing your paper's evaluation, make sure your team acknowledges this split explicitly: "SO-A was fulfilled through the mobile app's OCR and chatbot client (handled by the mobile team) and the web backend's RAG endpoint and document submission pathway (handled by the web team)."

---
---

## PHASE 1 — Project Setup & Database Schema

### Objectives Answered
- **GO** — The database schema is the structural backbone of all three pillars (information, inquiry, documents). Nothing works without it.

### What This Phase Proves
When your panelist asks "how does KlinikAid manage data securely?", you point to your dual-database design: MySQL for structured patient records (fast queries, relational integrity) and PostgreSQL/pgvector for the RAG knowledge base (semantic search for the chatbot). The department partitioning in `department_records` is your first physical implementation of SO-D — data privacy is enforced at the schema level, not just the application level.

### Step-by-Step

**Step 1.1 — Scaffold the Next.js Project**

```bash
npx create-next-app@latest klinikaid-web --typescript --tailwind --eslint --app
cd klinikaid-web
npx shadcn@latest init
npm install mysql2 pg prisma @prisma/client
npm install next-auth firebase-admin
npm install recharts
npm install openai
npm install @tanstack/react-query zustand pdf-parse
npx prisma init
```

**Step 1.2 — MySQL Schema (Structured Records)**

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin','receptionist','department_staff','medical_specialist','patient') NOT NULL,
  department ENUM('laboratory','xray','ultrasound','ecg','general') DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  accepted_privacy_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  patient_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  contact_number VARCHAR(20),
  address TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE patient_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  queue_number VARCHAR(20) NOT NULL,
  status ENUM('waiting','in_triage','routed','completed') DEFAULT 'waiting',
  assigned_department ENUM('laboratory','xray','ultrasound','ecg','general') DEFAULT NULL,
  assigned_by INT DEFAULT NULL,
  notes TEXT,
  arrived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  routed_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500),
  ocr_extracted_text TEXT,
  ocr_confidence_score DECIMAL(5,2) DEFAULT NULL,
  ocr_flags JSON DEFAULT NULL,
  status ENUM('submitted','ai_verified','staff_review','approved','rejected') DEFAULT 'submitted',
  reviewed_by INT DEFAULT NULL,
  review_notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- SO-C data source: department_records is what feeds the analytics dashboard
-- SO-D enforcement: queries are always filtered by department from the JWT, never from request body
CREATE TABLE department_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  department ENUM('laboratory','xray','ultrasound','ecg') NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50),
  reference_range_min DECIMAL(10,3) DEFAULT NULL,
  reference_range_max DECIMAL(10,3) DEFAULT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  recorded_by INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  result_date DATE NOT NULL,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT,
  ip_address VARCHAR(45),
  metadata JSON DEFAULT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SO-A + SO-E: chatbot logs support both the audit trail and ISO 25010 performance evaluation
CREATE TABLE chatbot_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  user_query TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  tokens_used INT DEFAULT NULL,
  api_cost DECIMAL(10,6) DEFAULT NULL,
  queried_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 1.3 — PostgreSQL + pgvector Schema (RAG)**

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX ON rag_documents USING ivfflat (embedding vector_cosine_ops);
```

---

### Antigravity Prompt — Phase 1

```
I'm building a web portal called KlinikAid for a medical laboratory clinic in the Philippines.
It's a multi-role internal dashboard for clinic staff and patients.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, MySQL 8.0 for 
structured records, PostgreSQL with pgvector for a RAG chatbot knowledge base, 
Firebase Auth for authentication with MFA.

The system has 5 user roles: admin, receptionist, department_staff, medical_specialist, patient.
Department staff are further assigned to one of: laboratory, xray, ultrasound, ecg.

Please scaffold the project structure:

1. /lib/db/mysql.ts — MySQL connection pool using mysql2/promise
2. /lib/db/postgres.ts — PostgreSQL client using the 'pg' package
3. /lib/auth/firebase-admin.ts — Firebase Admin SDK initialization using 
   FIREBASE_SERVICE_ACCOUNT env variable
4. /lib/auth/session.ts — Helpers to get and verify the session JWT, extract role and 
   department from custom claims
5. middleware.ts — Route protection based on role:
   /admin/* → admin only
   /reception/* → admin, receptionist
   /department/* → admin, department_staff
   /specialist/* → admin, medical_specialist
   /patient/* → patient only
   Unauthorized → redirect to /403
6. app/403/page.tsx — A clean, friendly "Access Denied" page with a back button
7. /types/index.ts — TypeScript interfaces for: User, Patient, Document, DepartmentRecord,
   PatientQueue, SystemLog, ChatbotLog, RagDocument (matching the MySQL schema exactly)
8. /lib/constants.ts — Enums and constants for: roles, departments, document statuses, 
   event types for system_logs, lab test reference ranges as a typed array
9. env.d.ts — TypeScript declarations for all environment variables:
   MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD,
   POSTGRES_URL, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
   OPENROUTER_API_KEY, NEXTAUTH_SECRET, FREE_TIER_TOKEN_LIMIT

Use TypeScript throughout. Add JSDoc comments. Professional error handling on all DB connections.
```

---
---

## PHASE 2 — Authentication & RBAC System

### Objectives Answered
- **SO-D (Primary)** — The entire RBAC framework lives here. This phase is the direct, demonstrable proof of SO-D.
- **GO** — Secure access to all three system pillars requires auth.

### What This Phase Proves
SO-D says: "grant the clinic administrator full system oversight, strictly enforce data privacy, and securely restrict departmental access." This phase is where you prove all three of those clauses. When your panelist tests your system, they will try to log in as a lab technician and access the X-ray department — your middleware must block it. They'll try to access the admin panel as a receptionist — blocked. They'll check if MFA is enforced for high-privilege logins — it must fire.

**Evidence you need to collect for SO-D during evaluation:**
- A screen recording or screenshot showing that a department_staff user cannot see another department's records
- A screenshot of MFA being triggered on admin login
- A screenshot of the 403 page when an unauthorized role tries to access a protected route

### Step-by-Step

**Step 2.1 — Firebase Auth Setup**
- Enable Email/Password sign-in in Firebase Console
- Enable TOTP Multi-factor Authentication
- Set custom claims on users: `{ role: 'admin', department: null }` via Firebase Admin SDK

**Step 2.2 — Login Flow**
Email + Password → if credentials valid → check if MFA enabled → if yes, show TOTP field → verify TOTP → create signed session JWT with `{ userId, role, department }` → redirect by role

**Step 2.3 — Role Redirects After Login**
- `admin` → `/admin/dashboard`
- `receptionist` → `/reception/queue`
- `department_staff` → `/department/records`
- `medical_specialist` → `/specialist/dashboard`
- `patient` → `/patient/dashboard`

**Step 2.4 — Sidebar Component**
Single `<Sidebar />` component, renders different nav links per role. This is the persistent navigation for the entire portal.

---

### Antigravity Prompt — Phase 2

```
I'm building the authentication and RBAC system for KlinikAid — a multi-role clinic 
management web portal (Next.js 14, App Router, TypeScript, Firebase Auth, Tailwind, shadcn/ui).

This phase directly fulfills Specific Objective D of our study:
"To implement a secure, Role-Based Access Control (RBAC) framework that grants the 
clinic administrator full system oversight, strictly enforces data privacy, and securely 
restricts departmental access."

The system has 5 roles: admin, receptionist, department_staff, medical_specialist, patient.
Roles and department assignments are stored as Firebase custom claims.
Staff accounts are ONLY created by the admin — they do not self-register.
Patients self-register.

Please build:

1. app/(auth)/login/page.tsx — Professional login page:
   - Email + password fields
   - Conditional TOTP input that appears only after valid credentials if MFA is enabled
   - Loading state during auth
   - Clear error messages for: wrong credentials, invalid MFA code, inactive account
   - After successful login, redirect based on role:
     admin → /admin/dashboard
     receptionist → /reception/queue
     department_staff → /department/records
     medical_specialist → /specialist/dashboard
     patient → /patient/dashboard

2. app/api/auth/login/route.ts — POST endpoint:
   - Verify Firebase credentials
   - Check if MFA is required; if yes, validate TOTP code
   - Check is_active = TRUE in MySQL users table
   - Return signed JWT containing { userId, role, department, fullName }
   - Log LOGIN_SUCCESS or LOGIN_FAILED to system_logs table with IP address

3. middleware.ts — Route protection:
   Parse JWT from cookie/header
   /admin/* → role must be 'admin'
   /reception/* → role must be 'admin' or 'receptionist'
   /department/* → role must be 'admin' or 'department_staff'
   /specialist/* → role must be 'admin' or 'medical_specialist'
   /patient/* → role must be 'patient'
   On failure: redirect to /403
   Also log UNAUTHORIZED_ACCESS_ATTEMPT to system_logs

4. components/Sidebar.tsx — Responsive sidebar using shadcn/ui:
   Admin nav items: Dashboard, Staff Management, Reception Queue, Dept Records, RAG Manager, System Logs
   Receptionist nav items: Reception Queue, Document Approval, Triage
   Department Staff nav items: My Department Records, Record Entry, Documents Queue
   Medical Specialist nav items: My Patients, Analytics Dashboard
   Patient nav items: Dashboard, AI Assistant, Submit Document, Track Submission, My Results, Forms
   
   Show the logged-in user's name and role badge at the bottom of the sidebar.
   Active route should be highlighted.

5. app/403/page.tsx — Access denied page with:
   The user's current role displayed
   The route they tried to access
   A "Go to My Dashboard" button that redirects to their correct home route
   A "Log Out" button

6. app/api/auth/logout/route.ts — Clears the session cookie and logs LOGOUT event.

Make the login page feel polished and clinical: clean whites, deep teal primary color (#0D7C66),
the clinic name "Bloodcare Medical Laboratory" as a subtitle under the KlinikAid logo placeholder.
Use shadcn/ui Input, Button, Card. No decorative images — keep it serious and professional.
```

---
---

## PHASE 3 — Admin Dashboard & Staff Management

### Objectives Answered
- **SO-D (Primary)** — Admin's ability to create, edit, and deactivate staff accounts is the enforcement mechanism for RBAC. No account = no access.
- **SO-B (Contributing)** — The admin can oversee the reception queue and department workloads from the dashboard.
- **GO** — The admin dashboard is the control center for all three pillars.

### What This Phase Proves
SO-D requires "full system oversight" for the administrator. The dashboard's live metrics (today's patients, pending reviews, queue status) demonstrate that oversight. The staff management CRUD demonstrates the administrator's power to control who has access to what. During evaluation, show the admin creating a new department_staff account — then log in as that staff member to prove it works.

**Evidence to collect for SO-D:**
- Screenshot of admin creating a new staff account and assigning a department
- Screenshot of admin deactivating a staff account — then show that deactivated staff can no longer log in
- Screenshot of the admin dashboard with live metrics

### Step-by-Step

**Step 3.1 — Dashboard Overview Page**
Queries: today's patient count, pending document reviews, active staff count, today's chatbot queries, department breakdown chart, recent system log entries.

**Step 3.2 — Staff Management CRUD**
- Create: Admin fills form → Firebase Auth user created → custom claims set → MySQL users row inserted
- Edit: Update role/department → Firebase custom claims updated → MySQL updated
- Deactivate: `is_active = FALSE` + Firebase refresh tokens revoked (never hard-delete)

---

### Antigravity Prompt — Phase 3

```
I'm building the Admin section of KlinikAid (Next.js 14, TypeScript, MySQL 8.0, 
Firebase Auth Admin SDK, Recharts, Tailwind, shadcn/ui).

This phase primarily fulfills Specific Objective D: the administrator's "full system 
oversight" and control over who has access to the system.

Please build:

1. app/admin/dashboard/page.tsx — Admin overview dashboard:
   - 4 stat cards (use shadcn/ui Card): "Today's Patients", "Pending Document Reviews", 
     "Active Staff Members", "Chatbot Queries Today"
   - A Recharts BarChart showing today's patient count per department 
     (Laboratory, X-ray, Ultrasound, ECG) — data from patient_queue
   - A "Recent System Events" table: last 10 system_logs entries
     Columns: Timestamp (PH time, UTC+8), User, Event Type (colored badge), Description
   - Data fetched server-side using Next.js Server Components
   - Loading skeletons (loading.tsx) for each section

2. app/admin/staff/page.tsx — Staff Management:
   - Searchable, sortable data table (shadcn/ui DataTable) of all users 
     where role != 'patient'
   - Columns: Full Name, Email, Role (badge), Department (badge or dash if N/A), 
     Status (Active/Inactive toggle), Actions (Edit button, Deactivate button)
   - "Add Staff" button → shadcn/ui Sheet (side panel) with:
     Fields: Full Name, Email, Temporary Password, Role (Select dropdown),
     Department (conditional Select — only shown if role is 'department_staff')
     On submit: POST to /api/admin/staff
   - Edit opens same Sheet pre-populated with current values
   - Deactivate shows a confirmation Dialog before proceeding
   - Deactivated staff rows are visually dimmed with a red "Inactive" badge

3. app/api/admin/staff/route.ts — GET (list all staff) and POST (create):
   POST steps:
   a. Create Firebase Auth user with email + temporary password
   b. Set Firebase custom claims: { role, department }
   c. INSERT into MySQL users table
   d. Log STAFF_CREATED event to system_logs
   e. Return the new user record

4. app/api/admin/staff/[id]/route.ts — PUT (update) and PATCH (toggle active):
   PUT: Update Firebase custom claims → update MySQL record → log STAFF_UPDATED
   PATCH (deactivate): Set is_active = FALSE → revoke Firebase refresh tokens 
   → log STAFF_DEACTIVATED

5. app/api/admin/dashboard-stats/route.ts — Returns:
   { todayPatients, pendingDocs, activeStaff, todayChatbotQueries, 
     recentLogs: SystemLog[], departmentBreakdown: {dept, count}[] }
   All from MySQL with parameterized queries.

Use shadcn/ui Card, Badge, Table, Sheet, Dialog, Select, Switch throughout.
Department badges: Laboratory=blue, X-ray=purple, Ultrasound=teal, ECG=orange.
Role badges: admin=red, receptionist=green, department_staff=blue, medical_specialist=purple.
```

---
---

## PHASE 4 — Reception Module

### Objectives Answered
- **SO-B (Primary)** — This is the most direct answer to SO-B. The centralized reception queue, automated document validation pipeline, and triage routing are exactly what SO-B describes.
- **SO-D (Contributing)** — Only receptionists and admins can access this. Department routing enforces data partitioning.
- **GO** — Document management pillar.

### What This Phase Proves
SO-B says: "automating document validation and streamlining patient queue management to significantly reduce manual data-entry workloads." The Kanban queue and triage routing are your proof. During evaluation, demonstrate a patient submitting a document on mobile (your teammate's work), then show the document appearing in the web reception queue with the OCR confidence report, then approve and route it. The full end-to-end workflow of SO-B is demonstrated in this sequence.

**Evidence to collect for SO-B:**
- A walkthrough showing the Kanban queue with documents in different stages
- A screenshot of the OCR confidence report (fields, percentages, flagged items)
- A screenshot of successful triage routing with an assigned queue number
- Time measurement: how long the digital process takes vs. the old manual process (for your evaluation)

### Step-by-Step

**Step 4.1 — Centralized Reception Queue (Kanban)**
Five columns: `Submitted`, `AI Verified`, `Staff Review`, `Approved`, `Rejected`. Each card: patient name, doc type, OCR confidence score (color-coded), time submitted, Review button. Auto-refreshes every 30 seconds.

**Step 4.2 — Document Approval Screen**
Left: doc metadata. Center: OCR extracted text with flagged fields in red. Right: per-field confidence scores as progress bars. Bottom: Approve/Return buttons + notes field.

**Step 4.3 — Triage Routing**
After approval: modal to select department → auto-generate queue number → insert into `patient_queue`.

---

### Antigravity Prompt — Phase 4

```
I'm building the Reception Module for KlinikAid (Next.js 14, TypeScript, MySQL 8.0, 
Tailwind, shadcn/ui).

This phase is the primary answer to Specific Objective B: "developing a centralized web 
portal tailored for core operational staff, automating document validation and streamlining 
patient queue management to significantly reduce manual data-entry workloads."

Documents are submitted by patients on mobile (with OCR pre-screening done by Google ML Kit). 
The web portal receives the OCR results and displays them in a queue for staff action.
For web-submitted documents (no OCR), they skip the AI Verified stage and go to Staff Review.

Please build:

1. app/reception/queue/page.tsx — Kanban reception queue with 5 columns:
   "Submitted" | "AI Verified" | "Staff Review" | "Approved" | "Rejected"
   
   Each card shows: Patient Name, Document Type, OCR Confidence Score 
   (color coded: green ≥85%, yellow 70–84%, red <70%, "N/A - Web Upload" for no-OCR docs),
   Time Submitted (relative: "3 minutes ago"), a "Review" button.
   
   Cards in "Staff Review" column have a highlighted border to indicate action needed.
   Column headers show badge counts.
   Auto-refresh every 30 seconds using React Query's refetchInterval.
   Show a subtle "Last updated: X seconds ago" indicator.

2. app/reception/queue/[documentId]/page.tsx — Document Approval Screen:
   Layout: 3-panel view
   
   LEFT PANEL — Document Info:
   Patient Name, DOB, Patient Code, Document Type, Submitted At, Current Status badge,
   Submission Method (Mobile/Web)
   
   CENTER PANEL — OCR Extracted Text:
   Display ocr_extracted_text in a styled monospace block.
   Fields listed in ocr_flags (from the JSON column) are highlighted in red 
   with a ⚠ warning icon.
   If submission_method is Web (no OCR), show: "Direct web upload — manual review required"
   
   RIGHT PANEL — ML Kit Confidence Report:
   For each field detected by OCR: field name + a Progress bar showing confidence %.
   Progress bar color: green ≥85%, yellow 70–84%, red <70%.
   Fields in ocr_flags shown with a red badge "Flagged".
   If no OCR data: show a notice "No AI pre-screening — web submission"
   
   BOTTOM ACTION BAR:
   "Approve" button (green, confirms and opens triage modal)
   "Return to Patient" button (red, requires review_notes of at least 20 characters)
   "Staff Notes" textarea (required for rejection, optional for approval)

3. components/TriageModal.tsx — Patient department routing modal (Dialog):
   Patient Name (read-only), 
   Department selector (Laboratory, X-ray, Ultrasound, ECG),
   Queue Number (auto-generated: e.g., LAB-042 — incremented per department per day),
   Optional vitals: Blood Pressure, Weight (kg), Temperature (°C),
   Confirm button → POST to /api/reception/triage
   On success: redirect back to queue with a success toast

4. app/api/reception/documents/route.ts — GET: 
   Returns all documents grouped by status, joined with patient info.
   Accepts ?status= filter.

5. app/api/reception/documents/[id]/approve/route.ts — POST:
   Set status='approved', reviewed_by, reviewed_at, review_notes.
   Log DOCUMENT_APPROVED to system_logs. Return updated doc.

6. app/api/reception/documents/[id]/reject/route.ts — POST:
   Set status='rejected', store rejection reason in review_notes.
   Log DOCUMENT_REJECTED to system_logs.

7. app/api/reception/triage/route.ts — POST:
   Insert into patient_queue with: patient_id, queue_number, 
   assigned_department, assigned_by (from JWT), notes.
   Update patient_queue status to 'routed'. Log TRIAGE_COMPLETED.

Make Kanban columns visually distinct with subtle background shades.
Approved column = light green bg, Rejected = light red bg, Staff Review = light amber bg.
The Document Approval screen should feel precise and medical — no playful colors, just clarity.
```

---
---

## PHASE 5 — Department Staff Module

### Objectives Answered
- **SO-B (Primary)** — Reduces manual data-entry for medical technologists (the second staff group named in SO-B).
- **SO-C (Contributing)** — Every record entered here becomes the raw data that feeds the Specialist Analytics Dashboard.
- **SO-D (Contributing)** — Cross-department access is hard-blocked at both API and UI level.
- **GO** — Document management pillar.

### What This Phase Proves
SO-B names two groups: "receptionists and medical technologists." Phase 4 covers receptionists. Phase 5 covers medical technologists. The record entry form with auto-flagging eliminates the need for staff to manually check reference ranges — the system does it. During evaluation, show a lab technician entering a value outside the normal range and the system automatically flagging it.

**Evidence to collect for SO-B:**
- Screenshot of the record entry form with an out-of-range value highlighted in real time
- Screenshot showing that a lab staff member cannot see X-ray records (tab is locked)

**Evidence to collect for SO-C:**
- Records entered here must appear correctly in the Specialist Analytics charts (Phase 6). Run this end-to-end during your evaluation.

### Step-by-Step

**Step 5.1 — Department Records Dashboard**
Today's routed patients for this department + searchable historical records table. Department locked to session JWT — not URL parameter.

**Step 5.2 — Record Entry Form**
Dynamic fields by department. Numeric fields auto-flag outside reference range on blur. Saves to `department_records` with `is_flagged` computed server-side.

---

### Antigravity Prompt — Phase 5

```
I'm building the Department Staff Module for KlinikAid (Next.js 14, TypeScript, MySQL 8.0, 
Tailwind, shadcn/ui).

This phase fulfills two objectives:
- Specific Objective B: reducing manual data-entry workloads for medical technologists
- Specific Objective C: the data entered here directly feeds the Specialist Analytics Dashboard

CRITICAL SECURITY REQUIREMENT (Specific Objective D): The department a staff member can 
access is determined ONLY from their verified session JWT. It must NEVER be taken from URL 
params, query strings, or request body. Any mismatch between JWT department and requested 
data must return 403.

Please build:

1. app/department/records/page.tsx — Department Records Dashboard:
   Department name shown prominently in header: e.g., "Laboratory Department"
   
   Section 1 "Today's Queue": patients routed to this department today
   Table: Patient Name, Patient Code, Queue Number, Time Routed, "Enter Results" button
   
   Section 2 "All Records": searchable historical records for this department only
   Table: Patient Name, Test Name, Value + Unit, Reference Range, Date, 
   Flagged badge (red ⚠ if is_flagged = TRUE), Recorded By
   
   Search by patient name or patient code.
   Show a total record count.

2. app/department/records/entry/[patientId]/page.tsx — Record Entry Form:
   Patient info header (read-only): Full Name, DOB, Patient Code, Queue Number
   Result Date (date picker, defaults to today)
   
   Dynamic form fields based on department from JWT:

   LABORATORY department:
   Fields (each with label, input, unit display, and min/max reference range):
   - Hemoglobin: unit g/dL, range 12.0–17.5
   - WBC: unit 10³/µL, range 4.5–11.0
   - RBC: unit 10⁶/µL, range 4.2–5.9
   - Platelets: unit 10³/µL, range 150–400
   - Blood Glucose (Fasting): unit mg/dL, range 70–100
   - Total Cholesterol: unit mg/dL, range 0–200
   - HDL Cholesterol: unit mg/dL, range 40–999
   - LDL Cholesterol: unit mg/dL, range 0–100

   ECG department:
   - Heart Rate: unit bpm, range 60–100
   - PR Interval: unit ms, range 120–200
   - QRS Duration: unit ms, range 60–120
   - Findings: textarea (no range check)

   XRAY and ULTRASOUND departments:
   - Findings: textarea
   - Impression: textarea
   (no numeric range checks for these departments)

   For ALL numeric fields: onBlur validation —
   If value is outside reference range: red border + red helper text: 
   "⚠ Outside Normal Range — Normal: [min]–[max] [unit]" + warning icon
   The warning must appear immediately without a page reload.
   
   Notes textarea (optional, applies to whole record)
   Submit button → POST to /api/department/records
   After save: success toast + redirect to records list

3. app/api/department/records/route.ts — GET and POST:
   GET: Returns records filtered by department from JWT only. Never trust request params.
   POST: 
   a. Extract department from JWT
   b. For each numeric test value: compute is_flagged = (value < min || value > max)
   c. INSERT into department_records (one row per test field)
   d. Log RECORD_ENTERED to system_logs
   e. Return inserted record IDs

4. app/api/department/queue/route.ts — GET:
   Returns today's patients from patient_queue WHERE assigned_department = JWT.department
   Joins with patients table for patient info.
   Department from JWT only, never from query params.

5. A reusable RangeInput component:
   Props: label, unit, min, max, value, onChange
   Shows reference range hint text below the input: "Normal: min–max unit"
   Validates on blur and shows the red warning if out of range
   The warning includes the actual entered value: "Your value: X [unit] — Above/Below normal"

The form should feel fast and clinical. Large, clear input fields. Tab key should move 
between fields in logical order. Auto-focus on the first field when the form loads.
```

---
---

## PHASE 6 — Medical Specialist Module

### Objectives Answered
- **SO-C (Primary)** — This entire phase exists to answer SO-C. The analytics dashboard IS SO-C.
- **SO-D (Contributing)** — Specialists are read-only. The RBAC hard-lock proving SO-D applies here too.
- **GO** — Information dissemination pillar (giving specialists the information they need).

### What This Phase Proves
SO-C has three parts you must demonstrate: (1) visualizes longitudinal patient diagnostic data, (2) against standardized medical baselines, (3) without employing AI-driven diagnostics. Your chart must physically show data points plotted over time against reference range bands. A code comment and a UI disclaimer must make it explicit that no LLM is involved — data comes directly from MySQL, bypassing OpenRouter entirely.

**Evidence to collect for SO-C:**
- A screenshot of the analytics chart showing a patient's results over multiple dates with the normal range band visible
- A screenshot showing the "No AI Diagnostic Inference Applied" disclaimer on the page
- A code snippet (for your paper's appendix) showing that the analytics API route queries MySQL directly and does NOT call OpenRouter

**Evidence to collect for SO-D:**
- Attempt to access `/specialist/patients` as a department_staff user — screenshot the 403

---

### Antigravity Prompt — Phase 6

```
I'm building the Medical Specialist Module for KlinikAid (Next.js 14, TypeScript, MySQL 8.0, 
Recharts, Tailwind, shadcn/ui).

This phase is the COMPLETE answer to Specific Objective C:
"To create a secure Descriptive Analytics Dashboard that visualizes longitudinal patient 
diagnostic data against standardized medical baselines, aiding visiting medical specialists 
in clinical assessments WITHOUT employing AI-driven diagnostics."

CRITICAL DESIGN RULE: The analytics data pipeline must NEVER touch the OpenRouter API or 
any LLM. Data flows: MySQL department_records → API route → Recharts chart. 
This must be enforced in code with an explicit comment: 
"// IMPORTANT: This route queries MySQL directly. No LLM is involved. See SO-C."

ACCESS RULE (Specific Objective D): Only medical_specialist and admin roles can access 
this module. Patient role is HARD BLOCKED — they must never see this data.

Please build:

1. app/specialist/dashboard/page.tsx — Specialist overview:
   Stat cards: "Assigned Patients", "Flagged Results This Week", "Departments Covered"
   
   "Flagged Results" section: table of the 10 most recent is_flagged=TRUE records
   across all patients the specialist can access.
   Columns: Patient Name, Test Name, Value, Unit, Normal Range, Result Date, 
   Status badge (red "⚠ Flagged")
   
   "Recent Patients" quick list: the 5 most recently updated patients, link to their analytics.

2. app/specialist/patients/page.tsx — Patient Search:
   Search bar: searches patients.full_name and patients.patient_code
   Filter: Department (multi-select), Result Date Range (date range picker)
   
   Results table: Patient Name, Patient Code, Last Test Date, 
   Total Records, Flagged Count (red badge if > 0)
   Each row links to /specialist/patients/[patientId]/analytics

3. app/specialist/patients/[patientId]/analytics/page.tsx — The Analytics Dashboard:
   
   Page header: Patient Full Name | DOB | Patient Code | "Read-Only Access"
   
   METRIC SELECTOR: A Select dropdown listing all distinct test_names recorded 
   for this patient. When a metric is selected, the chart updates.
   
   THE CHART (Recharts ComposedChart, large: full width, min-height 400px):
   X-axis: result_date values, format "MMM DD, YYYY", angle -30° if many dates
   Y-axis: test_value, with unit shown in axis label
   
   Series 1: Line connecting patient data points, color teal (#0D7C66), strokeWidth 2
   Each data point: a Circle dot. Red fill (#DC2626) if is_flagged=TRUE, 
   teal fill if normal.
   
   Reference Band (normal range):
   ReferenceArea from y1=reference_range_min to y2=reference_range_max
   fill="#16a34a" fillOpacity=0.08 (very subtle green)
   Label: "Normal Range" in small green text
   
   ReferenceLine at reference_range_max: stroke="#DC2626" strokeDasharray="4 4" 
   label={{ value: "Upper Limit", position: "insideTopRight", fill: "#DC2626" }}
   ReferenceLine at reference_range_min: same style, label "Lower Limit"
   
   Tooltip: Date, Value with unit, Status ("Normal" or "⚠ Flagged"), Normal Range
   
   DISCLAIMER below chart (visible, not footnote-sized):
   "📊 Descriptive data only — No AI diagnostic inference applied. 
    Data sourced directly from laboratory records. 
    Clinical interpretation is the sole responsibility of the licensed medical professional."
   
   RECORDS TABLE below disclaimer:
   All records for the selected metric, sorted newest first.
   Columns: Result Date, Value, Unit, Reference Range, Status badge, Recorded By, Notes

4. app/api/specialist/patients/route.ts — GET: Patient search with filters.
   Role check: must be medical_specialist or admin.

5. app/api/specialist/patients/[patientId]/metrics/route.ts — GET:
   Returns distinct test_names for this patient from department_records.
   // IMPORTANT: This route queries MySQL directly. No LLM is involved. See SO-C.

6. app/api/specialist/patients/[patientId]/analytics/route.ts — GET (?metric=):
   // IMPORTANT: This route queries MySQL directly. No LLM is involved. See SO-C.
   Returns all records for this patient + metric, ordered by result_date ASC.
   Includes: result_date, test_value, unit, reference_range_min, reference_range_max, is_flagged.

Make the analytics page feel like a serious clinical tool. White chart background. 
The flagged data points in red must be immediately obvious. The normal range band must 
be visible but subtle. No decorative elements. Clean, precise, trustworthy.
```

---
---

## PHASE 7 — Admin: RAG Knowledge Base Management

### Objectives Answered
- **SO-A (Primary)** — The chatbot's intelligence comes from this RAG system. Without properly indexed clinic policies, the chatbot hallucates — SO-A fails. This phase is what makes SO-A answerable on the web side.
- **GO** — Information dissemination and inquiry handling pillars.

### What This Phase Proves
SO-A requires an "AI-driven chatbot for 24/7 routine clinic inquiries." The RAG system is what makes the chatbot's responses trustworthy and clinic-specific rather than generic. During evaluation, demonstrate: upload a clinic price list → ask the chatbot a pricing question → show it answers correctly from the uploaded document. Then delete that document and ask again — the chatbot should say "Please contact the clinic directly."

**Evidence to collect for SO-A:**
- Screenshot of a policy document being uploaded and indexed
- Screenshot of the chatbot answering a clinic-specific question (e.g., pricing, hours) correctly
- Screenshot showing the chunk count and what was indexed (the RagChunkViewer)

---

### Antigravity Prompt — Phase 7

```
I'm building the RAG Knowledge Base Management module for KlinikAid 
(Next.js 14, TypeScript, PostgreSQL + pgvector, OpenRouter API, Tailwind, shadcn/ui).

This phase is the web team's primary contribution to Specific Objective A:
"An AI-driven chatbot for 24/7 routine clinic inquiries."
The chatbot is only as accurate as the documents indexed here. This module lets the 
admin upload clinic policies, price lists, operating hours, and procedures — which are 
then chunked, embedded, and stored in pgvector to ground the chatbot's responses.

Please build:

1. app/admin/rag/page.tsx — RAG Knowledge Base Management UI:
   Table of indexed documents: Title, File Type badge (.pdf/.txt), Chunk Count, 
   Upload Date, Status (Active/Inactive toggle), Actions (View Chunks, Delete)
   
   "Upload Document" button → Dialog with:
   - Document Title (text input)
   - File upload (accepts .pdf and .txt only, max 10MB)
   - "Process & Index" button
   - Progress tracker showing 4 stages with checkmarks:
     ① Extracting text ② Splitting into chunks ③ Generating embeddings ④ Saving to database
   - After completion: "✓ Indexed X chunks successfully"
   
   Document list refreshes after successful upload.

2. app/api/admin/rag/upload/route.ts — POST (multipart/form-data):
   Use NextRequest to parse the file.
   
   Step 1 — Extract text:
   If .pdf: use 'pdf-parse' npm package → extracted text string
   If .txt: read as UTF-8 string
   
   Step 2 — Chunk text:
   Split into segments of approximately 400 words with 50-word overlap.
   Each chunk should not cut mid-sentence. Use sentence boundaries.
   
   Step 3 — Embed each chunk:
   Call OpenRouter embeddings endpoint:
   POST https://openrouter.ai/api/v1/embeddings
   Body: { model: "openai/text-embedding-ada-002", input: chunkText }
   Headers: Authorization: Bearer OPENROUTER_API_KEY
   
   Step 4 — Save to PostgreSQL:
   INSERT INTO rag_documents (title, content, embedding, uploaded_by) VALUES (...)
   
   Use a streaming response (ReadableStream) to report progress after each chunk:
   Send JSON lines: { stage: "embedding", current: N, total: M }
   Frontend reads this stream and updates the progress UI.
   
   Log RAG_UPLOAD to system_logs on completion.

3. app/api/admin/rag/documents/route.ts:
   GET: List all documents (grouped by title, with chunk count)
   PATCH (/[id]): Toggle is_active boolean
   DELETE (/[id]): DELETE FROM rag_documents WHERE title = ? (removes all chunks)

4. app/api/chat/route.ts — The main RAG chatbot endpoint (used by both web and mobile):
   POST body: { question: string, sessionId: string }
   
   Step 1: Embed the user's question:
   POST to OpenRouter embeddings API → get question embedding vector
   
   Step 2: Retrieve relevant context from pgvector:
   SELECT content FROM rag_documents 
   WHERE is_active = TRUE
   ORDER BY embedding <=> $questionEmbedding 
   LIMIT 5
   
   Step 3: Build system prompt:
   "You are a helpful assistant for Bloodcare Medical Laboratory in Rodriguez, Rizal.
    Answer ONLY using the provided clinic information below. 
    If the answer is not in the provided information, respond with: 
    'I don't have that information. Please contact the clinic directly at [number].'
    NEVER provide medical diagnoses, treatment recommendations, or prescription advice.
    Keep answers concise and friendly.
    
    Clinic Information:
    [top 5 chunks joined with newlines]"
   
   Step 4: Call OpenRouter LLM:
   POST https://openrouter.ai/api/v1/chat/completions
   Model: "mistralai/mistral-7b-instruct" (free tier)
   Messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }]
   
   Step 5: Save to chatbot_logs (session_id, question, response, tokens_used)
   
   Step 6: Return { response: string, tokensUsed: number }
   
   Rate limiting: max 20 requests per sessionId per 60 minutes.
   If rate limit hit: return 429 with "Too many questions. Please try again in an hour."

5. components/RagChunkViewer.tsx — Dialog showing all chunks for a document:
   Each chunk as a numbered card: "Chunk #N" with the full content text.
   Useful for admin to verify what got indexed and catch any extraction errors.
   Pagination: 10 chunks per page.

Error handling: API rate limits (429 → queue and retry after delay), 
embedding failures (log the chunk index and skip), file type violations.
```

---
---

## PHASE 8 — Admin: System Oversight & Logs

### Objectives Answered
- **SO-D (Primary)** — The system logs are the audit trail that proves SO-D is enforced. Admin oversight is only meaningful if there's a record of everything that happened.
- **SO-E (Contributing)** — Chatbot logs and API cost tracking directly feed into the performance efficiency evaluation criteria of ISO 25010.
- **GO** — All three pillars benefit from the admin being able to see what's happening.

### What This Phase Proves
When your panelist asks "how does your system enforce data privacy?", you show the system logs — every login, every document approval, every unauthorized access attempt is recorded with a timestamp and the responsible user. The API cost tracker proves your system's economic sustainability claim from the paper.

---

### Antigravity Prompt — Phase 8

```
I'm building the System Oversight & Logs module for KlinikAid 
(Next.js 14, TypeScript, MySQL 8.0, Recharts, shadcn/ui, Tailwind).

This module answers two objectives:
- Specific Objective D: admin "full system oversight" — the logs are the evidence
- Specific Objective E (ISO 25010 evaluation): performance data for evaluators

Admin-only. All timestamps displayed in Philippine Standard Time (UTC+8).

Please build:

1. app/admin/logs/page.tsx — System Logs with 3 tabs (shadcn/ui Tabs):

   TAB 1 "System Events":
   Filters: Event Type (multi-select checkbox list), Date Range picker, 
   User (searchable Select of all staff names)
   
   Table columns: Timestamp (PH time), User (name + role badge), 
   Event Type (colored badge — see colors below), Description, IP Address
   
   Event type badge colors:
   LOGIN_SUCCESS → green, LOGIN_FAILED → red, LOGOUT → gray,
   UNAUTHORIZED_ACCESS_ATTEMPT → dark red,
   DOCUMENT_APPROVED → teal, DOCUMENT_REJECTED → orange,
   TRIAGE_COMPLETED → blue, STAFF_CREATED → purple,
   STAFF_DEACTIVATED → red, RECORD_ENTERED → blue,
   RAG_UPLOAD → purple, PAGE_ACCESS → light gray
   
   Paginated: 20 per page, newest first.
   Export to CSV button (downloads current filtered results).

   TAB 2 "Chatbot Audit":
   Summary bar: Total Queries Today | Total Tokens Today | Estimated Cost Today (PHP)
   
   Table: Timestamp, User Question (80 char truncated — click to expand full text in a popover),
   Bot Response preview (truncated — click to expand), Tokens Used, Est. Cost (tokens × rate)
   
   A collapsible "Full Conversation" drawer for each row showing the complete Q&A exchange.

   TAB 3 "API Cost Tracker":
   Recharts AreaChart — daily token usage over the last 30 days
   X-axis: date, Y-axis: tokens used
   A horizontal ReferenceLine at the free tier limit (from FREE_TIER_TOKEN_LIMIT env var)
   with label "Free Tier Limit" — colored red if any bar exceeds it
   
   Below chart: summary table — Week, Total Tokens, Estimated Cost (PHP), Status (Under/Over budget)
   
   Assume OpenRouter rate: 0.0000007 PHP per token for cost estimates (or make configurable).

2. app/api/admin/logs/system/route.ts — GET: 
   Paginated system_logs with filters (eventType, startDate, endDate, userId, page, limit).
   Returns: { logs: SystemLog[], total: number, page: number }

3. app/api/admin/logs/chatbot/route.ts — GET:
   Paginated chatbot_logs.
   Returns: { logs: ChatbotLog[], total, todayStats: { queries, tokens, estimatedCost } }

4. app/api/admin/logs/api-costs/route.ts — GET:
   Returns daily aggregates from chatbot_logs for the last 30 days:
   SELECT DATE(queried_at) as date, SUM(tokens_used) as totalTokens FROM chatbot_logs 
   GROUP BY DATE(queried_at) ORDER BY date ASC

5. A reusable LogEventBadge component that maps event types to colors (as defined above).

The logs UI should feel like a security dashboard: dark-ish header bar, 
clean white table rows, color-coded badges that are scannable at a glance.
```

---
---

## PHASE 9 — Patient-Facing Pages

### Objectives Answered
- **SO-A (Primary, Web contribution)** — The chatbot UI on web, and the web document submission pathway, are the web side's fulfillment of SO-A.
- **GO** — Information dissemination (patient dashboard, clinic info, announcements) and inquiry handling (chatbot) and document management (submit, track, results).

### What This Phase Proves
SO-A's chatbot and document submission are primarily mobile, but the web version must also exist for patients on desktop. During evaluation, demonstrate a patient using the web chatbot to ask about clinic hours — it should respond correctly from the RAG knowledge base. Also show a patient submitting a document on web and tracking its status through the pipeline.

**Evidence to collect for SO-A:**
- Screenshot of the patient chatbot answering a clinic-specific question on the web portal
- Screenshot of the document status tracker showing the 5-stage pipeline
- Screenshot of the Data Privacy Agreement page (RA 10173 compliance — explicitly required in your paper's scope)

---

### Antigravity Prompt — Phase 9

```
I'm building all patient-facing web pages for KlinikAid 
(Next.js 14, TypeScript, MySQL 8.0, Tailwind, shadcn/ui).

This phase fulfills the web team's contribution to Specific Objective A:
"AI-driven chatbot for 24/7 routine clinic inquiries" and 
"secure, remote submission of diagnostic referral documents."

Patients self-register (unlike staff who are created by admin).
After registration, patients MUST accept the Data Privacy Agreement 
(RA 10173 — Philippine Data Privacy Act) before accessing any features.

IMPORTANT: Patients are HARD BLOCKED from the analytics dashboard.
All patient-facing API routes must verify role === 'patient' from JWT
and must only return data belonging to that patient (filtered by patient_id from JWT).

Please build:

1. app/(auth)/register/page.tsx — Patient self-registration:
   Fields: Full Name, Date of Birth (date picker), Contact Number, Email, 
   Password, Confirm Password
   After successful Firebase registration + MySQL insert: redirect to /privacy-agreement
   Inline validation errors. Password strength indicator.

2. app/privacy-agreement/page.tsx — RA 10173 Data Privacy Agreement:
   Scrollable agreement text area (700px height, overflow-y scroll) 
   containing placeholder RA 10173 consent text (I'll replace with actual text)
   
   A "I have read and understood the Data Privacy Policy of Bloodcare Medical Laboratory 
   in accordance with RA 10173" checkbox
   "Accept & Continue" button (disabled until: checkbox checked AND user has scrolled 
   to the bottom of the text — detect via scroll event)
   
   On accept: PATCH /api/patient/accept-privacy → updates accepted_privacy_at in MySQL 
   → redirect to /patient/dashboard

3. app/patient/dashboard/page.tsx — Patient Dashboard:
   Welcome header: "Good [morning/afternoon/evening], [First Name]"
   
   6 large feature cards in a 2×3 or 3×2 grid:
   🤖 "AI Assistant" — "Ask questions about our services, hours, and procedures"
   📄 "Submit Document" — "Upload referral forms and requirements"
   📍 "Track Submission" — "Check the status of your submitted documents"
   🔬 "My Lab Results" — "View your finalized test results"
   📋 "Clinic Forms" — "Download pre-formatted document templates"
   📢 "Announcements" — "Latest news from Bloodcare Medical Laboratory"
   
   Bottom: clinic info card — Address, Operating Hours, Contact Number, Services offered

4. app/patient/chatbot/page.tsx — AI Chatbot Interface:
   Clean chat bubble UI. Two bubble styles: user (right-aligned, teal bg) and 
   bot (left-aligned, white bg with border).
   
   Input bar at bottom with a send button. Enter key sends message.
   Loading indicator: animated "..." bubble while waiting for response.
   
   System notice at top: "This assistant answers questions about Bloodcare Medical 
   Laboratory only. For medical advice, please consult a licensed physician."
   
   First message auto-shown from bot: "Hello! I'm the KlinikAid Assistant. 
   How can I help you today? I can answer questions about our services, 
   operating hours, requirements, and procedures."
   
   Sends to POST /api/chat. Message history in component state only (not persisted).
   On 429 rate limit response: show "You've reached the query limit. 
   Please try again in an hour." in a red system message bubble.

5. app/patient/submit/page.tsx — Document Submission (web direct upload):
   Document Type selector: Medical Certificate, Referral Letter, Lab Request Form, 
   PhilHealth Form, Valid ID, Other
   
   File upload dropzone (accepts .pdf, .jpg, .png, max 5MB)
   Show file preview thumbnail after selection.
   
   Patient info preview (read-only from session): Name, DOB, Contact Number
   
   Notice box (amber): "Web submissions go directly to staff review. 
   For faster processing with AI verification, use the KlinikAid mobile app."
   
   Submit button → POST /api/patient/documents/submit

6. app/patient/status/page.tsx — Document Status Tracking:
   For each submitted document: Document Type, Submission Date, 
   Submission Method (Web/Mobile badge)
   
   A 5-step visual stepper for the pipeline:
   Step 1 "Submitted" — always complete (filled green circle + checkmark)
   Step 2 "AI Verified" — complete if status >= ai_verified, grayed if web submission
   Step 3 "Staff Review" — complete if status >= staff_review
   Step 4 "Approved/Rejected" — green if approved, red if rejected
   Step 5 "Result Available" — shown when lab results are entered for this patient
   
   Active step: pulsing ring animation.
   If rejected: show rejection reason from review_notes in a red alert box.
   If approved: show "Assigned to [Department] — Queue #[number]"

7. app/patient/results/page.tsx — Lab Results (read-only):
   Results grouped by department (Laboratory, X-ray, Ultrasound, ECG)
   Each group is a collapsible section (open by default if has results).
   
   Table per group: Test Name, Value, Unit, Reference Range, Result Date, 
   Status badge (Normal=green, Flagged=red "⚠ Outside Normal Range")
   
   Top disclaimer (prominent): 
   "These results are for your reference only. Please consult your doctor 
   for interpretation and medical advice."
   
   If no results yet: friendly empty state "Your results will appear here once 
   your laboratory tests are completed and recorded by our staff."

8. app/patient/forms/page.tsx — Clinic Form Templates:
   6 downloadable template cards with: form name, description, format badge (PDF),
   "Download Template" button (links to static PDF files)
   Forms: Medical Certificate Template, Referral Letter Template, 
   Lab Request Form, PhilHealth Form, Consent Form, General Patient Form

9. app/api/patient/documents/submit/route.ts — POST:
   Validate file type and size. Save file to storage. 
   INSERT into documents table: status='submitted' (no OCR for web), 
   patient_id from JWT only. Log DOCUMENT_SUBMITTED to system_logs.

10. app/api/patient/accept-privacy/route.ts — PATCH:
    UPDATE users SET accepted_privacy_at = NOW() WHERE id = JWT.userId

Make the patient interface friendly, accessible, and clean. Large touch targets. 
Simple language. The clinic name and logo visible on every page.
```

---
---

## PHASE 10 — Polish & Integration

### Objectives Answered
- **SO-E (Contributing)** — Loading states, error boundaries, and consistent API responses directly affect the usability and reliability criteria of ISO 25010 evaluation.
- **GO** — A polished, coherent system across all three pillars.

### Antigravity Prompt — Phase 10

```
I'm finalizing KlinikAid's web portal (Next.js 14, TypeScript). 
Cross-cutting concerns for the whole app.

Please build:

1. lib/logger.ts — Server-side logging utility:
   logEvent(db, userId, eventType, description, ipAddress?, metadata?): Promise<void>
   Catches and silently handles its own DB errors — logging failure must never crash 
   the main operation.

2. lib/api-response.ts — Standardized API response helpers:
   successResponse(data, message?) → { success: true, data, message }
   errorResponse(message, statusCode) → Response with { success: false, error: message }
   All API routes must use these helpers for consistency.

3. loading.tsx files for key pages (skeleton UIs):
   /reception/queue/loading.tsx: skeleton Kanban with placeholder cards
   /admin/dashboard/loading.tsx: skeleton stat cards + skeleton table rows
   /specialist/patients/[id]/analytics/loading.tsx: skeleton chart placeholder
   /department/records/loading.tsx: skeleton table rows

4. error.tsx files for each route group:
   Friendly error message (no internal details exposed)
   "Try Again" button (calls reset())
   "Return to Dashboard" link (role-appropriate destination)

5. components/GlobalToaster.tsx — shadcn/ui Sonner toast setup in root layout:
   Success: green, 3 seconds
   Error: red, 5 seconds
   Warning: amber, 4 seconds
   Info: blue, 3 seconds

6. Rate limiting for /api/chat: 
   In-memory Map tracking { sessionId → [timestamps] }
   Max 20 requests in 60 minutes per session.
   Clean up entries older than 60 minutes on each check.

7. types/index.ts — TypeScript interfaces for all domain objects matching MySQL schema exactly.

8. constants.ts — All magic strings as typed enums and constants:
   SystemEventType enum, DocumentStatus enum, Department enum, UserRole enum,
   Lab reference ranges as a typed array.

9. README.md with environment variables table, local setup, deployment notes.
```

---
---

## PHASE 11 (NEW) — ISO 25010 Evaluation Preparation

### Objectives Answered
- **SO-E (Primary and Complete)** — This entire phase exists solely to answer SO-E. Nothing here adds features — it prepares your system to *be evaluated* against ISO 25010 criteria.

### Why This Phase Exists
SO-E is the only objective that is about the *evaluation process itself*, not about building features. Most teams miss this: you don't just build the system and then hope the evaluation goes well. You need to design the evaluation instruments, define what "passing" looks like for each ISO 25010 criterion, and build any system instrumentation needed to measure it.

Your paper specifies ISO 25010 criteria: Functional Suitability, Usability, Reliability, Performance Efficiency, and Security. It also specifies a 4-point Likert scale and Weighted Mean as the statistical treatment. Here's what you need to build and prepare for each criterion.

---

### ISO 25010 Criteria — What You Need to Demonstrate

#### Functional Suitability
*Does the system do what it's supposed to do?*

- The AI chatbot must provide accurate answers to at least 5 pre-written test questions about Bloodcare's services (verify manually against the indexed RAG documents)
- The reception queue must display all submitted documents
- The triage routing must correctly assign patients to departments
- The department record form must correctly flag out-of-range values
- The analytics chart must correctly plot historical data against reference ranges

**What to prepare:** A functional test checklist — 15–20 specific test cases with expected vs. actual results. This is your alpha testing documentation.

#### Usability
*Can your target users (including low-tech-literacy staff) use it without confusion?*

Your paper notes the clinic owner rated staff tech literacy at 2/5. This means your UI decisions during evaluation matter enormously. The system must have: clear labels, intuitive navigation, no jargon, visible error messages.

**What to prepare:** The UAT task script — a list of specific tasks you ask each user type to complete during evaluation (e.g., "Log in as a receptionist and approve the document in the queue"). Observe without helping. Count task completion rates.

#### Reliability
*Does it work consistently without crashing?*

- MFA must fire correctly every time for admin login
- The chatbot must respond even at peak usage (rate limiting should degrade gracefully, not crash)
- The reception queue must refresh correctly

**What to prepare:** Run 10 consecutive logins with MFA. Run 20 chatbot queries in sequence. Verify the queue updates correctly after each document submission.

#### Performance Efficiency
*Does it respond fast enough?*

Your paper specifies: OpenRouter API responses must be under 2 seconds. OCR routing must not cause noticeable lag (handled by mobile team). Database queries should be fast.

**What to prepare:** Time the chatbot response for 10 different questions. Average must be under 2 seconds. Screenshot or screen-record this. Also time: document queue load time, analytics chart render time.

#### Security
*Is patient data protected?*

- RBAC must block wrong roles from accessing wrong pages
- MFA must be enabled for admin
- All API routes must verify the JWT before returning data
- Department data must be restricted to the correct department staff only

**What to prepare:** A set of deliberate failed access attempts — screenshot each 403 response. Show the system log capturing the UNAUTHORIZED_ACCESS_ATTEMPT entries.

---

### Antigravity Prompt — Phase 11

```
I'm preparing the ISO 25010 evaluation infrastructure for KlinikAid 
(Next.js 14, TypeScript, MySQL 8.0).

This phase answers Specific Objective E: evaluating the system's software quality 
using ISO 25010 across functional suitability, usability, reliability, 
performance efficiency, and security.

I need tools and instrumentation to support the evaluation — not new features, 
but things that help measure and demonstrate the existing features.

Please build:

1. app/admin/evaluation/page.tsx — An Evaluation Dashboard (admin-only) for UAT support:
   
   Section "Functional Suitability Tests" — a table of 15 pre-defined test cases:
   Each row: Test ID, Description, Expected Result, "Run Test" button, Status (Untested/Pass/Fail), Notes
   
   Pre-fill the test cases:
   FS-01: "Chatbot answers question about clinic hours" — Expected: "Responds with hours from RAG"
   FS-02: "Chatbot answers question about laboratory prices" — Expected: "Responds with prices from RAG"
   FS-03: "Out-of-scope chatbot question returns refusal" — Expected: "Responds with 'contact clinic directly'"
   FS-04: "Receptionist can see all queued documents" — Expected: "Queue shows all statuses"
   FS-05: "Document approval moves card to Approved column" — Expected: "Status updates in Kanban"
   FS-06: "Triage routing assigns correct department" — Expected: "Patient appears in dept queue"
   FS-07: "Out-of-range lab value is auto-flagged" — Expected: "is_flagged=TRUE, red highlight shown"
   FS-08: "Analytics chart shows data points over time" — Expected: "Line chart renders with dates"
   FS-09: "Analytics chart shows reference range band" — Expected: "Green band visible"
   FS-10: "Flagged data points appear in red on chart" — Expected: "Red dots for flagged values"
   FS-11: "Lab staff cannot see X-ray records" — Expected: "403 response"
   FS-12: "Patient cannot access analytics dashboard" — Expected: "403 response"
   FS-13: "Admin can create a new staff account" — Expected: "Account appears in staff list"
   FS-14: "Deactivated staff cannot log in" — Expected: "Login rejected with 'inactive account'"
   FS-15: "RAG document upload indexes chunks in pgvector" — Expected: "Chunk count > 0"
   
   Admins can manually set each row to Pass or Fail and add notes. 
   Save state to localStorage. Show a summary: X/15 Passed.

2. app/admin/evaluation/performance/page.tsx — Performance measurement tool:
   A "Run Performance Tests" button that:
   - Sends 5 test chatbot queries sequentially
   - Records response time for each (in milliseconds)
   - Displays results in a table: Query, Response Time (ms), Status (Pass <2000ms / Fail)
   - Average response time shown in a large stat
   - A "Export Results" button that downloads the results as a CSV
   
   Queries to test (hardcoded):
   "What are your operating hours?"
   "How much does a CBC test cost?"
   "What services do you offer?"
   "Where is Bloodcare Medical Laboratory located?"
   "What documents do I need to submit?"

3. A printable ISO 25010 Evaluation Scorecard component (for your UAT sessions):
   Can be triggered from the ev