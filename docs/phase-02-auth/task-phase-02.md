# Phase 2 — Authentication & Multi-Role Setup Checklist

- [x] Server Actions
    - [x] Create login action with status verification and MFA support
    - [x] Create logout action and cookie revocation
- [x] Portal UI
    - [x] Build `/login` interface (forms, validations, MFA code states)
- [x] Navigation Layouts
    - [x] Build root dashboard layout and sidebar component
    - [x] Build role-based dashboard links
- [x] Page Stubs
    - [x] Build page stubs for five core roles: Admin, Receptionist, Department Staff, Specialist, Patient
- [x] Bugfixes
    - [x] Resolve static build warnings by wrapping `useSearchParams()` in `<Suspense>`
    - [x] Resolve `email` query loop on `profiles` layout
- [x] Verification
    - [x] Run `npm run build` compilation check
