# Design System â€” Project Turtle UI

## Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366f1` (indigo-500) | Buttons, active states, links |
| Accent | `#06B6D4` (cyan-500) | Progress bars, status indicators |
| Sidebar BG | `#111827` (gray-900) | Left navigation |
| Content BG | `#ffffff` / `#f9fafb` | Main content area |
| Border | `#e5e7eb` (gray-200) | Card borders, dividers |
| Text Primary | `#111827` (gray-900) | Headings, body text |
| Text Secondary | `#6b7280` (gray-500) | Labels, metadata |
| Success | `#10b981` (emerald-500) | Connected, healthy |
| Warning | `#f59e0b` (amber-500) | Needs attention |
| Error | `#ef4444` (red-500) | Failed, critical |

## Layout Pattern
All pillar screens (Scrape, Analyze, Migrate) use a three-panel layout:
- **Left sidebar** (220px): Dark nav with pillar links + journey bar
- **Center content** (flex-1): Main workspace
- **Right chat panel** (380px): Persistent conversational AI, collapsible

## Component Patterns
- **Cards:** `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- **Buttons (primary):** `rounded-lg bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600`
- **Buttons (secondary):** `rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50`
- **Input fields:** `rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500`
- **Status badges:** `rounded-full px-2 py-0.5 text-xs font-medium` with contextual bg
- **Section headings:** `text-lg font-semibold text-gray-900`

## RBAC UI Rules
- **Viewer:** Hide action buttons, disable inputs, show read-only badges
- **Editor:** Full content interaction, AI chat enabled
- **Admin:** Everything + settings, user management, danger zone

## Accessibility (NON-NEGOTIABLE)
- No readable text lighter than `text-gray-500`
- All images have alt text
- Heading hierarchy: h1 â†’ h2 â†’ h3, no skipping
- Interactive elements have focus styles
- WCAG AA contrast ratio (4.5:1 minimum)

## Responsive Breakpoints
- Mobile (<768px): Single column, chat behind toggle
- Tablet (768-1024px): Icon-only sidebar, chat toggleable
- Desktop (>1024px): Full three-panel layout

For full design specs, reference `@specs/DESIGN-SYSTEM.md` and `@mockups/design-system.css`.
