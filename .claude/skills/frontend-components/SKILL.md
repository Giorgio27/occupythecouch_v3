---
name: frontend-components
description: UI patterns for OccupyTheCouch v3 React components — design tokens, shadcn primitives, mobile-first layouts, loading/empty states, StatCard, SectionHeader, EmptyState variants, ExpandableList, toggle groups and search inputs. Use when building or restyling any page or component in this project.
---

# Frontend components

Hard rules (tokens only, no `@radix-ui` imports, 150-line limit, lucide icons) are in `CLAUDE.md`. This file has the patterns to copy.

## Shared components first

Import from `@/components/cineforum/common` before writing new markup:
`StatCard`, `SectionHeader`, `EmptyState`, `LoadingCard`, `ExpandableList`, `ExpandableListItem`, `InfoNote`.

shadcn primitives from `@/components/ui/<name>`: `button`, `card`, `badge`, `dialog`, `select`, `input`, `skeleton`, `tooltip`…

## Tokens and utilities

Semantic classes: `bg-background`, `text-foreground`, `bg-card`, `bg-primary` / `text-primary` (cine red), `bg-secondary`, `text-muted-foreground`, `border-border`.

Utilities in `styles/globals.css`: `cine-card`, `cine-card-fit`, `text-gradient` (ratings, highlights), `glow-red-soft`, `animate-fade-in-up` (stagger with `style={{ animationDelay: "100ms" }}`), `animate-fade-in`. Don't add new custom CSS classes; use Tailwind.

Icon in a tinted container (accepted accent tints: `primary`, `green-500`, `amber-500`, `yellow-500`, `blue-500`, `purple-500` at `/10`):

```tsx
<div className="p-2 rounded-lg bg-primary/10">
  <Trophy className="w-5 h-5 text-primary" />
</div>
```

## Mobile-first

```tsx
<div className="flex flex-col lg:flex-row lg:items-center gap-3">
<h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
<div className="py-6 sm:py-8 px-4 sm:px-6">
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
<span className="hidden lg:inline">Full label</span>
```

## StatCard row

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
  <StatCard
    icon={<Trophy className="w-5 h-5 text-primary" />}
    iconBg="bg-primary/10"
    label={t("stats.average")}
    value={avg?.toFixed(2) ?? "N/A"}
    tooltip={t("stats.averageTooltip")}
  />
  <StatCard
    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
    iconBg="bg-green-500/10"
    label={t("stats.delta")}
    value={deltaLabel}
    valueClassName={deltaClassName}
  />
</div>
```

## SectionHeader

Props: `title`, `icon?`, `subtitle?`, `className?`.

```tsx
<SectionHeader
  icon={<Heart className="w-4 h-4" />}
  title={t("love.title")}
  subtitle={t("love.subtitle")}
/>
```

## EmptyState

Props: `title`, `subtitle?`, `icon?`, `variant?: "default" | "muted"`, `children?` (CTA slot).

```tsx
<EmptyState
  title={t("search.noResults")}
  subtitle={t("search.tryOtherFilters")}
  icon={<Search className="w-8 h-8 text-muted-foreground" />}
>
  <Button variant="outline" onClick={onReset}>{t("search.reset")}</Button>
</EmptyState>

{/* inside an existing card */}
<EmptyState title={t("movies.none")} variant="muted" />
```

## ExpandableList + ExpandableListItem

`ExpandableList` owns open/close state (single-open by default, `multiOpen` for many); `ExpandableListItem` owns layout. Domain styling (medals, badges, top-3 backgrounds) stays in the caller.

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

`ExpandableListItem` props: `position?` (number or node, e.g. a medal), `title`, `badges?`, `metric?`, `metricClassName?`, `isExpanded`, `onToggle`, `children?`, `highlightBg?`, `animationDelay?`.

## View toggle group

```tsx
const toggleClass = (active: boolean): string =>
  clsx(
    "px-3 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-secondary",
  );

<div className="flex rounded-xl border border-border overflow-hidden bg-card">
  <button onClick={() => setMode("cards")} className={toggleClass(mode === "cards")}>
    <LayoutGrid className="w-4 h-4" />
    <span className="hidden lg:inline">{t("view.cards")}</span>
  </button>
  <button
    onClick={() => setMode("table")}
    className={clsx(toggleClass(mode === "table"), "border-l border-border")}
  >
    <List className="w-4 h-4" />
    <span className="hidden lg:inline">{t("view.table")}</span>
  </button>
</div>
```

## Search input

```tsx
<div className="relative flex-1 lg:w-64">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <input
    type="text"
    placeholder={t("search.placeholder")}
    className={clsx(
      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm",
      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
      "hover:border-primary/50 transition-all duration-200",
    )}
  />
</div>
```

## Charts (Recharts)

Tooltip and grid styling use CSS variables, not Tailwind classes: `contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}`.
