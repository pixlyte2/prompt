# Design System

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, sans-serif
- **Implementation**: `font-family: 'Inter', system-ui, sans-serif`

### Font Sizes
- **[8px]**: `text-[8px]` - Micro labels, format pills
- **[9px]**: `text-[9px]` - Status badges, live indicators
- **[10px]**: `text-[10px]` - Section headers, metadata
- **[11px]**: `text-[11px]` - Task items, compact text
- **xs (12px)**: `text-xs` - Small labels, captions
- **sm (14px)**: `text-sm` - Body text, form inputs
- **base (16px)**: `text-base` - Default body text
- **lg (18px)**: `text-lg` - Headings, emphasis
- **xl (20px)**: `text-xl` - Page titles

### Font Weights
- **normal (400)**: `font-normal` - Body text
- **medium (500)**: `font-medium` - Subtle emphasis
- **semibold (600)**: `font-semibold` - Headings
- **bold (700)**: `font-bold` - Strong emphasis
- **black (900)**: `font-black` - Statistics, key metrics

## Color System

### Brand Colors
```css
/* Buffer-inspired palette */
buffer-50: #f8fafc
buffer-100: #f1f5f9
buffer-200: #e2e8f0
buffer-300: #cbd5e1
buffer-400: #94a3b8
buffer-500: #64748b
buffer-600: #475569
buffer-700: #334155
buffer-800: #1e293b
buffer-900: #0f172a

/* Primary blue scale */
primary-50: #eff6ff
primary-100: #dbeafe
primary-200: #bfdbfe
primary-300: #93c5fd
primary-400: #60a5fa
primary-500: #3b82f6
primary-600: #2563eb
primary-700: #1d4ed8
primary-800: #1e40af
primary-900: #1e3a8a
```

### Status Colors
```css
/* Task Status */
--status-todo: #9CA3AF (gray-400)
--status-progress: #3B82F6 (blue-500)
--status-completed: #10B981 (emerald-500)

/* Content Format Pills */
--format-short: #FB923C (orange-400) bg, #C2410C (orange-700) text
--format-long: #6366F1 (indigo-500) bg, #4338CA (indigo-700) text

/* Platform Colors */
--platform-youtube: #EF4444 (red-500)
--platform-instagram: #EC4899 (pink-500)
--platform-facebook: #2563EB (blue-600)

/* Delivery Monitor */
--monitor-pooja: #EC4899 (pink-500)
--monitor-mahalakshmi: #A855F7 (purple-500)
```

### Background System
```css
/* Light Mode */
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB (gray-50)
--bg-tertiary: #F3F4F6 (gray-100)
--bg-card: rgba(255,255,255,0.4) /* Glass morphism */

/* Dark Mode */
--bg-primary-dark: #111827 (gray-900)
--bg-secondary-dark: #1F2937 (gray-800)
--bg-tertiary-dark: #374151 (gray-700)
--bg-card-dark: rgba(31,41,55,0.4) /* Glass morphism */
```

## Component Design Tokens

### Buffer-Style Components
```css
/* Card Component */
.buffer-card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm;
}

/* Primary Button */
.buffer-button-primary {
  @apply px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 
         dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
         dark:focus:ring-offset-gray-800;
}

/* Secondary Button */
.buffer-button-secondary {
  @apply px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 
         text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 
         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* Input Field */
.buffer-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
         placeholder-gray-500 dark:placeholder-gray-400 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
         transition-all duration-200;
}
```

### Text Utilities
```css
.buffer-text { @apply text-gray-900 dark:text-gray-100; }
.buffer-text-muted { @apply text-gray-600 dark:text-gray-300; }
.buffer-text-subtle { @apply text-gray-500 dark:text-gray-400; }
.buffer-border { @apply border-gray-200 dark:border-gray-700; }
```

### Status Pills
```css
/* Task Status Pills */
.status-todo {
  @apply bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300;
}

.status-progress {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300;
}

.status-completed {
  @apply bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300;
}

/* Content Format Pills */
.format-short {
  @apply bg-orange-100 text-orange-700 border-orange-200/50 
         dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50;
}

.format-long {
  @apply bg-indigo-100 text-indigo-700 border-indigo-200/50 
         dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50;
}
```

## Layout System

### Spacing Scale
```css
/* Tailwind spacing (used throughout) */
0.5 = 2px   /* Micro spacing */
1   = 4px   /* Tight spacing */
1.5 = 6px   /* Small gaps */
2   = 8px   /* Default gaps */
2.5 = 10px  /* Medium gaps */
3   = 12px  /* Standard spacing */
4   = 16px  /* Large spacing */
6   = 24px  /* Section spacing */
8   = 32px  /* Major spacing */
```

### Border Radius
```css
rounded-lg: 8px    /* Cards, buttons */
rounded-xl: 12px   /* Modals, major components */
rounded-2xl: 16px  /* Premium cards, glass morphism */
rounded-full: 50%  /* Pills, avatars, dots */
```

### Shadows
```css
/* Buffer-style shadows */
shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)

/* Custom buffer shadows */
.shadow-buffer: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
.shadow-buffer-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
```

## Responsive Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## Animation & Transitions

### Standard Transitions
```css
/* Global smooth transitions */
transition-property: color, background-color, border-color, text-decoration-color, 
                    fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)
transition-duration: 150ms

/* Premium easing */
ease-premium: cubic-bezier(0.23, 1, 0.32, 1) /* Used in dashboard animations */
```

### Motion Preferences
```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  /* Disable animations for accessibility */
}
```

## Scrollbar Styling

### Custom Scrollbars
```css
/* Subtle scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  @apply bg-gray-200/50 dark:bg-gray-700/50 rounded-full 
         hover:bg-gray-300 dark:hover:bg-gray-600; 
}

/* Voice-over script scrollbar (always visible) */
.vo-script-scrollbar { scrollbar-width: thin; }
.vo-script-scrollbar::-webkit-scrollbar { width: 10px; }
.vo-script-scrollbar::-webkit-scrollbar-track { 
  @apply bg-gray-200 dark:bg-gray-800 rounded-full; 
}
.vo-script-scrollbar::-webkit-scrollbar-thumb { 
  @apply bg-gray-400 dark:bg-gray-600 rounded-full border-2 
         border-gray-200 dark:border-gray-800 hover:bg-gray-500; 
}

/* Hidden scrollbar */
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

## Glass Morphism Effects

### Premium Cards
```css
/* Dashboard stats cards */
.glass-card {
  @apply rounded-2xl border border-white/60 dark:border-gray-700/60 
         bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl 
         shadow-xl shadow-gray-200/20 dark:shadow-black/20 
         ring-1 ring-black/[0.03] dark:ring-white/[0.05];
}

/* Delivery monitor cards */
.monitor-card {
  @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl 
         shadow-lg hover:shadow-xl hover:-translate-y-0.5 
         transition-all group/monitor relative overflow-hidden;
}
```

## Icons

### Lucide React Icons
- **Library**: Lucide React
- **Sizes**: 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 22px, 24px
- **Stroke Width**: 2px (default), 3px (emphasis)
- **Usage**: Consistent sizing within components

### Icon Sizing Guidelines
```css
/* Micro icons */
size={10} /* Status dots, micro indicators */
size={11} /* Task list icons */
size={12} /* Button icons, collapse toggles */

/* Standard icons */
size={14} /* Dropdown arrows, small actions */
size={16} /* Form inputs, standard buttons */
size={18} /* Navigation, primary actions */
size={20} /* Page headers, mobile menu */

/* Large icons */
size={22} /* Mobile navigation toggle */
size={24} /* Feature icons, empty states */
```

## Dark Mode Implementation

### CSS Variables for Toast
```css
:root {
  --toast-bg: #ffffff;
  --toast-color: #334155;
  --toast-border: #e2e8f0;
}

.dark {
  --toast-bg: #374151;
  --toast-color: #f9fafb;
  --toast-border: #4b5563;
}
```

### Dark Mode Classes
- Use `dark:` prefix for all dark mode styles
- Maintain contrast ratios for accessibility
- Test both themes during development

## Accessibility Standards

### Focus Management
```css
/* Focus rings */
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
dark:focus:ring-offset-gray-800

/* Focus visible for keyboard navigation */
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
```

### Color Contrast
- Maintain WCAG 2.1 AA standards
- Test with both light and dark themes
- Use sufficient contrast for text and backgrounds

### Interactive States
```css
/* Hover states */
hover:bg-gray-50 dark:hover:bg-gray-800
hover:text-blue-600 dark:hover:text-blue-400

/* Active states */
active:scale-[0.98] /* Subtle press feedback */

/* Disabled states */
disabled:opacity-50 disabled:cursor-not-allowed
```