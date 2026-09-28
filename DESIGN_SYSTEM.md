# Static Design System & UI Specification

A modern, technical, and tactile design system built with **Tailwind CSS**, **Space Grotesk**, **JetBrains Mono**, and **Framer Motion**. Designed for high information density, multi-platform clarity, and WCAG 2.1 AA accessibility.

---

## 1. Aesthetic Vision & Philosophy

* **Modern Tactile Minimalism**: High clarity, subtle depth layers, tactile micro-interactions, and zero unnecessary visual clutter.
* **Flattened / "De-Boxified" Hierarchy**: Avoid "box-in-a-box" card fatigue. Outer containers provide structure; inner sections use subtle background fills (`bg-muted/20`), clean dividers, or open flex rows rather than stacked borders and nested shadows.
* **Information Density with Rhythm**: Compact typography with deliberate whitespace, monospaced tabular data for figures/timestamps, and clear hierarchy.

---

## 2. Color Palette & Theme Tokens

The design system supports both **Light** and **Dark** modes with distinct character and $\ge 4.5:1$ WCAG AA contrast.

### 2.1 Light Mode ("Warm Solarized Canvas")
* **Canvas Background**: `hsl(44 87% 94%)` (`#FDF6E3`) — Warm, low eye-strain Solarized cream canvas.
* **Card & Surface**: `hsl(40 30% 98%)` (`#FCFBF8`) — Crisp, bright off-white surface for elevated cards and popovers.
* **Primary Accent**: `hsl(15 85% 45%)` (`#D44E18`) — Warm Terracotta / Coral Orange (meets 4.5:1 text contrast).
* **Text Foreground**: `hsl(24 10% 15%)` — Deep charcoal for readability.
* **Muted Foreground**: `hsl(24 10% 45%)` — Soft graphite for descriptions and secondary text.
* **Borders / Input**: `hsl(44 20% 86%)` — Subtle structural borders.
* **Background Texture**: Subtle concentric acoustic ring watermark vector (`stroke-opacity: 0.03–0.26`).

### 2.2 Dark Mode ("Obsidian & Graphite")
* **Canvas Background**: `hsl(0 0% 6.3%)` (`#101010`) — Pure Obsidian canvas.
* **Card & Surface**: `hsl(0 0% 10%)` (`#1A1A1A`) — Clean Graphite cards.
* **Primary Accent**: `hsl(6 78% 62%)` (`#EF6453`) — Peachy Coral Red (high visual punch against dark background).
* **Text Foreground**: `hsl(40 10% 96%)` (`#F7F7F5`) — Crisp warm off-white.
* **Muted / Subdued**: `hsl(0 0% 13%)` (`#212121`) fill, `hsl(0 0% 64%)` (`#A3A3A3`) text.
* **Borders**: `hsl(0 0% 20%)` (`#333333`) — Crisp graphite borders.
* **Background Texture**: Asymmetrical architectural lines with diamond coordinate nodes + top ambient coral radial bloom (`rgba(239, 100, 83, 0.09)`).

---

## 3. Typography: 5-Tier Typographic Scale

Static combines **Space Grotesk** (geometric, expressive headings & controls) with **JetBrains Mono** (technical precision, tabular timestamps, and status chips).

| Tier | Tailwind Classes | Font Family | Weight & Tracking | Intended Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Display / Hero** | `text-2xl sm:text-3xl` / `text-3xl sm:text-5xl` | Space Grotesk | `font-extrabold tracking-tight` | Landing hero headlines, Group title |
| **Tier 2: Card & Modal Titles** | `text-lg` | Space Grotesk | `font-bold tracking-tight` | All `CardTitle`, `DialogTitle`, and major section headers |
| **Tier 3: Subtitles & Form Controls** | `text-sm` | Space Grotesk | `font-medium text-muted-foreground` | `CardDescription`, text inputs, select triggers, primary body copy |
| **Tier 4: Controls & Action Labels** | `text-xs` | Space Grotesk | `font-semibold` or `font-bold` | Buttons, Tabs, Filter chips, Dropdown menu items |
| **Tier 5: Micro-Data & Tags** | `text-[10px]` | JetBrains Mono | `font-bold uppercase tracking-wider` | Timezone indicators (`PST`, `UTC`), status pills (`FREE`, `BUSY`, `ACTIVE`), avatar single-letter glyphs |

### Typographic Rules:
1. **Never out-scale the parent**: A sub-section header inside a card (e.g., *Top Matching Times*) must use `text-base` or `text-sm`, remaining subordinate to the card title (`text-lg`).
2. **Tabular Numerics**: Always apply `tabular-nums` or `font-mono` to timestamps, hours counts, and statistics to eliminate layout jitter.

---

## 4. Geometry & Radius Scale

```
┌──────────────────────────────────────────────┐
│  Card / Dialog: rounded-lg (8px)             │
│  ┌────────────────────────────────────────┐  │
│  │  Toolbar / Input: rounded-md (6px)     │  │
│  │  ┌──────────────────┐ ┌──────────────┐ │  │
│  │  │ Button / Tabs:   │ │ Badge / Pill:│ │  │
│  │  │ rounded-md (6px) │ │ rounded-sm   │ │  │
│  │  └──────────────────┘ └──────────────┘ │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

* **`rounded-lg` (0.5rem / 8px)**: Major structural containers (Cards, Dialog Modals, Heatmap Grid container).
* **`rounded-md` (0.375rem / 6px)**: Interactive and grouping elements (Buttons, Inputs, Select triggers, Segmented Tabs, Toolbars).
* **`rounded-sm` (0.125rem / 2px–3px)**: Micro badges, Timezone chips, Status tags, Grid header day indicators.
* **`rounded-full`**: Avatars, Floating Action Buttons (FABs), and pill badges.

---

## 5. UI Layout & De-Boxification Guidelines

1. **Outer Card Only**: Only top-level sections receive a bordered `Card` container.
2. **Flatten Inner Sections**:
   - Instead of nesting a bordered card inside `CardContent`, use an open flex row or a subtle background strip (`bg-muted/20 border border-border/70 rounded-md p-3.5`).
3. **Anchored Toolbars**:
   - Group related filter dropdowns, search inputs, and segmented controls into a single cohesive toolbar deck rather than unanchored floating inputs.
4. **Divider Discipline**:
   - Never stack multiple `<Separator />` or border lines on top of each other. Use spatial padding (`gap-4` / `space-y-4`) and background contrast for separation.

---

## 6. Motion & Micro-Interactions (Framer Motion)

* **Collapsible Sections**: Smooth height & opacity accordion transitions (`initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}`).
* **State Cross-Fades**: Use `AnimatePresence mode="wait"` for switching between modes (e.g. Grid Painter vs Range Builder, Saving vs Saved status badges).
* **Button Springs**: Subtle tactile spring on tap/click (`whileTap={{ scale: 0.98 }}`).
* **Transition Constants**: Fast, responsive durations ($120\text{ms} - 200\text{ms}$) with standard ease curves (`[0.25, 1, 0.5, 1]`) to keep the app feeling instantaneous.

---

## 7. Mobile Touch & Navigation Patterns

* **Dual-Mode Touch Engine**:
  - `Paint Mode`: `touch-action: none` on interactive cells with continuous touch-tracking via `document.elementFromPoint()`.
  - `Pan / Scroll Mode`: Full inertia scrolling across the 7-day grid with single-tap toggle support.
* **60fps Edge Auto-Scrolling**: Dragging within 48px of viewport boundaries auto-scrolls horizontally and vertically.
* **Sticky Control Rails**: Navigation toolbar stays pinned at the top with 1-tap Day Jumps (`[Sun]..[Sat]`) and Time Jumps (`[Top]`, `[8 AM]`, `[12 PM]`, `[6 PM]`).
* **Wide Touch Track**: Left time column (100px wide) features `touch-action: pan-y` for effortless thumb scrolling without touching grid cells.
* **Floating Action Pill**: A 1-tap `[ ↑ Back to Top ]` button automatically appears when scrolling deep into the grid.

---

## 8. Quick Component Snippet Library

### Primary Action Button:
```tsx
<Button className="h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer">
  {label}
</Button>
```

### Micro Data Tag / Status Chip:
```tsx
<span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-foreground">
  {timezone}
</span>
```

### Anchored Filter Toolbar:
```tsx
<div className="bg-muted/20 border border-border/70 rounded-md p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
  {/* Controls & Pickers */}
</div>
```
