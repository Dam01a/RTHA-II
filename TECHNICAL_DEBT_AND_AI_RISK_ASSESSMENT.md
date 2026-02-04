# RTHA — Technical Debt Audit & AI System Risk Assessment

**Project:** RTHA (Real-Time Health App) — Expo/React Native Mobile  
**Assessment Date:** February 2026  
**Context:** Lovable.dev-generated codebase, migrated to Expo mobile  

---

# Part 1: Technical Debt Audit

## Item 1: Monolithic Data Layer with No API Boundaries

**Category:** Architectural Debt

**Description:** The application has no abstraction between UI and data. Components import `mockData.ts` directly and manage state locally with `useState`. There is no service layer, repository pattern, or API boundary. Data flows from static mock arrays into components with no validation, caching, or error handling. The same mock data is duplicated across multiple screens (e.g., `TodayMedications` and `MedicationsScreen` each hold their own copy of medications), leading to inconsistent state when a user toggles "taken" in one place but not another.

**Remediation Plan:** Introduce a data abstraction layer: (1) Create a `services/` or `api/` directory with modules (e.g., `medicationService`, `appointmentService`) that expose async functions returning typed data; (2) Implement a simple in-memory store or Zustand/Context for shared state that can later be swapped for a real backend; (3) Replace direct `mockData` imports with service calls; (4) Add Zod or similar validation at the boundary before data reaches components.

---

## Item 2: Hardcoded User & Authentication Logic

**Category:** Architectural Debt

**Description:** The prototype uses a hardcoded user session for demo purposes. The name "John" appears in the Dashboard greeting; the profile in Settings shows "John Doe" and "john.doe@email.com" with no way to change them. There is no authentication flow, no session management, and no concept of a logged-in user. All screens assume a single, anonymous user with full access to all data.

**Remediation Plan:** Refactor into a modular auth service: (1) Integrate Supabase Auth, Firebase Auth, or Expo AuthSession (e.g., for OAuth); (2) Create an `AuthContext` or `useAuth` hook that provides `user`, `signIn`, `signOut`, and loading state; (3) Protect routes or screens based on auth state; (4) Replace hardcoded "John" with `user?.displayName` or `user?.email`; (5) Store tokens securely via `expo-secure-store`.

---

## Item 3: Broken and Absent Test Coverage

**Category:** Test Debt

**Description:** The codebase lacks unit or integration tests for business logic and UI components. The existing `vitest.config.ts` references `@vitejs/plugin-react-swc` and Vite, which were removed during the Expo migration—tests cannot run. There is no "trust but verify" protocol for AI-generated components: no snapshot tests, no component tests, and no tests for critical flows (e.g., emergency countdown, medication toggle, refill status calculation). Regressions can go undetected.

**Remediation Plan:** (1) Remove or replace Vitest with Jest + React Native Testing Library (Expo's recommended stack); (2) Add `jest-expo` preset and configure for React Native; (3) Write unit tests for pure logic (e.g., `getRefillStatus`, `getGreeting`, date formatting); (4) Add component tests for critical UI (EmergencyButton, TodayMedications, medication toggle); (5) Establish a CI step that runs tests on every PR; (6) Document a "trust but verify" checklist for AI-generated code (e.g., manual review + at least one automated test per new feature).

---

## Item 4: Orphaned Legacy Code and Inconsistent Structure

**Category:** Architectural Debt

**Description:** Approximately 50+ files from the original Lovable.dev web stack remain in the repository but are never imported by the Expo app. These include `src/pages/` (6 React Router pages), `src/components/ui/` (40+ shadcn/Radix components), `src/components/layout/AppLayout.tsx`, `src/hooks/use-mobile.tsx`, `src/hooks/use-toast.ts`, Tailwind/PostCSS configs, and `vitest.config.ts`. The codebase is effectively a hybrid of two architectures (web + mobile) with no clear boundary, increasing cognitive load and risk of accidental imports.

**Remediation Plan:** (1) Delete all dead code: `src/pages`, `src/components/ui`, `src/components/layout`, `src/components/NavLink`, web-only hooks, `src/App.css`, `src/index.css`, `src/lib/utils.ts`, `components.json`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`; (2) Standardize import paths to `@/src/...` across the codebase; (3) Add a brief "Active vs. Legacy" section to ARCHITECTURE.md to prevent future confusion.

---

## Item 5: Outdated and Misleading Documentation

**Category:** Documentation Debt

**Description:** The AI-generated `ARCHITECTURE.md` describes a web stack (Vite, React Router, Tailwind, shadcn/ui, Framer Motion, Recharts) that no longer exists. It references `App.tsx`, `main.tsx`, `index.html`, and a desktop sidebar layout. The actual application uses Expo SDK 54, Expo Router, React Native, and StyleSheet. There is no traceability back to original Agile requirements or user stories. New contributors receive an incorrect mental model of the system.

**Remediation Plan:** (1) Rewrite `ARCHITECTURE.md` to reflect the current Expo/React Native architecture, including app directory structure, tab routing, and data flow; (2) Add a "Requirements Traceability" section mapping features (e.g., "Medication Management") to user stories or tickets if they exist; (3) Update README tech stack (currently says SDK 52; project uses SDK 54); (4) Document the migration history (web → mobile) so future maintainers understand why some patterns differ from typical Lovable output.

---

## Item 6: No Error Boundaries or Defensive Handling

**Category:** Architectural Debt

**Description:** The application has no React Error Boundaries. A single unhandled exception in any component can crash the entire app and render a blank screen. There is no `try/catch` around async logic, no fallback UI for failed data loads, and no global error reporting. Users have no way to recover without force-quitting the app.

**Remediation Plan:** (1) Add a root-level Error Boundary in `app/_layout.tsx` that catches errors and displays a "Something went wrong" screen with a "Retry" button; (2) Add screen-level Error Boundaries for critical flows (e.g., Health chart, Emergency modal); (3) Wrap async operations (future API calls) in `try/catch` and surface errors via toast or inline message; (4) Integrate crash reporting (e.g., Sentry) for production to capture stack traces.

---

# Part 2: AI & System Risk Assessment

## Risk 1: Reliability / Hallucination — AI-Generated Code Without Verification

**Category:** Reliability/Hallucination

**Description:** AI agents (e.g., Lovable Planner/Coder) may generate code that appears correct but contains subtle bugs: incorrect date parsing, off-by-one errors in refill percentage logic, or misuse of React Native APIs (e.g., `StyleSheet` vs. inline styles). Without automated tests or systematic review, hallucinated logic can ship to production. Example: the `getTrend` function in Health.tsx parses `metrics[0].value.split("/")[0]`—if the value format changes or is missing, this could throw. AI may also "hallucinate" dependencies (e.g., `clsx`, `tailwind-merge` in `lib/utils.ts`) that are not in `package.json`, causing runtime failures if that code path is ever executed.

**Mitigation:** (1) Implement a "trust but verify" protocol: every AI-generated component or function must have at least one automated test; (2) Add defensive checks (null/undefined guards, type narrowing) at data boundaries; (3) Run `npm run lint` and `npm run test` in CI before merge; (4) Use TypeScript strict mode and fix all `any` types to reduce inference errors.

---

## Risk 2: Security & Ethics — Sensitive Health Data Without Protection

**Category:** Security & Ethics

**Description:** The application handles sensitive health data (medications, appointments, vitals, emergency contacts) but has no authentication, no encryption at rest, and no access control. Data exists only in memory during a session, but once a backend is added, prompt injection or data leakage risks emerge: if an AI agent is given access to user prompts or logs, PHI could be exposed. There is also a risk of bias: AI-generated UI or copy might not account for accessibility (e.g., no `accessibilityLabel` on interactive elements), disadvantaging users with disabilities. The Emergency Button simulates contacting emergency contacts but does not actually call or share location—users may believe help is coming when it is not, an ethical and liability concern.

**Mitigation:** (1) Implement authentication and authorization before any real PHI is stored; (2) Use `expo-secure-store` for tokens; (3) Never log or send PHI to external AI APIs; (4) Add accessibility attributes (`accessibilityLabel`, `accessibilityRole`, `accessibilityHint`) to all interactive elements; (5) Add clear disclaimers that the Emergency Button is a prototype and does not trigger real emergency services until fully implemented.

---

## Risk 3: Dependency Risk — Lovable Interfaces and External AI APIs

**Category:** Dependency Risk

**Description:** The project originated from Lovable.dev, which may change its output format, recommended stack, or cloud integration. The README and ARCHITECTURE.md still reference "Lovable Cloud" and Lovable documentation. If Lovable deprecates certain patterns or migrates to a different framework, the codebase could become orphaned. Additionally, the app uses `--legacy-peer-deps` for `lucide-react-native` (incompatible with React 19), and relies on `react-native-gifted-charts`—third-party libraries that may lag behind Expo/React Native upgrades. A future Expo SDK or React Native version bump could break these dependencies with no clear migration path.

**Mitigation:** (1) Decouple the codebase from Lovable-specific assumptions: remove or update Lovable references in docs; (2) Document all external dependencies and their compatibility constraints in a `DEPENDENCIES.md`; (3) Pin critical dependency versions in `package.json` (avoid `^` for core packages) and test upgrades in a branch before merging; (4) Evaluate alternatives to `lucide-react-native` (e.g., `@expo/vector-icons`) if React 19 compatibility becomes an issue; (5) Subscribe to release notes for Expo, React Native, and key libraries to anticipate breaking changes.

---

# Summary

| Part | Item Count | Priority |
|------|------------|----------|
| Technical Debt | 6 items | P0–P2 |
| AI & System Risks | 3 items | Critical |

**Recommended Next Steps:** Address architectural debt (data layer, auth, dead code) first, then establish test coverage and documentation. Mitigate AI risks by adding verification protocols and security controls before introducing real user data.
