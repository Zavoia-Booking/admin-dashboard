# Design System – Admin Dashboard (Tailwind v4 + OKLCH)

This document explains how to use the design system defined in `src/shared/styles/globals.css`.

You don't need to remember OKLCH values or worry about light/dark differences – just use the semantic classes and component classes described here.

## 1. Architecture Overview

The design system is built in 4 layers:

1. **Primitive Tokens** – raw colors (neutral, primary, status)
2. **Semantic Variables** – what each color means in the UI (base, surface, error-bg, etc.)
3. **Tailwind Utilities** – classes like `bg-base`, `text-text-1`, `border-border`
4. **Components** – `.btn-primary`, `.card`, `.alert-success`, etc.

**You should mostly live in layers 3 and 4.** Layers 1 and 2 are for system-level changes and theming.

```
Primitive Tokens (foundation colors)
        ↓
Semantic Variables (purpose-based aliases)
        ↓
Tailwind Utilities (what you use)
        ↓
Components (composed patterns)
```

## 2. Color System

### 2.1 Primitive Tokens (low-level)

Defined in `@theme { ... }`:

**Neutral (grays):** `--color-neutral-50`, `100`, `200`, `400`, `600`, `700`, `900`

**Primary (brand peach):** `--color-primary-100`, `400`, `500`, `700`, `900`

**Status colors:**
- **Info:** `--color-info-100`, `300`, `600`
- **Success:** `--color-success-100`, `300`, `600`
- **Warning:** `--color-warning-100`, `300`, `600`
- **Error:** `--color-error-100`, `300`, `600`

**Full scales (for advanced use):**
- `--color-peach-50` through `900`
- `--color-blue-50` through `900`
- `--color-green-50` through `900`
- `--color-red-50` through `900`
- `--color-orange-50` through `900`

**Rule:**
👉 **Do not use these directly in components**, unless you're doing something very custom (e.g. charts, data visualization).

Instead, use the semantic utilities below.

### 2.2 Semantic Variables

Defined in `:root` (light mode) and `.dark` (dark mode):

**Backgrounds:**
- `--base` – page background
- `--surface` – cards, panels, modals
- `--surface-hover` – surface hover state
- `--surface-active` – surface active/pressed state
- `--overlay` – modal/overlay backdrop

**Text:**
- `--text-primary` – main text (headings/body)
- `--text-secondary` – secondary text
- `--text-tertiary` – helper/caption text
- `--text-disabled` – disabled text
- `--text-inverse` – text on dark backgrounds
- `--text-link` – links
- `--text-link-hover` – link hover

**Borders:**
- `--border` – default border
- `--border-strong` – stronger borders
- `--border-subtle` – very light dividers
- `--border-focus` – focus highlight color

**Interactive:**
- `--primary`, `--primary-hover`, `--primary-active`
- `--secondary`, `--secondary-hover`

**Statuses:**
- **Info:** `--info`, `--info-bg`, `--info-border`
- **Success:** `--success`, `--success-bg`, `--success-border`
- **Warning:** `--warning`, `--warning-bg`, `--warning-border`
- **Error:** `--error`, `--error-bg`, `--error-border`

Dark mode simply overrides these values under `.dark`.

### 2.3 Tailwind Utilities (what you actually type)

Created via `@theme inline { ... }` – these are the main classes you should use.

#### Backgrounds

```tsx
bg-base              // Page background
bg-surface           // Card/panel background
bg-surface-hover     // Hover state for interactive surfaces
bg-surface-active    // Active/pressed state
bg-overlay           // Modal backdrop
```

#### Text

```tsx
text-text-1          // Primary text (headings + main body)
text-text-2          // Secondary text
text-text-3          // Helper/caption text
text-text-disabled   // Disabled text
text-text-inverse    // Text on dark backgrounds
text-link            // Links
hover:text-link-hover // Link hover state
```

#### Borders

```tsx
border-border        // Default border color
border-border-strong // Stronger borders
border-border-subtle // Subtle dividers
focus:ring-focus     // Focus outline color
ring-2 ring-offset-2 // Focus ring utilities
```

#### Interactive

```tsx
bg-primary                    // Primary actions
hover:bg-primary-hover        // Primary hover
active:bg-primary-active      // Primary active
bg-secondary                  // Secondary actions
hover:bg-secondary-hover      // Secondary hover
```

#### Status Colors

**Info:**
```tsx
bg-info-bg
border-info-border
text-info
```

**Success:**
```tsx
bg-success-bg
border-success-border
text-success
```

**Warning:**
```tsx
bg-warning-bg
border-warning-border
text-warning
```

**Error:**
```tsx
bg-error-bg
border-error-border
text-error
```

**Rule of thumb:**
👉 In normal components, use semantic utilities only. Don't reach for `bg-neutral-100` or `bg-primary-500` unless you're doing something special (data viz, marketing landing sections, etc.).

### 2.4 Legacy Classes (Backward Compatibility)

For backward compatibility, these legacy classes still work and use the new color palette:

```tsx
bg-background        // Same as bg-base
text-foreground     // Same as text-text-1
bg-card             // Same as bg-surface
text-card-foreground // Same as text-text-1
bg-primary          // Uses new peach primary
text-primary-foreground // Uses text-inverse
bg-secondary        // Uses new secondary
bg-muted            // Same as bg-surface-hover
text-muted-foreground // Same as text-text-3
bg-destructive      // Same as bg-error
border              // Same as border-border
bg-input            // Same as bg-surface
ring                // Same as border-focus
```

**Sidebar colors:**
```tsx
bg-sidebar
text-sidebar-foreground
bg-sidebar-primary
text-sidebar-primary-foreground
bg-sidebar-accent
text-sidebar-accent-foreground
border-sidebar-border
ring-sidebar-ring
```

**Chart colors:**
```tsx
bg-chart-1  // Orange
bg-chart-2  // Blue
bg-chart-3  // Green
bg-chart-4  // Peach/Primary
bg-chart-5  // Red
```

## 3. Components

These are pre-built patterns in `@layer components`. Prefer them whenever they fit what you're building.

### 3.1 Buttons

**Base button style:**
```tsx
<button className="btn">...</button>
```

**Variants:**

**Primary action:**
```tsx
<button className="btn-primary">Save</button>
```

**Secondary action:**
```tsx
<button className="btn-secondary">Cancel</button>
```

**Destructive action:**
```tsx
<button className="btn-error">Delete</button>
```

All of these:
- Respect light/dark mode automatically
- Have proper focus ring (`ring-focus`)
- Use semantic tokens under the hood

**When making a new variant** (e.g. `.btn-ghost`), build it on top of `.btn`:
```css
.btn-ghost {
  @apply btn bg-transparent text-text-1 hover:bg-surface-hover;
}
```

### 3.2 Cards

**Standard card:**
```tsx
<div className="card">
  Card content
</div>
```

**Clickable card:**
```tsx
<div className="card-interactive">
  Clickable content
</div>
```

Use `card` for any panel-like element: settings sections, dashboard widgets, side panels, etc.

### 3.3 Alerts

Use alerts to show feedback messages:

```tsx
<div className="alert-info">
  Info message…
</div>

<div className="alert-success">
  Changes saved successfully.
</div>

<div className="alert-warning">
  Something might be wrong.
</div>

<div className="alert-error">
  Something went wrong.
</div>
```

They automatically:
- Use the correct background / border / text colors
- Work in both light & dark themes

### 3.4 Forms

**Form elements:**

**Label:**
```tsx
<label className="label">Email</label>
```

**Input:**
```tsx
<input className="input" />
```

**Input with error:**
```tsx
<input className="input-error" />
<p className="error-text">This field is required.</p>
```

**Helper text:**
```tsx
<p className="helper-text">We'll never share your email.</p>
```

**Use:**
- `.input` for normal fields
- `.input-error` when there's a validation problem
- `.label`, `.helper-text`, `.error-text` for consistent typography

**Disabled state** is handled via:
```tsx
<input className="input" disabled />
```

### 3.5 Links

For "link-looking" text, use the `.link` class:

```tsx
<a href="#" className="link">Open settings</a>
```

This handles:
- Default color
- Hover color
- Underline + transition

### 3.6 Badges

**Status badges:**
```tsx
<span className="badge-info">Info</span>
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Error</span>
```

These are great for:
- Table status columns
- Chip-like indicators
- Small inline tags

## 4. Theming (Light / Dark Mode)

Light mode values are defined on `:root`.

Dark mode overrides are defined in `.dark`.

**To toggle dark mode**, add/remove `.dark` on the root element (usually `<html>` or `<body>`):

```tsx
document.documentElement.classList.add('dark');   // enable dark mode
document.documentElement.classList.remove('dark'); // disable dark mode
```

**You don't need to add `dark:` variants to your classes for colors** – all semantic utilities automatically pick the right values.

## 5. When to Use What

### Use Component Classes When:

You're building a standard pattern we already have:
- Buttons
- Cards
- Alerts
- Inputs
- Badges

**Example:**
```tsx
<button className="btn-primary">Save</button>
<div className="card">Card content</div>
<div className="alert-success">All good!</div>
```

### Use Semantic Utilities When:

You're building something custom, but still UI-ish:
- Custom layout pieces
- New small components
- Special wrappers

**Examples:**
```tsx
<div className="bg-surface border border-border rounded-lg p-4">
  <p className="text-text-1">Custom panel</p>
  <p className="text-text-2">Some description</p>
</div>

<p className="text-text-3">
  Small helper text
</p>
```

### Use Primitive Tokens Only When:

You have a very specific design need:
- Data visualization
- Marketing / illustration
- Very custom state coloring

**Example (rare):**
```tsx
<div className="bg-primary-100 text-text-1">
  Marketing highlight
</div>
```

## 6. Accessing Colors in JavaScript

If you need a color in JS (e.g. for a chart library), read the semantic variable:

```tsx
const surfaceColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--surface') // returns full oklch(...) string
  .trim();
```

**Prefer reading semantic vars** (`--surface`, `--info`, `--success-bg`) instead of primitives (`--color-primary-500`), so your JS respects theming.

## 7. Quick "Do / Don't" Cheat Sheet

### ✅ DO

- Use `bg-base`, `bg-surface`, `text-text-1`, `border-border`
- Use `.btn-*`, `.card`, `.alert-*`, `.input`, `.badge-*`
- Let light/dark mode be handled by the `.dark` class + CSS vars
- Touch the primitives only when you're working on the design system itself
- Use legacy classes (`bg-primary`, `text-foreground`) if you're updating existing components gradually

### ❌ DON'T

- Hardcode hex colors like `#fff`, `#000`, `#f2cdac`
- Use Tailwind default colors (`bg-red-500`, `text-gray-700`, etc.) – use our semantic tokens instead
- Duplicate OKLCH values directly in components
- Mix semantic and primitive colors in the same component for no reason
- Use `bg-green-200`, `bg-red-600` etc. – use `bg-success-bg`, `bg-error-bg` instead

## 8. Migration Guide

### From Legacy Classes to New Semantic Classes

If you want to migrate existing components to use the new semantic classes:

**Backgrounds:**
```tsx
// Old
bg-background → bg-base
bg-card → bg-surface

// New (recommended)
bg-base
bg-surface
```

**Text:**
```tsx
// Old
text-foreground → text-text-1
text-muted-foreground → text-text-3

// New (recommended)
text-text-1
text-text-2
text-text-3
```

**Borders:**
```tsx
// Old
border → border-border
border-default → border-border

// New (recommended)
border-border
border-border-strong
border-border-subtle
```

**Interactive:**
```tsx
// Old (still works, but new is cleaner)
bg-primary hover:bg-primary/90 → bg-primary hover:bg-primary-hover

// New (recommended)
bg-primary hover:bg-primary-hover active:bg-primary-active
```

**Status:**
```tsx
// Old
bg-green-200 text-green-900 → bg-success-bg text-success
bg-red-600 → bg-error

// New (recommended)
bg-success-bg border-success-border text-success
bg-error-bg border-error-border text-error
```

## 9. Common Patterns

### Card with Header and Footer
```tsx
<div className="card">
  <h3 className="text-text-1 font-semibold mb-2">Title</h3>
  <p className="text-text-2">Description</p>
  <div className="mt-4 flex gap-2">
    <button className="btn-primary">Action</button>
    <button className="btn-secondary">Cancel</button>
  </div>
</div>
```

### Form with Validation
```tsx
<div className="space-y-2">
  <label className="label">Email Address</label>
  <input className="input" type="email" />
  <p className="helper-text">We'll never share your email.</p>
</div>

{/* With error */}
<div className="space-y-2">
  <label className="label">Email Address</label>
  <input className="input-error" type="email" />
  <p className="error-text">Please enter a valid email.</p>
</div>
```

### Status Badge in Table
```tsx
<td>
  <span className="badge-success">Active</span>
</td>
<td>
  <span className="badge-warning">Pending</span>
</td>
<td>
  <span className="badge-error">Failed</span>
</td>
```

### Alert with Action
```tsx
<div className="alert-success flex items-center justify-between">
  <div>
    <strong>Success!</strong> Your changes have been saved.
  </div>
  <button className="btn-secondary text-sm">Dismiss</button>
</div>
```

### Sidebar Navigation
```tsx
<aside className="bg-sidebar border-r border-sidebar-border">
  <nav className="p-4">
    <a className="text-sidebar-foreground hover:bg-sidebar-accent">
      Dashboard
    </a>
  </nav>
</aside>
```

## 10. Color Palette Reference

### Primary (Peach/Tan)
- **Main brand color:** `#f2cdac` (oklch 86% 0.08 65)
- **Light mode:** Peach/tan buttons and accents
- **Dark mode:** Brighter peach for better contrast

### Status Colors
- **Info (Blue):** `#ecf3fe` background, `oklch(65% 0.15 250)` text
- **Success (Green):** `#dbfce7` background, `oklch(55% 0.15 145)` text
- **Warning (Orange):** `#ffedd4` background, `oklch(65% 0.15 75)` text
- **Error (Red):** `#ec4444` text, light background

### Neutral Scale
- **50:** Near white (99.5% lightness)
- **100:** Very light bg `#f9fafb` (99% lightness)
- **200:** Light borders (97% lightness)
- **400:** Disabled states (85% lightness)
- **600:** Secondary text (55% lightness)
- **700:** Body text (40% lightness)
- **900:** Headings (15% lightness)

## 11. Troubleshooting

### Colors not updating in dark mode?
- Make sure `.dark` class is on the root element (`<html>` or `<body>`)
- Check that you're using semantic utilities, not hardcoded colors

### Component looks wrong?
- Verify you're using the correct semantic class (`bg-surface` not `bg-white`)
- Check if there's a component class available (`.card`, `.btn-primary`, etc.)

### Need a color not in the system?
- First check if a semantic token would work (`bg-surface-hover` vs custom color)
- If truly needed, add it to the primitive tokens in `@theme` block
- Then create a semantic variable that references it
- Finally, map it in `@theme inline`

---

**Questions?** Check `src/shared/styles/globals.css` for the full implementation.

