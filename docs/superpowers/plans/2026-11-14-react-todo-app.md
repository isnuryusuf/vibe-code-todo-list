# React Todo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful, persistent todo app in a single-browser tab.

**Architecture:** Vite + React (TS) + Tailwind CSS, all client-side with localStorage for persistence. Seven focused components plus one custom hook for state management.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, localStorage, Vite's built-in test runner (Vitest), React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-react-todo-app-design.md`

## Global Constraints

- React 19 with TypeScript (exact version from scaffolding)
- Tailwind CSS for all styling (no custom CSS files)
- localStorage for persistence (browser-native, zero dependencies)
- No external UI component library (no shadcn, MUI, etc.)
- No server, no backend, no auth
- All interactions must feel smooth: transitions, hover states, keyboard shortcuts

## Review Focus

- Empty input field submitting a blank todo — must be rejected with visual feedback
- Keyboard shortcuts (Enter to add, Escape to cancel edit) — must work reliably
- Rapid checkbox toggles or input mutations — must not produce stale state or duplicate entries
- localStorage quota exceeded — must gracefully degrade with error message
- Concurrent tab writes (two tabs open) — must not corrupt data on the other tab

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `index.html`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: (nothing — this is the first task)
- Produces: A working Vite dev server on `http://localhost:5173` with TypeScript, Tailwind, and a blank "Hello World" page

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

Run: `npm create vite@latest . -- --template react-ts`

If Vite scaffold is already present, skip to Step 2.

- [ ] **Step 2: Add Tailwind CSS**

Run: `npx -y tailwindcss@latest init -p`

- [ ] **Step 3: Configure Tailwind**

In `tailwind.config.ts`, set content paths to `"./src/**/*.{js,ts,jsx,tsx}"` and `purge` mode.

- [ ] **Step 4: Add Tailwind directives to `src/index.css`**

Add:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Update `src/App.tsx` with a simple "Hello World"**

```tsx
function App() {
  return <h1 className="text-3xl font-bold text-center">Hello World</h1>;
}
export default App;
```

- [ ] **Step 6: Add `.gitignore` entries**

Ensure `node_modules/`, `dist/`, `.env`, `*.local` are listed.

- [ ] **Step 7: Install dependencies**

Run: `npm install`

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`

Expected: App loads at `http://localhost:5173` showing "Hello World"

- [ ] **Step 9: Commit**

```bash
git init 2>/dev/null || true
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: Core Types and Persistence Hook

**Files:**
- Create: `src/types/todo.ts`
- Create: `src/hooks/useTodos.ts`
- Test: `src/hooks/useTodos.test.ts`

**Interfaces:**
- Consumes: (nothing — first data layer)
- Produces:
  - `Todo` type: `{ id: string, text: string, completed: boolean, createdAt: number }`
  - `useTodos()` hook returns: `{ todos, addTodo(text), toggleTodo(id), deleteTodo(id), editTodo(id, newText), clearCompleted(), totalCount, activeCount, completedCount }`
  - Auto-persists to localStorage key `"todos-app"` on every mutation

- [ ] **Step 1: Define `Todo` type**

Create `src/types/todo.ts`:
```ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
```

- [ ] **Step 2: Write failing tests for `useTodos` hook**

Create `src/hooks/useTodos.test.ts` with these test cases:
- `adds a new todo` — `addTodo("Buy milk")` returns the todo with generated id and timestamp
- `toggles a todo's completed status` — initial `completed: false` → toggling makes it `true`
- `deletes a todo` — after `deleteTodo(id)`, the todo is no longer in the list
- `persists todos to localStorage` — after adding, reading localStorage key `"todos-app"` contains the todos
- `loads todos from localStorage on init` — pre-populate localStorage, then `useTodos()` returns those todos
- `clearCompleted removes only completed todos` — mix of completed/active, calling `clearCompleted()` keeps active ones
- `counts are correct` — `totalCount`, `activeCount`, `completedCount` reflect actual list state

```ts
describe("useTodos", () => {
  test("adds a new todo", () => { ... });
  test("toggles a todo's completed status", () => { ... });
  test("deletes a todo", () => { ... });
  test("persists to localStorage", () => { ... });
  test("loads from localStorage on init", () => { ... });
  test("clearCompleted removes only completed", () => { ... });
  test("counts are correct", () => { ... });
});
```

- [ ] **Step 3: Run tests to verify they FAIL**

Run: `npm test -- --run`
Expected: All tests fail (hook doesn't exist yet)

- [ ] **Step 4: Implement `useTodos` hook in `src/hooks/useTodos.ts`**

```ts
// Signature:
// export function useTodos(): {
//   todos: Todo[];
//   addTodo: (text: string) => string; // returns id
//   toggleTodo: (id: string) => void;
//   deleteTodo: (id: string) => void;
//   editTodo: (id: string, newText: string) => void;
//   clearCompleted: () => void;
//   totalCount: number;
//   activeCount: number;
//   completedCount: number;
// }
```

Use `useState` + `useEffect` pattern:
- Initialize state by reading from localStorage
- Persist to localStorage on every state change via `useEffect`
- Generate IDs with `crypto.randomUUID()` or `Date.now().toString()` + random suffix

- [ ] **Step 5: Run tests to verify they PASS**

Run: `npm test -- --run`
Expected: All 7 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/types/todo.ts src/hooks/useTodos.ts src/hooks/useTodos.test.ts
git commit -m "feat: add Todo type and useTodos persistence hook"
```

---

### Task 3: TodoInput Component

**Files:**
- Create: `src/components/TodoInput.tsx`
- Test: `src/components/TodoInput.test.tsx`

**Interfaces:**
- Consumes: `addTodo(text: string): void` prop from parent
- Produces: An input field + button that accepts text input and calls `addTodo` on Enter key or button click. Rejects empty input with visual feedback (e.g., red border flash).

- [ ] **Step 1: Write failing test**

Create `src/components/TodoInput.test.tsx`:
- `calls addTodo when Enter is pressed` — type text, press Enter, verify addTodo called with that text
- `does NOT call addTodo on empty input` — press Enter with no text, addTodo NOT called
- `clears input after adding` — after Enter, input field is empty
- `calls addTodo when button is clicked` — type text, click button, verify addTodo called

```ts
describe("TodoInput", () => {
  test("calls addTodo on Enter key press", () => { ... });
  test("does not call addTodo on empty input", () => { ... });
  test("clears input after adding", () => { ... });
  test("calls addTodo on button click", () => { ... });
});
```

- [ ] **Step 2: Run tests to verify they FAIL**

Run: `npm test -- --run`
Expected: Component not found

- [ ] **Step 3: Implement `TodoInput` component**

```tsx
// Signature:
// interface TodoInputProps {
//   onAdd: (text: string) => void;
// }
// function TodoInput({ onAdd }: TodoInputProps) { ... }
```

- Input field with placeholder "What needs to be done?"
- Add button (icon or text "Add")
- On Enter: if input is non-empty, call `onAdd(input)` and clear input
- On empty Enter: flash border red (tailwind class `border-red-500` briefly)
- Styling: rounded input, subtle border, focus ring

- [ ] **Step 4: Run tests to verify they PASS**

Run: `npm test -- --run`
Expected: All 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/TodoInput.tsx src/components/TodoInput.test.tsx
git commit -m "feat: add TodoInput component with validation"
```

---

### Task 4: TodoItem Component

**Files:**
- Create: `src/components/TodoItem.tsx`
- Test: `src/components/TodoItem.test.tsx`

**Interfaces:**
- Consumes: `Todo` object + `onToggle(id)`, `onDelete(id)`, `onEdit(id, newText)` callbacks from parent
- Produces: A single todo row with: checkbox, text (editable on double-click), delete button (visible on hover). Completed todos show strikethrough + reduced opacity.

- [ ] **Step 1: Write failing tests**

Create `src/components/TodoItem.test.tsx`:
- `calls onToggle when checkbox is clicked` — click checkbox, verify callback called with todo id
- `calls onDelete when delete button is clicked` — click delete icon, verify callback called
- `calls onEdit with new text on double-click and Enter` — double-click, type new text, press Enter, verify callback called
- `calls onEdit with old text on double-click and Escape` — double-click, cancel with Escape, verify original text preserved
- `applies completed styles when todo is completed` — checkbox checked, text has line-through, reduced opacity
- `shows editing input after double-click` — double-click, input field appears with current text

```ts
describe("TodoItem", () => {
  test("calls onToggle on checkbox click", () => { ... });
  test("calls onDelete on delete click", () => { ... });
  test("calls onEdit on double-click Enter", () => { ... });
  test("preserves original text on Escape", () => { ... });
  test("applies completed styles", () => { ... });
  test("shows edit input on double-click", () => { ... });
});
```

- [ ] **Step 2: Run tests to verify they FAIL**

Expected: Component not found

- [ ] **Step 3: Implement `TodoItem` component**

```tsx
// Signature:
// interface TodoItemProps {
//   todo: Todo;
//   onToggle: () => void;
//   onDelete: () => void;
//   onEdit: (newText: string) => void;
// }
// function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) { ... }
```

- Checkbox that toggles `todo.completed`
- Text: clickable to enter edit mode (double-click on text)
- Edit mode: replaces text with `<input>` pre-filled with current text
- Enter in edit mode: calls `onEdit(newText)`
- Escape in edit mode: calls `onEdit(currentText)` (cancel)
- Delete button: appears on hover (desktop), always visible (mobile)
- Styling: completed → `line-through`, `opacity-50`, check animation

- [ ] **Step 4: Run tests to verify they PASS**

Run: `npm test -- --run`
Expected: All 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/TodoItem.tsx src/components/TodoItem.test.tsx
git commit -m "feat: add TodoItem component with edit/delete/toggle"
```

---

### Task 5: TodoList and TodoFilter Components

**Files:**
- Create: `src/components/TodoList.tsx`
- Create: `src/components/TodoFilter.tsx`
- Create: `src/components/TodoStats.tsx`
- Test: `src/components/TodoList.test.tsx`
- Test: `src/components/TodoFilter.test.tsx`

**Interfaces:**
- Consumes: `Todo[]` array + `filter: FilterType` from parent
- Produces:
  - `TodoList`: renders filtered todos using `TodoItem` components
  - `TodoFilter`: three tabs (All, Active, Completed), emits filter change event
  - `TodoStats`: shows "X of Y tasks remaining"
  - `FilterType` type: `"all" | "active" | "completed"`

- [ ] **Step 1: Define FilterType and write tests**

Add to `src/types/todo.ts`:
```ts
export type FilterType = "all" | "active" | "completed";
```

Tests for `TodoFilter`:
- `shows three tabs: All, Active, Completed`
- `calls onChange when tab is clicked` — click Active, verify callback called with "active"
- `highlights active tab` — selected tab has distinct style

Tests for `TodoList`:
- `renders filtered todos` — given 3 todos with filter "active", renders 2
- `renders TodoItem for each todo` — check that TodoItem components render
- `renders empty state when no todos match` — shows friendly message

- [ ] **Step 2: Run tests to verify they FAIL**

Expected: Components not found

- [ ] **Step 3: Implement `TodoFilter`**

```tsx
// Signature:
// interface TodoFilterProps {
//   filter: FilterType;
//   onChange: (filter: FilterType) => void;
// }
// function TodoFilter({ filter, onChange }: TodoFilterProps) { ... }
```

Three tabs with active state styling. Clicking a tab calls `onChange`.

- [ ] **Step 4: Implement `TodoList`**

```tsx
// Signature:
// interface TodoListProps {
//   todos: Todo[];
//   filter: FilterType;
//   onToggle: (id: string) => void;
//   onDelete: (id: string) => void;
//   onEdit: (id: string, text: string) => void;
// }
// function TodoList({ todos, filter, onToggle, onDelete, onEdit }: TodoListProps) { ... }
```

Filter logic: if `filter === "all"` show all, `"active"` show `!completed`, `"completed"` show `completed`. Render `TodoItem` for each. Show empty state if no todos match.

- [ ] **Step 5: Implement `TodoStats`**

```tsx
// Signature:
// interface TodoStatsProps {
//   activeCount: number;
//   totalCount: number;
// }
// function TodoStats({ activeCount, totalCount }: TodoStatsProps) { ... }
```

Renders: `"{activeCount} of {totalCount} tasks remaining"`

- [ ] **Step 6: Run tests to verify they PASS**

Run: `npm test -- --run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/types/todo.ts src/components/TodoList.tsx src/components/TodoFilter.tsx src/components/TodoStats.tsx src/components/TodoList.test.tsx src/components/TodoFilter.test.tsx
git commit -m "feat: add TodoList, TodoFilter, and TodoStats components"
```

---

### Task 6: App Assembly with Design Polish

**Files:**
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/ClearCompleted.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css` (add global animation keyframes if Tailwind doesn't cover)

**Interfaces:**
- Consumes: `useTodos()` hook, all component exports
- Produces: The complete `App` component with layout, gradient header, all sub-components assembled, smooth slide-in animation for new todos

- [ ] **Step 1: Implement `EmptyState` component**

```tsx
// Shows when no todos match the current filter
// Friendly message + subtle icon
// "No tasks yet" or "No active tasks" depending on filter
```

- [ ] **Step 2: Implement `ClearCompleted` component**

```tsx
// Shows when there are completed todos
// Button text: "Clear completed ({count})"
// Calls onClear callback
```

- [ ] **Step 3: Assemble `App` component**

```tsx
// Signature:
// function App() {
//   const { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted, activeCount, totalCount } = useTodos();
//   // ...
// }
```

Layout structure:
```
┌─ Gradient Header (indigo to purple) ─────────────┐
│  📝 My Todos                                      │
├───────────────────────────────────────────────────┤
│  [Input field]  [Add]                             │
│                                                   │
│  [TodoItem 1]                                     │
│  [TodoItem 2]                                     │
│  ...                                              │
│                                                   │
│  [All] [Active] [Completed]  (tabs)              │
│  "3 of 10 tasks remaining"                        │
│  [Clear completed (2)]                            │
└───────────────────────────────────────────────────┘
```

- [ ] **Step 4: Add slide-in animation**

Add to `src/index.css`:
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Apply to new todo items: `animation: slideIn 0.2s ease-out`

- [ ] **Step 5: Verify visually**

Run dev server. Check:
- Gradient header looks good
- Todos slide in when added
- Filter tabs work
- Empty state shows correctly
- Responsive on different widths

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/index.css src/components/EmptyState.tsx src/components/ClearCompleted.tsx
git commit -m "feat: assemble App with gradient header, animations, and polish"
```

---

### Task 7: End-to-End Smoke Test

**Files:**
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: `App` component
- Produces: One integration test that exercises the full user flow: add a todo, toggle it, edit it, filter, delete

- [ ] **Step 1: Write end-to-end smoke test**

```ts
describe("App smoke test", () => {
  test("full user flow: add, toggle, edit, filter, delete", () => {
    // Add "Learn React"
    // Verify it appears
    // Toggle it (mark complete)
    // Filter to "completed" - should appear
    // Filter to "active" - should not appear
    // Edit text to "Learn TypeScript"
    // Verify updated text
    // Delete it
    // Verify it's gone
  });
});
```

- [ ] **Step 2: Run tests to verify they PASS**

Run: `npm test -- --run`
Expected: All tests pass including Task 2, 3, 4, 5, 7

- [ ] **Step 3: Commit**

```bash
git add src/App.test.tsx
git commit -m "test: add end-to-end smoke test for full user flow"
```

---

## Execution Checklist

- [ ] Task 1: Scaffolding
- [ ] Task 2: Types + Persistence Hook
- [ ] Task 3: TodoInput
- [ ] Task 4: TodoItem
- [ ] Task 5: TodoList + TodoFilter + TodoStats
- [ ] Task 6: App Assembly
- [ ] Task 7: E2E Smoke Test
