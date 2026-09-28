# The Static Design System (SDS) — Complete Specification & Starter Kit

A tactile, technical, and modernist design system designed for high information density, crisp visual hierarchy, and WCAG 2.1 AA accessibility.

---

## 📑 Table of Contents
1. [Core Design DNA & Principles](#1-core-design-dna--principles)
2. [Copy-Paste Starter Kit (`tailwind.config.js` & `index.css`)](#2-copy-paste-starter-kit)
3. [Typography Hierarchy & Precise Sizing Rules](#3-typography-hierarchy--precise-sizing-rules)
4. [Color Tokens & Atmospheric Depth](#4-color-tokens--atmospheric-depth)
5. [Component Recipes (Exact JSX Snippets)](#5-component-recipes)
   - [5.1 Page Header & Hero](#51-page-header--hero)
   - [5.2 Flat "De-Boxified" Card](#52-flat-de-boxified-card)
   - [5.3 Anchored Filter & Control Toolbar](#53-anchored-filter--control-toolbar)
   - [5.4 Form Inputs & Group Row](#54-form-inputs--group-row)
   - [5.5 Buttons & Action Triggers](#55-buttons--action-triggers)
   - [5.6 Badges vs Micro Data Tags](#56-badges-vs-micro-data-tags)
   - [5.7 Interactive Modal / Dialog](#57-interactive-modal--dialog)
6. [Strict Anti-Patterns (DOs and DON'Ts)](#6-strict-anti-patterns-dos-and-donts)
7. [🤖 AI Prompting Template for New Projects](#7-ai-prompting-template-for-new-projects)

---

## 1. Core Design DNA & Principles

### What makes this aesthetic unique?
1. **Tactile Geometric Typography**: The combination of **Space Grotesk** (geometric, bold, personality-filled grotesque) with **JetBrains Mono** (technical tabular numbers and micro-data tags).
2. **Warm Solarized Light & Pure Obsidian Dark**: 
   - Light mode is **NOT** cold sterile white; it uses a warm Solarized cream base (`#FDF6E3`) with bright off-white cards (`#FCFBF8`) and terracotta coral (`#D44E18`).
   - Dark mode uses pure Obsidian (`#101010`) with graphite cards (`#1A1A1A`), crisp 1px borders (`#333333`), and luminous peach-coral accents (`#EF6453`).
3. **"De-Boxified" Flat Containers**: 
   - Avoid "card inside a card inside a card" syndrome.
   - Only primary sections get an outer bordered card. Internal elements use subtle background tinting (`bg-muted/20`), clean dividers, or open flex rows.
4. **Crisp 1px Borders Over Heavy Drop Shadows**: 
   - Never use heavy blurred shadows (`shadow-lg`, `shadow-2xl`). 
   - Elevation is achieved through 1px border contrast (`border-border/70`), subtle background step-ups (`bg-card`), and delicate micro-shadows (`shadow-xs` / `shadow-sm`).
5. **Anchored Control Decks**: 
   - Dropdowns, search inputs, and segmented tabs are grouped together inside cohesive toolbars rather than floating loosely.

---

## 2. Copy-Paste Starter Kit

To guarantee 100% accurate visual rendering in any React + Tailwind project, drop in these two configuration files:

### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
    fontFamily: {
      sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
  },
  plugins: [],
};
```

### `src/index.css` (or `globals.css`)
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, button, input, select, textarea, h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  code, kbd, samp, pre {
    font-family: 'JetBrains Mono', monospace;
  }

  :root {
    /* Light Mode: Warm Solarized Canvas */
    --background: 44 87% 94%;   /* #FDF6E3 - Warm cream canvas */
    --foreground: 24 10% 15%;   /* #241015 - Deep charcoal */
    
    --card: 40 30% 98%;         /* #FCFBF8 - Crisp off-white */
    --card-foreground: 24 10% 15%;
    
    --popover: 40 30% 98%;
    --popover-foreground: 24 10% 15%;
    
    --primary: 15 85% 45%;      /* #D44E18 - Terracotta Coral (WCAG AA 4.5:1+) */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 44 30% 90%;
    --secondary-foreground: 24 10% 25%;
    --muted: 44 20% 92%;
    --muted-foreground: 24 10% 45%;
    --accent: 44 30% 90%;
    --accent-foreground: 24 10% 15%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 44 20% 86%;
    --input: 44 20% 86%;
    --ring: 15 85% 45%;
    --radius: 0.5rem;
  }

  .dark {
    /* Dark Mode: Pure Obsidian & Graphite */
    --background: 0 0% 6.3%;    /* #101010 - Obsidian Canvas */
    --foreground: 40 10% 96%;   /* #F7F7F5 - Crisp Warm White */
    
    --card: 0 0% 10%;           /* #1A1A1A - Graphite Cards */
    --card-foreground: 40 10% 96%;
    
    --popover: 0 0% 10%;
    --popover-foreground: 40 10% 96%;
    
    --primary: 6 78% 62%;       /* #EF6453 - Luminous Coral Red */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 0 0% 14%;
    --secondary-foreground: 40 10% 96%;
    --muted: 0 0% 13%;
    --muted-foreground: 0 0% 64%; /* #A3A3A3 */
    --accent: 0 0% 16%;
    --accent-foreground: 40 10% 96%;
    --destructive: 0 84% 65%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 20%;         /* #333333 - Crisp 1px border */
    --input: 0 0% 25%;          /* #404040 */
    --ring: 6 78% 62%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans;
    letter-spacing: -0.015em;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}

/* Atmospheric Ambient Background Texture */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cg fill='none' stroke='%23D44E18' stroke-width='1'%3E%3Ccircle cx='820' cy='140' r='20' stroke-opacity='0.26'/%3E%3Ccircle cx='820' cy='140' r='68' stroke-opacity='0.22'/%3E%3Ccircle cx='820' cy='140' r='132' stroke-opacity='0.18'/%3E%3Ccircle cx='820' cy='140' r='214' stroke-opacity='0.14'/%3E%3Ccircle cx='820' cy='140' r='320' stroke-opacity='0.11'/%3E%3Ccircle cx='820' cy='140' r='456' stroke-opacity='0.08'/%3E%3Ccircle cx='160' cy='780' r='24' stroke-opacity='0.24'/%3E%3Ccircle cx='160' cy='780' r='86' stroke-opacity='0.18'/%3E%3Ccircle cx='160' cy='780' r='174' stroke-opacity='0.14'/%3E%3Ccircle cx='160' cy='780' r='294' stroke-opacity='0.10'/%3E%3C/g%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

.dark body {
  background-image: radial-gradient(ellipse 70% 40% at 50% -5%, rgba(239, 100, 83, 0.09), transparent 60%);
  background-attachment: fixed;
}

.dark body::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cg fill='none' stroke='%23EF6453' stroke-width='1.5' stroke-opacity='0.14'%3E%3Cpath d='M-200 200 L1200 800'/%3E%3Cpath d='M800 -200 L200 1200'/%3E%3Cpath d='M-100 800 L1100 500'/%3E%3Cpath d='M470 380 L620 530 L380 620 Z' stroke-opacity='0.08'/%3E%3C/g%3E%3Cg fill='%23EF6453' fill-opacity='0.4'%3E%3Cpolygon points='470,370 480,380 470,390 460,380'/%3E%3Cpolygon points='620,520 630,530 620,540 610,530'/%3E%3Cpolygon points='380,610 390,620 380,630 370,620'/%3E%3C/g%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

/* Sleek Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
```

---

## 3. Typography Hierarchy & Precise Sizing Rules

| Tier | Size Class | Weight & Tracking | Font | Correct Usage | ⚠️ Never Use For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Hero/Display)** | `text-2xl sm:text-3xl font-extrabold` | `tracking-tight` | Space Grotesk | Landing Hero, Group/App Main Title | Card headers, form labels |
| **Tier 2 (Card Title)** | `text-lg font-bold` | `tracking-tight` | Space Grotesk | All `CardTitle`, `DialogTitle` | Sub-sections inside cards |
| **Tier 3 (Body & Subtitles)** | `text-sm font-medium` | `normal` | Space Grotesk | `CardDescription`, Form inputs, Select values, Paragraphs | Micro badges |
| **Tier 4 (Controls)** | `text-xs font-semibold` | `tracking-normal` | Space Grotesk | Buttons, Tab triggers, Dropdown items, Filter labels | General body copy |
| **Tier 5 (Micro Data)** | `text-[10px] font-bold` | `font-mono uppercase tracking-wider` | JetBrains Mono | Timezone pills (`PST`), Status chips (`FREE`), Avatars | Form inputs, descriptions |

---

## 4. Geometry & Radius Scale

```
• Cards / Dialog Modals:   rounded-lg (8px)
• Buttons / Inputs / Tabs: rounded-md (6px)
• Badges / Timezone Tags:  rounded-sm (3px)
• Avatars / Round FABs:    rounded-full
```

---

## 5. Component Recipes

Use these exact JSX component patterns to build UI that matches the system flawlessly.

### 5.1 Page Header & Hero
```tsx
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <span className="text-primary font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 uppercase tracking-wider">
        Active Session
      </span>
    </div>
    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
      Friday Night Squad
    </h1>
    <p className="text-sm font-medium text-muted-foreground">
      Weekly recurring schedule across 4 global timezones
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons */}
  </div>
</div>
```

### 5.2 Flat "De-Boxified" Card
```tsx
<div className="border border-border/70 rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
  {/* Card Header */}
  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40 bg-card">
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Squad Members
        </h2>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Select a profile to view or edit their availability
      </p>
    </div>
    {/* Optional right-aligned header action */}
  </div>

  {/* Card Body (Clean, unboxed content) */}
  <div className="p-4 sm:p-5 space-y-4">
    {/* Content goes here with no heavy nested boxes */}
  </div>
</div>
```

### 5.3 Anchored Filter & Control Toolbar
```tsx
<div className="bg-muted/20 border border-border/70 rounded-md p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
  {/* Left: Section Label & Context */}
  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
    <Filter className="w-3.5 h-3.5 text-primary" />
    <span>Filter Matches:</span>
  </div>

  {/* Right: Side-by-Side Controls */}
  <div className="flex flex-wrap items-center gap-2.5">
    {/* Segmented Control Tabs */}
    <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border/50">
      <button className="px-2.5 py-1 rounded-sm text-xs font-bold bg-primary text-primary-foreground shadow-xs">
        All (100%)
      </button>
      <button className="px-2.5 py-1 rounded-sm text-xs font-bold text-muted-foreground hover:text-foreground">
        Most (75%+)
      </button>
    </div>

    {/* Compact Dropdown Trigger */}
    <select className="h-8 px-2.5 bg-card border border-border rounded-md text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none">
      <option>Min: 1 Hour</option>
      <option>Min: 2 Hours</option>
    </select>
  </div>
</div>
```

### 5.4 Form Inputs & Group Row
```tsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
    <span>Display Name</span>
    <span className="text-[10px] font-mono text-muted-foreground uppercase">Required</span>
  </label>
  <input
    type="text"
    placeholder="e.g. Alex"
    className="w-full h-10 px-3 rounded-md bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
  />
</div>
```

### 5.5 Buttons & Action Triggers
```tsx
{/* Primary Action Button */}
<button className="h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <span>Add New Member</span>
</button>

{/* Outline / Secondary Button */}
<button className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5">
  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
  <span>Edit Profile</span>
</button>

{/* Subtle Ghost Button */}
<button className="h-8 px-2.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer flex items-center gap-1">
  <Clock className="w-3.5 h-3.5" />
  <span>Auto-Detect</span>
</button>
```

### 5.6 Badges vs Micro Data Tags
```tsx
{/* 1. Action / Status Badge (Tier 4: text-xs Space Grotesk) */}
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
  <Check className="w-3.5 h-3.5" />
  4 of 4 Free
</span>

{/* 2. Micro Data Tag (Tier 5: text-[10px] JetBrains Mono Uppercase) */}
<span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-muted-foreground">
  PST (UTC-8)
</span>
```

### 5.7 Interactive Modal / Dialog
```tsx
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
  <div className="w-full max-w-md bg-card border border-border/80 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
    <div className="p-5 border-b border-border/40 flex items-center justify-between">
      <h3 className="text-lg font-bold text-foreground tracking-tight">Share Group Invite</h3>
      <button className="text-muted-foreground hover:text-foreground rounded-sm p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="p-5 space-y-4 text-sm font-medium text-foreground">
      {/* Dialog Body */}
    </div>
    <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end gap-2">
      <button className="h-9 px-3 rounded-md border border-border bg-card text-xs font-semibold">Cancel</button>
      <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold">Copy Link</button>
    </div>
  </div>
</div>
```

---

## 6. Strict Anti-Patterns (DOs and DON'Ts)

| ❌ NEVER DO THIS | ✅ ALWAYS DO THIS | Why It Breaks The Aesthetic |
| :--- | :--- | :--- |
| **Nested Card-in-Card**: Putting a bordered `<Card>` inside another `<Card>` | Use `bg-muted/20` subtle background fill or open flex row | Creates heavy "boxy" visual noise and dark border stacking |
| **`text-[10px]` on form labels or copy**: Setting regular text to 10px | Reserve `text-[10px]` ONLY for single-word mono chips (`UTC`, `ACTIVE`) | Makes form labels unreadable and breaks accessibility |
| **Sub-section larger than card title**: Making a sub-heading `text-xl` when the card is `text-lg` | Keep sub-headings at `text-base` or `text-sm font-bold` | Distorts visual reading hierarchy |
| **Heavy blurred drop shadows**: `shadow-xl` or `shadow-2xl` on cards | Use 1px borders `border-border/70` with `shadow-xs` | Makes cards look sluggish and dated instead of crisp and modern |
| **Generic Inter/Roboto fonts**: Omitting Google Fonts import | Always import **Space Grotesk** and **JetBrains Mono** | The geometric grotesque character defines the entire brand |
| **Multiple stacked dividers**: Adding `<Separator />` right above a bordered toolbar | Use spatial gap (`space-y-4`) | Creates clutter and line fatigue |

---

## 7. 🤖 AI Prompting Template for New Projects

When prompting an AI assistant (Claude, ChatGPT, Gemini, Antigravity) to build a new app in this style, copy-paste this prompt block:

```markdown
You must implement the user interface strictly adhering to the "Static Design System (SDS)":

1. Typography:
   - Primary Font: "Space Grotesk" (Headings, buttons, labels)
   - Tabular / Monospace: "JetBrains Mono" (Numbers, statistics, timestamps, timezone tags)
   - Scale:
     * Hero Title: text-2xl sm:text-3xl font-extrabold tracking-tight
     * Card / Modal Title: text-lg font-bold tracking-tight
     * Card Subtitle & Inputs: text-sm font-medium text-muted-foreground / text-sm font-normal
     * Controls & Buttons: text-xs font-semibold or font-bold
     * Micro Data Tags: text-[10px] font-mono font-bold uppercase tracking-wider

2. Geometry & Radius:
   - Outer Cards & Modals: rounded-lg (8px)
   - Buttons, Form Inputs, Toolbars, Tabs: rounded-md (6px)
   - Badges, Status Chips: rounded-sm (3px)

3. Theme & Colors (Tailwind HSL):
   - Light Mode: Warm Solarized Canvas (#FDF6E3), Clean Off-White Cards (#FCFBF8), Terracotta Coral Accent (#D44E18).
   - Dark Mode: Pure Obsidian Canvas (#101010), Graphite Cards (#1A1A1A), Luminous Coral Red Accent (#EF6453), 1px Crisp Border (#333333).

4. De-Boxification & Structure:
   - Do NOT nest bordered cards inside other cards.
   - Use anchored toolbar decks (bg-muted/20 border border-border/70 rounded-md p-3.5) for filters and dropdowns.
   - Use subtle 1px borders and shadow-xs instead of heavy blurred shadows.
   - Sub-sections inside cards must never exceed text-base in font size.
```
