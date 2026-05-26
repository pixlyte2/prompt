# UI Guidelines

## Design System
- [Component Guidelines](component-guidelines.md)
- [Design System](design-system.md)
- [Component Diagrams](component-diagrams.md) - Mermaid diagrams for component relationships

## Before Building UI
1. Check existing components
2. Follow design patterns
3. Ensure accessibility compliance

## Current UI Framework
- **Framework**: React + Tailwind CSS
- **Icons**: Lucide React
- **Theme**: Dark/Light mode support
- **Responsive**: Mobile-first approach

## Component Architecture
```
components/
├── ui/           # Base components (buttons, inputs)
├── layout/       # Layout components (header, sidebar)
├── features/     # Feature-specific components
└── pages/        # Page-level components
```

## Design Principles
1. **Consistency**: Use established patterns
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Optimize for speed
4. **Responsiveness**: Mobile-first design
5. **Theming**: Support dark/light modes

## Quick Checklist
- [ ] Component follows naming convention
- [ ] Responsive design implemented
- [ ] Accessibility attributes added
- [ ] Dark mode styles included
- [ ] Props properly typed (if TypeScript)