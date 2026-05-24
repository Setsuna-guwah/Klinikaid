# KlinikAid Web Portal
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20Gemini-blue)](./README.md)
[![License](https://img.shields.io/badge/License-Academic-green)](./README.md)

KlinikAid is a multi-role internal clinic management web portal built for **Bloodcare Medical Laboratory** (located in Burgos, Rodriguez, Rizal). The system consolidates patient workflows, front-desk triage routing, private diagnostic record entry, descriptive longitudinal analytics, and a RAG-grounded AI chatbot assistant into a unified administrative panel. It facilitates seamless operations for five distinct roles: Administrators, Receptionists, Department Staff, Medical Specialists, and Patients.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Running the Production Build](#running-the-production-build)
6. [Developer Guides](#developer-guides)

---

## Tech Stack

| Layer | Tool / Technology | Purpose / Notes |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React server components, routing, and APIs |
| **Language** | TypeScript | Strong typing and compiler safety |
| **Styling** | Tailwind CSS v3 | Rapid responsive styling and theme configuration |
| **Component Primitives** | `@base-ui/react` | Accessible, unstyled primitives for UI design (Shadcn-style) |
| **Database** | Supabase (PostgreSQL) | Dynamic storage, schemas, and relational integrity |
| **Vector Search** | Supabase pgvector | 768-dimensional vector matching for chatbot context |
| **Authentication** | Supabase Auth | Account signup, sessions, and TOTP Multi-Factor Auth (MFA) |
| **File Storage** | Supabase Storage | Encrypted private storage for user diagnostic uploads |
| **AI LLM** | Gemini 2.5 Flash | Conversational chatbot responses and non-blocking document OCR |
| **Embeddings** | Gemini `gemini-embedding-001` | Generates 768-dimensional vectors for query matching |
| **State Management** | React Context & Hooks | Built-in React state only (no Zustand or React Query) |
| **Charts** | Recharts (Raw) | Descriptive charts (not Shadcn wrappers) for longitudinal views |
| **Dates** | `date-fns` & `date-fns-tz` | Consistent Asia/Manila (UTC+8) timezone rendering |

---

## Prerequisites

Before setting up the project, make sure your machine has the following tools installed:
- **Node.js**: `v18.x` or `v20.x` (LTS versions recommended)
- **npm**: `v10.x` or higher
- **Supabase Account / Local CLI** (optional, for hosting or migration application)

---

## Quick Start

Follow these steps to run a local instance of the KlinikAid portal:

### 1. Clone the Repository
```bash
git clone https://github.com/Setsuna-guwah/KlinikAid.git
cd KlinikAid
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the template configuration file to a local environment file:
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in the required API keys and Supabase endpoints. Refer to the [Environment Variables](#-environment-variables-reference) table below for guidance.

### 4. Apply Database Migrations
Run the migration scripts located in `src/lib/db/` in order (`migration_07.sql` to `migration_10.sql`) on your Supabase Database using the **Supabase SQL Editor** UI:
1. `migration_07.sql`: Similarity search function for RAG chatbot.
2. `migration_08.sql`: Token logs indexing and token tracking functions.
3. `migration_09.sql`: Private storage bucket creation and Storage RLS policies.
4. `migration_10.sql`: Data Privacy Act (RA 10173) consent column setup.

### 5. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## Environment Variables Reference

The portal relies on the following configurations in `.env.local`. Do **never** commit actual secret values to version control.

| Environment Variable Name | Type | Description | Example / Placeholder |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Your Supabase project URL | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Anonymous public access key | `eyJhbGciOiJIUzI1NiIsIn...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin secret key (Bypasses RLS) | `eyJhbGciOiJIUzI1NiIsIn...` |
| `GEMINI_API_KEY` | Server | Google Gemini API integration key | `AIzaSyD-your-api-key` |
| `RESEND_API_KEY` | Server | (Optional) Transactional email key | `re_your_resend_api_key` |
| `NEXT_PUBLIC_CLINIC_NAME` | Client | Display name of the lab | `Bloodcare Medical Laboratory` |
| `NEXT_PUBLIC_CLINIC_ADDRESS` | Client | Display address of the lab | `"Burgos, Rodriguez, Rizal"` |
| `FREE_TIER_TOKEN_LIMIT` | Server | Limit for free token calculations | `10000000` |
| `CHAT_RATE_LIMIT_PER_HOUR` | Server | Chatbot limits per hour per user | `20` |

---

## Running the Production Build

To build and run the application in a production-ready container or deployment node, execute:

```bash
# Build the Next.js optimized production bundle
npm run build

# Start the node server
npm run start
```

---

## Developer Guides

To understand specific modules and standards of the KlinikAid project, review the following documents:

* **[System Architecture Guide](./ARCHITECTURE.md)**: Explore layouts, auth flow, role-gates, component separations, and RAG execution pipeline.
* **[Database & Schema Reference](./DATABASE.md)**: Read table structures, constraints, RLS policies, migrations, and database RPC functions.
* **[RBAC & Routing Protocol](./ROLES_AND_ROUTES.md)**: See how routes are allocated, landing pages are defined, and system logs are mapped.
* **[Coding Standards & Conventions](./CONVENTIONS.md)**: Review developers' contribution rules, standing guidelines, and known project constraints.
