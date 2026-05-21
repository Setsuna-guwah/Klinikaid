# KlinikAid — Phase Documentation

This directory contains per-phase development documentation. These files are **untracked by git** — they exist as portable context for developers and AI assistants.

## Purpose

Each phase `.md` file captures:
- **What was built** — files created, components, routes
- **Tables & RLS policies** — database schema changes with security policies
- **Stack decisions** — MASTER_CONTEXT overrides applied to V2 guide
- **Objective mapping** — which SO objectives this phase answers
- **Assumptions** — anything inferred or decided during implementation
- **Known issues / TODOs** — deferred items for later phases

## File Naming

```
phase-01-setup.md
phase-02-auth.md
phase-03-admin.md
phase-04-reception.md
phase-05-department.md
phase-06-specialist.md
phase-07-rag.md
phase-08-logs.md
phase-09-patient.md
phase-10-polish.md
phase-11-iso25010.md
```

## How To Use

**For another AI picking up development:**
1. Read `MASTER_CONTEXT.md` (stack constitution)
2. Read `KlinikAid_Web_Implementation_Guide_v2.md` (feature blueprint)
3. Read the latest `phase-XX-*.md` to understand current state
4. MASTER_CONTEXT overrides V2 tech choices. V2 owns feature logic + objectives.

**For the developer:**
- Review any phase doc to understand what was built and why
- Check assumptions section before modifying a phase's code
- Cross-reference objective mapping for defense/evaluation prep
