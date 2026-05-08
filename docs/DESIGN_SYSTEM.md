# Design System — OccupyTheCouch v3

This document catalogs every design token, utility class, and shared component available in the project.
Always use these instead of hardcoding colors, spacing, or building one-off card structures.

---

## 1. Semantic CSS tokens

Defined in [`styles/globals.css`](../styles/globals.css) as CSS custom properties.
Use via Tailwind semantic classes — **never hardcode hex values**.

| Token                            | Tailwind class                                 | Use for                              |
| -------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `--background`                   | `bg-background`                                | Page background                      |
| `--foreground`                   | `text-foreground`                              | Primary body text                    |
| `--card`                         | `bg-card`                                      | Card / panel surfaces                |
| `--card-foreground`              | `text-card-foreground`                         | Text on card surfaces                |
| `--primary` (`#a52a2d` cine-red) | `bg-primary`, `text-primary`, `border-primary` | Accent, CTAs, active states          |
| `--primary-foreground`           | `text-primary-foreground`                      | Text on primary backgrounds          |
| `--secondary`                    | `bg-secondary`                                 | Subtle backgrounds, hover states     |
| `--muted`                        | `bg-muted`                                     | Disabled / inactive backgrounds      |
| `--muted-foreground`             | `text-muted-foreground`                        | Secondary text, labels, placeholders |
| `--border`                       | `border-border`                                | All borders                          |
| `--input`                        | `bg-input`                                     | Input field backgrounds              |
| `--ring`                         | `ring-ring`                                    | Focus rings                          |
| `--destructive`                  | `bg-destructive`, `text-destructive`           | Error / delete actions               |

### Opacity modifiers (common patterns)

```
bg-primary/10    → very subtle red tint (icon containers)
bg-primary/20    → active icon container
border-primary/30 → soft red border
bg-secondary/30  → expanded panel background
bg-secondary/50  → table header background
hover:bg-secondary/50 → row hover
```

---

## 2. Cinema-specific raw tokens

Available as Tailwind classes via `--color-cine-*` mappings. Use sparingly — prefer semantic tokens above.

| Token                | Value (dark mode)        | Use for                     |
| -------------------- | ------------------------ | --------------------------- |
| `--cine-red`         | `#a52a2d`                | Same as `--primary`         |
| `--cine-red-soft`    | `#c73b3e`                | Hover state of primary      |
| `--cine-red-muted`   | `rgba(165,42,45,0.15)`   | Very subtle red tint        |
| `--cine-bg`          | `#0f0f0f`                | Page background (dark)      |
| `--cine-bg-soft`     | `#1a1a1a`                | Card background (dark)      |
| `--cine-bg-lighter`  | `#242424`                | Secondary background (dark) |
| `--cine-bg-elevated` | `#2a2a2a`                | Muted background (dark)     |
| `--cine-text`        | `#f5f5f5`                | Primary text (dark)         |
| `--cine-text-muted`  | `#a0a0a0`                | Muted text (dark)           |
| `--cine-border`      | `rgba(255,255,255,0.08)` | Border (dark)               |

---

## 3. Utility classes

Defined in [`styles/globals.css`](../styles/globals.css) under `/* COMPONENT UTILITIES */`.

### Card surfaces

| Class              | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `cine-card`        | Card with `bg-card`, `border-border`, `rounded-xl`, `p-6`, hover border/bg transition    |
| `cine-card-fit`    | Same as `cine-card` but `p-0` — for content that manages its own padding (tables, lists) |
| `cine-card-mobile` | Card with responsive padding: `p-2` → `sm:p-3` → `md:p-6`                                |

All three have a hover state: border shifts to `primary/50`, background shifts to `--card-hover`.

```tsx
// Standard content card — pure Tailwind equivalent
<div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:bg-card">
  ...
</div>

// List/table card (no padding — rows manage their own)
<div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50">
  {items.map(item => <Row key={item.id} />)}
</div>

// Mobile-first card — pure Tailwind equivalent
<div className="rounded-xl border border-border bg-card p-2 transition-all duration-300 hover:border-primary/50 sm:p-3 md:p-6">
  ...
</div>
```

> **New components use pure Tailwind only** — `cine-card`, `cine-card-fit`, `cine-card-mobile` exist in `globals.css` for legacy code. For new components, use the Tailwind equivalents above or the shared `<StatCard>` / `<ExpandableListItem>` components.

### Buttons

| Class            | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `cine-btn`       | Primary pill button — `bg-primary`, white text, scale hover             |
| `cine-btn-ghost` | Ghost pill button — transparent, `border-border`, hover fills secondary |

Prefer shadcn-ui `<Button>` for interactive buttons. Use `cine-btn` / `cine-btn-ghost` only for landing/marketing sections.

### Typography

| Class           | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `cine-title`    | Section title — `text-2xl md:text-3xl font-bold`, left red border (`border-l-4 border-primary pl-4`) |
| `text-gradient` | Gradient text — primary-colored, used for ratings and highlighted numbers                            |

```tsx
<h2 className="cine-title">Rankings</h2>
<span className="text-gradient font-bold tabular-nums">{rating.toFixed(2)}</span>
```

### Input

| Class        | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `cine-input` | Full-width input — `bg-input border-border rounded-lg p-3`, focus ring |

Prefer shadcn-ui `<Input>` for form inputs. Use `cine-input` for custom search inputs.

### Badge

| Class        | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `cine-badge` | Pill badge — `bg-primary/20 text-primary rounded-full px-3 py-1 text-sm` |

Prefer shadcn-ui `<Badge>` for most cases.

### Glass effect

| Class        | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `cine-glass` | Frosted glass — `bg-background/85 backdrop-blur-xl border-border` |

Used in the header/nav. Light mode is more opaque (`bg-background/92`).

### Oscars-specific

| Class                       | Description                               |
| --------------------------- | ----------------------------------------- |
| `oscars-movie-card`         | Compact movie card inside an oscars round |
| `oscars-movie-card--winner` | Winner variant with amber border/tint     |
| `oscars-comparison`         | Comparison table layout                   |

---

## 4. Animation classes

All defined in [`styles/globals.css`](../styles/globals.css) as `@keyframes` + Tailwind `animate-*` utilities.

| Class                    | Effect                  | Typical use             |
| ------------------------ | ----------------------- | ----------------------- |
| `animate-fade-in-up`     | Fade in + slide up 20px | Card/list entrance      |
| `animate-fade-in`        | Simple opacity fade     | Overlay, panel          |
| `animate-accordion-down` | Height 0 → auto         | Expanded panel reveal   |
| `animate-accordion-up`   | Height auto → 0         | Expanded panel collapse |

**Staggered entrance pattern:**

```tsx
{
  items.map((item, index) => (
    <div
      key={item.id}
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      ...
    </div>
  ));
}
```

---

## 5. Shared components

All in [`components/cineforum/common/`](../components/cineforum/common/).
Import from the barrel: `import { EmptyState, StatCard, SectionHeader, ExpandableListItem, ExpandableList } from "@/components/cineforum/common"`.

### `EmptyState`

```tsx
<EmptyState
  title="Nessun risultato"
  subtitle="Prova a cambiare i filtri."
  icon={<Search className="w-8 h-8 text-muted-foreground" />}
  variant="muted"
>
  <Button onClick={onReset}>Reimposta filtri</Button>
</EmptyState>
```

Props: `title` (required), `subtitle?`, `icon?`, `variant?: "default" | "muted"`, `children?` (CTA slot).

### `SectionHeader`

```tsx
<SectionHeader
  icon={<Heart className="w-4 h-4" />}
  title="Amore Ricevuto"
  subtitle="Quanto gli altri utenti hanno votato i tuoi film."
/>
```

Props: `title` (required), `icon?`, `subtitle?`, `className?`.

### `StatCard`

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
  <StatCard
    icon={<Trophy className="w-5 h-5 text-primary" />}
    iconBg="bg-primary/10"
    label="Media"
    value={avg?.toFixed(2) ?? "N/A"}
    tooltip="La media di tutti i voti espressi."
  />
  <StatCard
    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
    iconBg="bg-green-500/10"
    label="Delta"
    value={delta !== null ? (delta > 0 ? "+" : "") + delta.toFixed(2) : "N/A"}
    valueClassName={
      delta !== null
        ? delta > 0
          ? "text-green-500"
          : "text-red-500"
        : undefined
    }
  />
</div>
```

Props: `icon` (required), `iconBg?`, `label` (required), `value` (required), `valueClassName?`, `tooltip?`.

### `ExpandableListItem`

```tsx
<ExpandableListItem
  position={1}
  title="Blade Runner 2049"
  metric="8.42"
  metricClassName="text-gradient"
  badges={<Badge variant="secondary">Visto</Badge>}
  isExpanded={isExpanded}
  onToggle={onToggle}
  highlightBg="bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent"
  animationDelay={0}
>
  {/* expanded panel content */}
  <p className="text-sm text-muted-foreground">Dettagli del film...</p>
</ExpandableListItem>
```

Props: `position?`, `title` (required), `badges?`, `metric?`, `metricClassName?`, `isExpanded` (required), `onToggle` (required), `children?`, `highlightBg?`, `animationDelay?`, `className?`.

### `ExpandableList`

```tsx
<ExpandableList
  items={directors}
  renderItem={(director, index, isExpanded, onToggle) => (
    <ExpandableListItem
      key={director.id}
      position={index + 1}
      title={director.name}
      metric={director.average_rating.toFixed(2)}
      metricClassName="text-gradient"
      isExpanded={isExpanded}
      onToggle={onToggle}
      animationDelay={index * 30}
    >
      <DirectorMoviesTable movies={director.movies} />
    </ExpandableListItem>
  )}
/>
```

Props: `items` (required), `renderItem` (required), `multiOpen?: boolean` (default `false`), `className?`.

---

## 6. Radius scale

| Token          | Value      | Tailwind      |
| -------------- | ---------- | ------------- |
| `--radius-sm`  | `0.5rem`   | `rounded-sm`  |
| `--radius-md`  | `0.625rem` | `rounded-md`  |
| `--radius-lg`  | `0.75rem`  | `rounded-lg`  |
| `--radius-xl`  | `1rem`     | `rounded-xl`  |
| `--radius-2xl` | `1.25rem`  | `rounded-2xl` |

Standard usage: `rounded-xl` for cards/inputs, `rounded-lg` for inner elements, `rounded-full` for badges/dots/avatars.

---

## 7. Icon container colors

Standard icon container pattern used in stat cards and section headers:

| Color         | Container class    | Icon class        |
| ------------- | ------------------ | ----------------- |
| Red (primary) | `bg-primary/10`    | `text-primary`    |
| Blue          | `bg-blue-500/10`   | `text-blue-500`   |
| Green         | `bg-green-500/10`  | `text-green-500`  |
| Amber         | `bg-amber-500/10`  | `text-amber-500`  |
| Yellow        | `bg-yellow-500/10` | `text-yellow-500` |
| Purple        | `bg-purple-500/10` | `text-purple-500` |
| Cyan          | `bg-cyan-500/10`   | `text-cyan-500`   |

```tsx
<div className="p-2 rounded-lg bg-primary/10">
  <Trophy className="w-5 h-5 text-primary" />
</div>
```
