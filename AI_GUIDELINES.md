# AI Guidelines & Development Principles

## 1. Project Overview & Scope
- **Project**: UNC Online MBA Centralized Resource & Calendar Hub
- **Purpose**: Unify course resources, announcements, readings, assignments, and calendar schedules across two Canvas LMS instances (`digitalcampus.instructure.com` and `kenan-flagler.instructure.com`) into an executive-grade, weekly dashboard.
- **Target Audience**: UNC Kenan-Flagler Online MBA students on desktop, tablet, and mobile devices.

---

## 2. Core Architectural & Code Principles

### 2.1. Mobile-First & Responsive Design
- Design from the smallest viewport upwards (mobile phone screen first, scaling gracefully to tablet and desktop).
- Touch targets must be at least 44x44 CSS pixels.
- Bottom navigation or thumb-accessible controls on mobile viewports.
- No horizontal scrolling on mobile viewports; responsive typography using fluid or rem scaling.

### 2.2. Accessibility (WCAG 2.1 AA Compliance)
- Maintain minimum 4.5:1 contrast ratio for normal text and 3:1 for large text / graphical UI elements.
- Kenan-Flagler color palette:
  - Carolina Blue: `#4B9CD3` (used with high-contrast text or dark background)
  - Navy: `#13294B` (excellent contrast for headers, text, and primary surfaces)
- All interactive elements must have visible focus indicators (`focus-visible:ring-2`) and keyboard navigability.
- Provide descriptive `aria-label`s on icon-only buttons (e.g., sync, download, settings).

### 2.3. Don't Repeat Yourself (DRY) & Modular Architecture
- Centralize Canvas API calls in a typed client module (`src/lib/canvas/client.ts`).
- Abstract weekly normalization and regex heuristics into pure, unit-testable utility functions (`src/lib/canvas/heuristics.ts`).
- Reusable UI component library with clear prop boundaries.

### 2.4. Zero-Server Secret Storage & FERPA Privacy
- Student Canvas access tokens must never be logged, persisted in server databases, or exposed across sessions.
- Tokens reside strictly in the user's browser `localStorage`.
- Serverless API routes act strictly as stateless CORS proxies forwarding headers directly to Instructure.

### 2.5. Git Hygiene & Atomic Commits
- Commit messages must follow conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- Commits must be atomic, focused on single logical changes.
- Never commit `.env.local`, credentials, or temporary debug files.
