# EHI Multisystems - AI Developer Guidelines & Verification Protocol

This file serves as a persistent guide injected directly into the agent's context. It establishes the mandatory post-implementation debugging, validation, and quality-checking protocol for all future changes.

---

## 1. Post-Change Debugging & Verification Protocol

For **every** feature request, bug fix, or visual modification, you **MUST** run the following verification pipeline before declaring the task complete:

### Step 1: TypeScript Integrity checks (Linting)
- Run `lint_applet` to identify any unused imports, wrong types, missing dependencies, or syntax issues.
- Fix all linter errors immediately. Never submit code with active compiler or linter errors.

### Step 2: Application Compilation Proofing
- Run `compile_applet` to verify a successful production build.
- This ensures full compatibility with the deployment pipeline and catches deep-level TypeScript compilation errors that standard IDE linting might miss.

### Step 3: Server & Module Check
- Verify that custom assets, helper modules, or relative imports (e.g., `../../lib/...`) exist and are valid.
- Run `restart_dev_server` if scripts, config files, or Express endpoints were modified to ensure the container runtime adopts the fresh config.

---

## 2. Core Architectural Guardrails

### A. Strict Type Safety & Imports
- **Named Imports Only:** Avoid generic or manual object destructuring for critical React components. Explicitly import hooks and state triggers.
- **Pre-Existing Hooks:** Real-time components must leverage stable props, primitive values in dependency arrays, or memoized local triggers to prevent infinite rendering loops.
- **Dependency Ingestion:** Always double-check `package.json` to leverage precompiled helper libraries (`lucide-react`, `motion/react`, `recharts`, `dexie`, etc.) rather than importing raw modules.

### B. Mobile Screen & Responsive Boundary Integrity
- **Safe-Area Layout Protection:** Lower viewport elements like the mobile BottomNav must be pinned to the absolute bottom utilizing standard padding values:
  `padding-bottom: calc(62px + env(safe-area-inset-bottom)) !important;`
- **Main View Scroll Safety:** Set main tags to prevent layout clipping and overlap:
  `main { flex: 1; overflow-y: auto; padding-bottom: 0 !important; }`
- **Viewport Constraints:** Ensure that elements render consistently across tablet, desktop, and mobile viewports.

### C. Persistent Offline-First Architecture
- **Dual-State Synchronization:** This application is built as an offline-first resilient system. Ensure retail and corporate transactions are safely cached inside Dexie (local state query wrappers) first, then verified and pushed down to the primary DB when network connectivity shifts safely.
- **Graceful Fallbacks:** If API connections are delayed or unavailable, show appropriate offline badges or warning indicators, matching the prepackaged EHI visual style.

---

## 3. High-Velocity Aesthetic Guidelines

- **Theme Cohesion:** Maintain the dark luxurious **Obsidian Minimalist** theme (deep grays, slate backgrounds, sleek amber accents, gold buttons, and clear green/red status metrics).
- **No Under-Designed UI Elements:** Forms, badges, and lists should use precise padding, subtle rounded elements (`var(--radius-sm)`), responsive focus rings, and clear typographic division.
- **Clean Transitions:** Apply standard exit and entry micro-animations using `motion/react` where appropriate to guide the user's attention.
