# UNC Kenan-Flagler Online MBA Centralized Resource & Calendar Hub

An executive-grade, mobile-first web application designed for UNC Online MBA students to unify, organize, and centralize course materials, weekly readings, deliverables, and master calendar schedules across multiple Canvas instances.

---

## 🎯 The Problem This Solves

UNC Kenan-Flagler Online MBA students face heavy operational friction navigating their coursework:
1. **Two Separate Canvas Instances**:
   - `digitalcampus.instructure.com` (used for 2U synchronous live sessions & certain core modules)
   - `kenan-flagler.instructure.com` (used for Kenan-Flagler business school core courses & electives)
2. **Fragmented Course Structure**:
   - **Announcements**: Contain crucial weekly briefings, reading lists, and Zoom live session links.
   - **Modules**: Contain lecture slides and pages, but frequently omit assignments and pre-readings.
   - **Homeworks**: Kept in an isolated "Homeworks" / Assignments tab disconnected from the weekly modules.
   - **Pre-Readings & Case Studies**: Buried deep inside the Canvas "Files" tab under nested subfolders (e.g. `Files / Week 1 / Pre-readings`, `Files / Case Studies / Week 2`), completely missing from the module view.

---

## ✨ Features

- 🏛️ **Dual-Instance Canvas Intelligence**: Aggregates courses, announcements, assignments, and calendar feeds from both `digitalcampus` and `kenan-flagler` simultaneously.
- 📅 **Intelligent Weekly Hub**: Normalizes fragmented course data into a coherent **Week 1 through Week 10+** dashboard:
  - **Weekly Overview & Briefing**: Rescues professor notes and Zoom links from announcements.
  - **Pre-Readings & Materials**: Automatically scans the Files tab to unearth buried case PDFs and spreadsheets.
  - **Homework & Deliverables**: Pulls homework into context with due date countdowns, point weights, and submission status badges.
- 🔒 **Zero-Storage Privacy (FERPA Compliant)**:
  - Personal Canvas access tokens are stored strictly in the student's browser `localStorage`.
  - The Next.js server acts as a stateless CORS proxy—**zero tokens or student data are ever saved to a database or server disk**.
- 👥 **Cohort Handoff & Zero-Install Sharing**:
  - Classmates simply open the website URL on their phone, iPad, or computer.
  - Built-in 60-second Setup Wizard guides them to generate and paste their own Canvas tokens.
  - Includes a full **Demo Mode** to test drive the interface immediately with realistic MBA courses (*MBA 701: Financial Accounting*, *MBA 703: Operations Management*, *MBA 710: Leading in Organizations*).
- 📱 **Mobile-First & PWA Accessible**:
  - Engineered from the ground up for phone viewports (≥44px touch targets, sticky week scrubber, WCAG 2.1 AA accessible Carolina Blue & Kenan Navy design system).
  - Add to Home Screen support on iOS Safari and Android Chrome.
- 📆 **Master Calendar & .ics Export**:
  - One-click export to Apple Calendar, Google Calendar, or Microsoft Outlook.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

---

## ☁️ Free Cohort Deployment (Vercel)

You can host this for free on Vercel so your entire cohort can use it from any device:

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of UNC MBA Hub"
   git remote add origin https://github.com/YOUR_USERNAME/unc-mba-hub.git
   git push -u origin main
   ```
2. Go to [Vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository and click **Deploy**.
4. Share the generated `.vercel.app` URL with your classmates!

---

## 🔑 How Classmates Get Their Tokens (60 Seconds)

1. **DigitalCampus Token**:
   - Go to `https://digitalcampus.instructure.com/profile/settings`
   - Scroll to **Approved Integrations** and click **+ New Access Token**.
   - Purpose: `UNC MBA Hub` -> Click **Generate Token**.
2. **Kenan-Flagler Token**:
   - Go to `https://kenan-flagler.instructure.com/profile/settings`
   - Scroll to **Approved Integrations** and click **+ New Access Token**.
   - Purpose: `UNC MBA Hub` -> Click **Generate Token**.
3. In the MBA Hub web app, click **Tokens**, paste both keys, and click **Save & Connect**.

---

## 🧪 Testing

Run heuristic and parsing tests:
```bash
node scripts/test-heuristics.mjs
```

---

## 🎨 Design System & Accessibility

- **Primary Colors**: Kenan Navy (`#13294B`), Carolina Blue (`#4B9CD3`), Slate Canvas (`#F4F7FA`).
- **Typography**: Tabular monospace figures (`tabular-nums`) for due dates, points, and countdown timers.
- **Accessibility**: Built with Radix UI primitives adhering strictly to WCAG 2.1 AA contrast and keyboard navigation guidelines.
