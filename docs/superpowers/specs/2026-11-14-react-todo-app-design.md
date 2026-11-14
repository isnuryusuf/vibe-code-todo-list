# React Todo App — Design

## Intent

A beautiful, persistent todo app that's a pleasure to use daily.

## Goals

- Add, complete, edit, and delete todos with zero friction
- Persist todos in localStorage (survives refresh and restart)
- Filter by All / Active / Completed
- Look polished and modern — smooth animations, clean typography, cohesive colors
- Work on desktop and mobile

## Non-Goals

- User accounts or authentication
- Server/backend
- Collaboration or sharing
- File export/import

## Anti-Goals

- Don't make it feel like a generic starter template
- Don't add complexity that slows down the core flow of adding/completing/deleting

## Constraints

- Browser-only (no server)
- Must run on modern browsers
- LocalStorage for persistence

## Approaches

1. **Vite + React (TS) + Tailwind CSS + localStorage** — Chosen. Fast dev server, great DX, Tailwind gives us a polished look out of the box with minimal custom CSS. Zero server needed.

2. **Create React App** — Slower build, outdated DX. Not recommended.

3. **Next.js** — Overkill for a client-only app. Adds routing, SSR, etc. that we don't need.

## Parts

### Stack
- **Framework:** React 19 with TypeScript
- **Build:** Vite (fast dev server and builds)
- **Styling:** Tailwind CSS (utility-first, fast iteration on design)
- **Persistence:** localStorage (browser-native, no dependencies)
- **Animations:** Tailwind transitions + CSS keyframes (simple, no heavy animation library)
- **Icons:** Heroicons (via `react-icons` or inline SVGs to keep deps light)

### Components
- `App` — Layout shell with gradient header
- `TodoInput` — Input field + add button
- `TodoList` — Renders filtered todo items
- `TodoItem` — Single todo with checkbox, text (editable on double-click), delete button
- `TodoFilter` — All / Active / Completed tab filter
- `TodoStats` — Counter (e.g., "3 of 10 remaining")
- `EmptyState` — Friendly message when no todos match the filter

### Data Model
```ts
interface Todo {
  id: string; // crypto.randomUUID()
  text: string;
  completed: boolean;
  createdAt: number; // timestamp
}
```

### Persistence Layer
- Custom hook `useTodos()` — manages state, reads from/writes to localStorage
- Auto-saves on every mutation
- Handles localStorage errors gracefully (quota exceeded, etc.)

### Visual Design
- Gradient header (e.g., indigo-to-purple) with app title
- Clean white card body with soft shadow
- Smooth slide-in animation for new todos
- Checked todos get a strikethrough + reduced opacity
- Delete button appears on hover (desktop) or always visible (mobile)
- Custom styled checkbox with check animation
- Empty state with a friendly message + icon

### User Flow
1. App loads → reads localStorage → renders todos or empty state
2. User types in input → presses Enter or clicks Add → todo appears with slide-in
3. User clicks checkbox → toggles completed (animated strikethrough)
4. User double-clicks text → edits inline, presses Enter to save or Escape to cancel
5. User hovers todo → delete button appears
6. User clicks filter tab → filters current view
7. User clicks "Clear completed" → removes all completed todos

## Calls Made (by builder)
- Use `crypto.randomUUID()` for todo IDs (or Date.now() fallback)
- Use Tailwind transition classes for checkbox animation
- Double-click to edit (standard todo app pattern)
- Escape to cancel editing
- Responsive: filter tabs stack vertically on very narrow screens
