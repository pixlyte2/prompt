# Component Guidelines

## Naming Conventions
- **PascalCase** for component names: `ProductionHub`
- **camelCase** for props: `isLoading`, `onClick`
- **kebab-case** for CSS classes: `task-card`, `status-pill`

## Component Structure
```jsx
// 1. Imports
import React from 'react';
import { Icon } from 'lucide-react';

// 2. Constants (if any)
const STATUS_OPTIONS = ['todo', 'in_progress', 'completed'];

// 3. Component
function ComponentName({ prop1, prop2, ...props }) {
  // Logic here
  
  return (
    <div className="component-wrapper">
      {/* JSX here */}
    </div>
  );
}

// 4. Export
export default ComponentName;
```

## Styling Guidelines

### Tailwind Classes
- Use semantic class names
- Group related classes: `flex items-center gap-2`
- Dark mode: `dark:bg-gray-800`
- Responsive: `sm:text-lg md:text-xl`

### Color System
```css
/* Status Colors */
.status-todo: text-gray-400 dark:text-gray-500
.status-progress: text-blue-500
.status-completed: text-emerald-500

/* Platform Colors */
.platform-youtube: text-red-500
.platform-instagram: text-pink-500
.platform-facebook: text-blue-600
```

## Component Types

### 1. Base Components
- Buttons, inputs, modals
- Highly reusable
- Minimal business logic

### 2. Feature Components
- Task cards, status pills
- Domain-specific logic
- Compose base components

### 3. Page Components
- Full page layouts
- Route-level components
- Orchestrate features

## Props Guidelines
- Use destructuring: `{ title, status, onClick }`
- Provide defaults: `size = 'medium'`
- Use proper types: `onClick: () => void`
- Spread remaining props: `...props`

## Accessibility Requirements
- Use semantic HTML elements
- Add ARIA labels: `aria-label="Close dialog"`
- Keyboard navigation: `tabIndex`, `onKeyDown`
- Focus management: `autoFocus`, `ref`
- Screen reader support: `role`, `aria-describedby`