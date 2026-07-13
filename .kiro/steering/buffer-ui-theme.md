---
inclusion: fileMatch
fileMatchPattern: "client/src/**/*.{jsx,tsx,css}"
---

# Buffer (publish.buffer.com) UI/UX Theme

New or changed client UI MUST match the **real Buffer product** design language (buffer.com / publish.buffer.com after their 2024 refresh): a calm, friendly, light-first SaaS look with warm neutrals, generous whitespace, soft shapes, lighter typography, and one vibrant blue reserved for primary actions. Content takes center stage; color is used sparingly to guide attention.

## Real Buffer design tokens (source of truth)

- **Primary "Buffer Blue" = `#2C4BFF`** — the `primary` scale in `tailwind.config.js` (500=`#2C4BFF`, 400=periwinkle `#6B81FF`, 900=navy `#121E66`). Use for the ONE primary action per view.
- **Brand black `#231F20`**, white `#FFFFFF`, plus accents summer yellow `#FADE2A`, persimmon `#FF9B6B`, blush `#F3AFB9`. Neutrals = the slate-based `gray-*` / `buffer-*` scales.
- **Typography: Figtree** (real Buffer product body font; loaded in `index.css`, first in the `sans` stack, Inter fallback). Stolzl is Buffer's paid display font — do NOT add it; use Figtree weights (300–700) instead.
- **Radius**: soft, not pill-shaped surfaces — `rounded-lg`/`rounded-xl` containers, `rounded-md` small controls, `rounded-full` only for pills/dots/avatars.
- **Elevation**: subtle — `shadow-sm` cards, `shadow-xl` modals only. Prefer `border-gray-200` over heavy shadows.
- **Spacing**: generous, airy padding; don't crowd.

Sources: buffer.com/brand-kit (Buffer Blue `#2C4BFF`), buffer.com "Introducing a Calmer, More Flexible Buffer", Figtree via product site.

## Prefer the `buffer-*` classes (they now embody these values)

Defined in `client/src/index.css` `@layer components`:
- `buffer-card` — white / `dark:bg-gray-800`, `rounded-lg`, `buffer-border`, `shadow-sm`. Every surface/panel/modal.
- `buffer-button-primary` — Buffer Blue fill (`bg-primary-500`), white text. Max one per view.
- `buffer-button-secondary` — gray fill. Cancel/back.
- `buffer-input` — all inputs/selects/textareas (Buffer-blue focus ring).
- `buffer-text` / `buffer-text-muted` / `buffer-text-subtle` — text hierarchy.
- `buffer-border` — dividers/borders.

Canonical examples: `client/src/components/ScheduleCategoryAnalysis.jsx`, `client/src/components/PlannerCategoriesModal.jsx`.

## Do

- Build surfaces with `buffer-card`; text via `buffer-text*`; forms via `buffer-input`.
- Primary action = `buffer-button-primary` (Buffer Blue). Secondary = `buffer-button-secondary`.
- For NEW primary-blue accents use the `primary-*` token (`text-primary-500`, `bg-primary-50`), NOT raw `blue-*`.
- Status as small accents only (dots/pills/thin bars): emerald=positive, rose=negative, `primary`=on-target, amber/gray=neutral. Pill: `bg-<c>-50 dark:bg-<c>-950/25 text-<c>-700 dark:text-<c>-400 border-<c>-200/70`.
- Add `tabular-nums` to numbers/metrics/percentages. Separate rows with `divide-y divide-gray-100 dark:divide-gray-800`.
- Always ship `dark:` variants (dark mode is `class`-based).
- Modals: `createPortal`, `fixed inset-0 bg-black/40 backdrop-blur-sm`, panel = `buffer-card` + `shadow-xl`, scroll areas use `custom-scrollbar`.

## Don't

- Don't reinvent buttons/inputs/cards with raw Tailwind when a `buffer-*` class exists.
- Don't use `bg-blue-600`/`indigo-*` for primary UI — that's generic Tailwind blue, not Buffer Blue `#2C4BFF`. Use `buffer-button-primary` / `primary-*`.
- Don't use loud gradients, saturated full-row tints, pill-shaped cards, or multiple competing primary buttons.
- Don't omit dark-mode classes or ship numeric columns without `tabular-nums`.
