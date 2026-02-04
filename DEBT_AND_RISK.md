# RTHA — Technical Debt & Project Risk Audit

**Project:** RTHA (Real-Time Health App) — Expo/React Native Mobile  
**Audit Date:** February 2026  
**SDK Version:** Expo 54.0.0  

---

## Executive Summary

This audit identifies technical debt and project risks in the RTHA mobile application. The project was recently migrated from a web (Vite/React) stack to Expo/React Native, but significant remnants of the old architecture remain. The application currently relies entirely on mock data with no backend integration, authentication, or data persistence.

**Overall Risk Level:** **Medium–High** — The app functions for demos but is not production-ready. Critical gaps exist in security, data layer, testing, and documentation.

---

## Table of Contents

1. [Technical Debt](#1-technical-debt)
2. [Project Risks](#2-project-risks)
3. [Recommendations](#3-recommendations)
4. [Prioritized Action Items](#4-prioritized-action-items)

---

## 1. Technical Debt

### 1.1 Dead / Orphaned Code (High)

**~50+ files** from the legacy web stack remain in the repository and are **never imported** by the Expo app.

| Location | Files | Impact |
|----------|-------|--------|
| `src/pages/` | 6 files | Old React Router pages; replaced by `app/(tabs)/*.tsx` |
| `src/components/ui/` | 40+ files | shadcn/ui components (Radix, Tailwind, DOM) — incompatible with React Native |
| `src/components/layout/AppLayout.tsx` | 1 file | Web layout with sidebar; replaced by Expo Router tabs |
| `src/components/NavLink.tsx` | 1 file | React Router `NavLink`; not used in Expo |
| `src/hooks/use-mobile.tsx` | 1 file | Web viewport detection; irrelevant for native |
| `src/hooks/use-toast.ts` | 1 file | Web toast; not used in mobile |
| `src/App.css` | 1 file | Web styles |
| `src/index.css` | 1 file | Tailwind base; not used in RN |
| `src/lib/utils.ts` | 1 file | `cn()` uses `clsx` + `tailwind-merge` (not in package.json); web-only |
| `src/vite-env.d.ts` | 1 file | Vite type declarations; Vite removed |
| `components.json` | 1 file | shadcn config; web-only |
| `tailwind.config.ts` | 1 file | Tailwind config; not used |
| `postcss.config.js` | 1 file | PostCSS config; not used |
| `vitest.config.ts` | 1 file | References `@vitejs/plugin-react-swc`; Vite removed |
| `public/robots.txt` | 1 file | Web SEO; irrelevant for mobile |

**Impact:** Confusion, larger repo, risk of accidental imports, slower tooling.

---

### 1.2 Outdated Documentation (Medium)

**`ARCHITECTURE.md`** describes the old web stack:

- Vite, React Router, Tailwind, shadcn/ui, Framer Motion, Recharts
- `App.tsx`, `main.tsx`, `index.html`
- Desktop sidebar + mobile bottom nav layout

**Reality:** Expo SDK 54, Expo Router, React Native, StyleSheet, react-native-gifted-charts.

**Impact:** New contributors get wrong mental model; onboarding is misleading.

---

### 1.3 Inconsistent Import Paths (Medium)

Two path styles are used:

| Pattern | Example | Used By |
|---------|---------|---------|
| `@/src/...` | `@/src/components/dashboard/QuickStats` | App routes, active components |
| `@/...` | `@/types/health`, `@/data/mockData` | `mockData.ts`, dead `src/pages` |

With `alias: { "@": "." }`, `@/types/health` resolves to `./types/health` (project root). Types live at `src/types/health.ts`, so this can cause resolution issues depending on tooling.

**Recommendation:** Standardize on `@/src/...` for all imports.

---

### 1.4 Duplicate State & No Shared Source of Truth (High)

Same mock data is used in multiple places with **local `useState`**:

| Screen | Data | State Location |
|--------|------|----------------|
| Dashboard → TodayMedications | `mockMedications` | `TodayMedications` |
| Medications screen | `mockMedications` | `MedicationsScreen` |
| Dashboard → UpcomingAppointments | `mockAppointments` | Component (read-only) |
| Appointments screen | `mockAppointments` | `AppointmentsScreen` |

Toggling “taken” in TodayMedications does **not** update the Medications screen. Each screen keeps its own copy.

**Impact:** Inconsistent UX, no single source of truth, harder to add persistence or API later.

---

### 1.5 No Error Handling (High)

- No React Error Boundaries
- No `try/catch` around async logic
- No fallback UI for failed loads
- No global error reporting

**Impact:** Crashes surface as blank screens; no way to recover or report errors.

---

### 1.6 Testing Infrastructure Broken (High)

- **`vitest.config.ts`** imports `@vitejs/plugin-react-swc` and `path` — Vite is removed
- **`src/test/setup.ts`** and **`example.test.ts`** are web-oriented
- No React Native testing setup (Jest, React Native Testing Library, etc.)
- No tests for business logic or components

**Impact:** No regression safety; refactors are risky.

---

### 1.7 ESLint Configuration Mismatch (Low)

- `globals.browser` — not appropriate for React Native
- `react-refresh` — web HMR only
- No React Native–specific rules (e.g. `react-native/no-unused-styles`)

**Impact:** Linting does not match the actual platform.

---

### 1.8 Styling Duplication (Medium)

- Colors defined in `src/theme/colors.ts`
- Many components repeat similar `StyleSheet` patterns (cards, headers, buttons)
- No shared design tokens or layout primitives

**Impact:** Inconsistent UI, more work to change design system.

---

### 1.9 Placeholder / Non-Functional Features (High)

| Feature | Current State |
|---------|---------------|
| Add Medication | Button does nothing |
| New Appointment | Button does nothing |
| Log Reading (Health) | Button does nothing |
| Edit Profile | Button does nothing |
| Add Emergency Contact | Button does nothing |
| Edit/Delete on list items | Buttons do nothing |
| Emergency Button | Only `console.log`; no real emergency flow |

**Impact:** Users expect these to work; current behavior is misleading.

---

## 2. Project Risks

### 2.1 Security Risks (Critical)

| Risk | Severity | Description |
|------|----------|-------------|
| No authentication | Critical | No login; anyone can access all screens |
| No authorization | Critical | No user scoping; all data effectively public |
| Sensitive data in memory | High | Medications, health metrics, contacts only in memory |
| No secure storage | High | No encrypted storage for tokens or PHI |
| Emergency flow not implemented | High | No real emergency calls, location sharing, or notifications |
| `console.log` in production | Low | Emergency flow logs contacts to console |

**Compliance:** HIPAA and similar regulations require auth, encryption, and audit trails for health data. Current design does not meet these.

---

### 2.2 Data & Persistence Risks (High)

| Risk | Severity | Description |
|------|----------|-------------|
| No backend | High | All data is mock; nothing is saved |
| No offline support | High | No local DB; app loses everything on close |
| No data validation | Medium | No Zod/Joi; invalid data can propagate |
| Hardcoded user | Medium | “John” is hardcoded; no multi-user support |
| No sync strategy | High | No plan for server sync when backend exists |

---

### 2.3 Dependency Risks (Medium)

| Risk | Severity | Description |
|------|----------|-------------|
| `lucide-react-native` | Medium | Peer dep on React 16–18; app uses React 19; `--legacy-peer-deps` used |
| `react-native-gifted-charts` | Low | Third-party charts; may lag behind RN/Expo |
| `--legacy-peer-deps` | Medium | Masks peer dependency issues; future upgrades may break |
| No lockfile for Expo | Low | `bun.lockb` removed; only `package-lock.json` |

---

### 2.4 Architecture Risks (Medium)

| Risk | Severity | Description |
|------|----------|-------------|
| No API abstraction | High | No services/hooks layer; backend integration will be invasive |
| No state management | Medium | Only local state; no global store or context for shared data |
| Tight coupling to mock data | High | Components import `mockData` directly |
| No feature flags | Low | No way to toggle features without deploys |

---

### 2.5 Accessibility Risks (Medium)

- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` found
- No screen reader testing
- Color contrast not validated
- Touch targets not audited for minimum size

**Impact:** May not meet WCAG or app store accessibility expectations.

---

### 2.6 Operational Risks (Medium)

| Risk | Severity | Description |
|------|----------|-------------|
| No crash reporting | High | No Sentry/Bugsnag; production crashes are invisible |
| No analytics | Medium | No usage or funnel data |
| No CI/CD | Medium | No automated tests or deployment pipeline |
| No environment config | Medium | No dev/staging/prod separation |

---

## 3. Recommendations

### Immediate (P0)

1. **Remove dead code** — Delete `src/pages`, `src/components/ui`, `src/components/layout`, `src/components/NavLink`, `src/hooks` (web), `src/App.css`, `src/index.css`, `src/lib/utils.ts`, `src/vite-env.d.ts`, `components.json`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `public/robots.txt`.
2. **Introduce Error Boundaries** — Wrap app and key screens to catch and display errors.
3. **Standardize imports** — Use `@/src/...` everywhere and fix `mockData` imports.
4. **Update ARCHITECTURE.md** — Reflect Expo, Expo Router, and current structure.

### Short-Term (P1)

5. **Introduce shared state** — Context or Zustand for medications, appointments, health metrics.
6. **Add React Native testing** — Jest + React Native Testing Library; migrate or remove Vitest.
7. **Fix ESLint** — Use `eslint-config-expo` and React Native rules.
8. **Remove `console.log`** — Replace with proper logging or remove from emergency flow.

### Medium-Term (P2)

9. **API layer** — Create services/hooks for data access; swap mock data behind an interface.
10. **Authentication** — Add auth (e.g. Expo AuthSession) before any real backend.
11. **Secure storage** — Use `expo-secure-store` for tokens and sensitive data.
12. **Accessibility** — Add labels, roles, hints; run accessibility audits.

### Long-Term (P3)

13. **Backend integration** — REST or GraphQL API with proper auth and validation.
14. **Offline support** — Local DB (e.g. WatermelonDB, expo-sqlite) and sync.
15. **Crash reporting** — Integrate Sentry or similar.
16. **CI/CD** — Automated tests and deployment pipeline.

---

## 4. Prioritized Action Items

| # | Action | Effort | Impact | Priority |
|---|--------|--------|--------|----------|
| 1 | Delete dead/orphaned code | 1–2 hrs | High | P0 |
| 2 | Add Error Boundaries | 2–4 hrs | High | P0 |
| 3 | Standardize import paths | 1 hr | Medium | P0 |
| 4 | Update ARCHITECTURE.md | 1–2 hrs | Medium | P0 |
| 5 | Introduce shared state (Context/Zustand) | 4–8 hrs | High | P1 |
| 6 | Set up React Native testing | 4–8 hrs | High | P1 |
| 7 | Fix ESLint for React Native | 1–2 hrs | Low | P1 |
| 8 | Remove console.log from EmergencyButton | 0.5 hr | Low | P1 |
| 9 | Create API/service abstraction layer | 8–16 hrs | High | P2 |
| 10 | Add authentication | 16–40 hrs | Critical | P2 |
| 11 | Add accessibility attributes | 4–8 hrs | Medium | P2 |
| 12 | Implement secure storage for tokens | 4–8 hrs | High | P2 |

---

## Appendix: File Inventory

### Active (Used by Expo App)

```
app/
  _layout.tsx
  (tabs)/
    _layout.tsx, index.tsx, medications.tsx, appointments.tsx, health.tsx, settings.tsx
src/
  components/dashboard/     (QuickStats, TodayMedications, UpcomingAppointments, HealthOverview)
  components/emergency/    (EmergencyButton)
  data/mockData.ts
  theme/colors.ts
  types/health.ts
```

### Dead (Not Imported by Expo)

```
src/
  pages/                   (6 files)
  components/ui/           (40+ files)
  components/layout/       (AppLayout.tsx)
  components/NavLink.tsx
  hooks/                   (use-mobile.tsx, use-toast.ts)
  lib/utils.ts
  App.css, index.css
  vite-env.d.ts
  test/                    (example.test.ts, setup.ts)
components.json
tailwind.config.ts
postcss.config.js
vitest.config.ts
```

---

*This audit reflects the codebase state as of February 2026. Re-audit after major changes.*
