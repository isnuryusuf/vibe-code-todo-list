# Calendar Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional due dates to todos with inline date picker, full month calendar view, overdue warnings, and date-aware filters.

**Architecture:** Extend the `Todo` type with an ISO due date string. Build small focused components: `DueDatePicker` for inline selection, `CalendarView` for the month grid, and `dateUtils` helpers. Update `TodoItem`, `TodoFilter`, `TodoList`, and `App` to integrate dates. Use `react-day-picker` v9 for the calendar UI and `date-fns` for date math.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite, Vitest, react-day-picker v9, date-fns.

**Spec:** `docs/superpowers/specs/2026-11-14-calendar-feature-design.md`

## Global Constraints
- `verbatimModuleSyntax: true` — type-only imports must use `import type`.
- All new code must have tests; follow red-green-refactor.
- localStorage data without `dueDate` must load without errors.
- No existing behavior may be removed (add, complete, edit, delete, filter, clear completed, persistence).
- Use native `input` types and Tailwind classes; no new CSS files unless required for `react-day-picker` overrides.

## Review Focus
1. **Overdue detection across timezone boundaries:** a todo due "today" should not be flagged overdue at 9 AM local time. Use date-only comparison (ignore time/timezone) in helpers and tests.
2. **localStorage backward compatibility:** old todos without `dueDate` load and can receive a due date later. Test loading legacy data.
3. **Calendar date selection + filter interaction:** selecting a date in the calendar view must switch the UI to list view filtered to that date, and the user must be able to return to normal filters.
4. **Clearing a due date:** the inline picker must allow removing a previously set date and the UI must update immediately.
5. **Empty calendar states:** months with no todos and filters with no matches must show friendly, non-confusing messages.

---

### Task 1: Date Utilities

**Files:**
- Create: `src/utils/dateUtils.ts`
- Create: `src/utils/dateUtils.test.ts`

**Interfaces:**
- Consumes: `Date` values, ISO date strings (`YYYY-MM-DD`).
- Produces: `isOverdue(dueDate: string, completed: boolean): boolean`, `isToday(date: string): boolean`, `isUpcoming(date: string): boolean`, `formatDate(date: string): string`, `toISODate(date: Date): string`, `parseISODate(date: string): Date`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, test, expect } from 'vitest';
import { isOverdue, isToday, isUpcoming, formatDate, toISODate } from './dateUtils';

describe('dateUtils', () => {
  test('isOverdue returns true for past uncompleted todo', () => {
    expect(isOverdue('2020-01-01', false)).toBe(true);
  });

  test('isOverdue returns false for completed todo even if past', () => {
    expect(isOverdue('2020-01-01', true)).toBe(false);
  });

  test('isOverdue returns false for today', () => {
    const today = toISODate(new Date());
    expect(isOverdue(today, false)).toBe(false);
  });

  test('isToday returns true for today', () => {
    const today = toISODate(new Date());
    expect(isToday(today)).toBe(true);
  });

  test('isUpcoming returns true for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    expect(isUpcoming(toISODate(future))).toBe(true);
  });

  test('formatDate formats ISO date to readable string', () => {
    expect(formatDate('2025-12-25')).toMatch(/Dec/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/dateUtils.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `dateUtils.ts`**

Use `date-fns` functions (`isBefore`, `isSameDay`, `isAfter`, `format`, `startOfToday`, `parseISO`) and compare by local date only.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/dateUtils.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/dateUtils.ts src/utils/dateUtils.test.ts
git commit -m "feat: add date utilities for due dates"
```

---

### Task 2: Extend Todo Type and useTodos Hook

**Files:**
- Modify: `src/types/todo.ts`
- Modify: `src/hooks/useTodos.ts`
- Modify: `src/hooks/useTodos.test.ts`

**Interfaces:**
- Consumes: `Todo` type, existing `useTodos` actions.
- Produces: `Todo.dueDate?: string`, `setDueDate(id: string, dueDate?: string): void`.

- [ ] **Step 1: Write failing tests for `setDueDate`**

Add to `src/hooks/useTodos.test.ts`:

```ts
  test('sets a due date on a todo', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Due soon'));
    const id = result.current.todos[0].id;

    act(() => result.current.setDueDate(id, '2025-12-25'));
    expect(result.current.todos[0].dueDate).toBe('2025-12-25');
  });

  test('clears a due date on a todo', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Due soon'));
    const id = result.current.todos[0].id;

    act(() => result.current.setDueDate(id, '2025-12-25'));
    act(() => result.current.setDueDate(id, undefined));
    expect(result.current.todos[0].dueDate).toBeUndefined();
  });

  test('loads legacy todos without dueDate', () => {
    const legacy = [{ id: '1', text: 'Old', completed: false, createdAt: 1 }];
    localStorage.setItem('todos-app', JSON.stringify(legacy));
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos[0].dueDate).toBeUndefined();
    expect(result.current.todos[0].text).toBe('Old');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useTodos.test.ts`
Expected: FAIL with `setDueDate` not defined.

- [ ] **Step 3: Update `Todo` type and implement `setDueDate`**

Add `dueDate?: string` to `Todo`. Add `setDueDate` action to `useTodos` that maps over todos and updates the matching id.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useTodos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/todo.ts src/hooks/useTodos.ts src/hooks/useTodos.test.ts
git commit -m "feat: add dueDate field and setDueDate action to useTodos"
```

---

### Task 3: DueDatePicker Component

**Files:**
- Create: `src/components/DueDatePicker.tsx`
- Create: `src/components/DueDatePicker.test.tsx`
- Install: `react-day-picker`, `date-fns`

**Interfaces:**
- Consumes: `dateUtils` helpers, `react-day-picker`.
- Produces: `DueDatePicker` component with props `{ value?: string; onChange: (date?: string) => void; }`.

- [ ] **Step 1: Install dependencies**

Run: `npm install react-day-picker date-fns`

- [ ] **Step 2: Write failing tests**

```tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DueDatePicker } from './DueDatePicker';

describe('DueDatePicker', () => {
  test('opens calendar popover on button click', () => {
    render(<DueDatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('calls onChange with selected date', () => {
    const onChange = vi.fn();
    render(<DueDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalled();
  });

  test('shows clear button when date is set', () => {
    render(<DueDatePicker value="2025-12-25" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/clear due date/i)).toBeDefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/components/DueDatePicker.test.tsx`
Expected: FAIL with component not found.

- [ ] **Step 4: Implement `DueDatePicker.tsx`**

A button with calendar icon opens a popover containing `react-day-picker` DayPicker. Selecting a day calls `onChange(toISODate(date))`. Show formatted date when set. Include a small clear button that calls `onChange(undefined)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/DueDatePicker.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/DueDatePicker.tsx src/components/DueDatePicker.test.tsx
git commit -m "feat: add DueDatePicker component with react-day-picker"
```

---

### Task 4: Update TodoItem for Due Date

**Files:**
- Modify: `src/components/TodoItem.tsx`
- Modify: `src/components/TodoItem.test.tsx`

**Interfaces:**
- Consumes: `DueDatePicker`, `dateUtils` helpers.
- Produces: `TodoItemProps` gains `onSetDueDate?: (date?: string) => void`. Component displays formatted due date, overdue badge, and inline date picker.

- [ ] **Step 1: Write failing tests**

Add to `src/components/TodoItem.test.tsx`:

```tsx
  test('displays formatted due date', () => {
    const todo = makeTodo({ dueDate: '2025-12-25' });
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />);
    expect(screen.getByText(/Dec/)).toBeDefined();
  });

  test('shows overdue badge for past uncompleted todo', () => {
    const todo = makeTodo({ dueDate: '2020-01-01' });
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />);
    expect(screen.getByText(/overdue/i)).toBeDefined();
  });

  test('calls onSetDueDate when date is selected', () => {
    const onSetDueDate = vi.fn();
    const todo = makeTodo();
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={onSetDueDate} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('15'));
    expect(onSetDueDate).toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/TodoItem.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `TodoItem.tsx`**

Add `onSetDueDate` prop. Render formatted due date next to text when present. Show "Overdue" badge when `isOverdue(todo.dueDate, todo.completed)`. Embed `DueDatePicker`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/TodoItem.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TodoItem.tsx src/components/TodoItem.test.tsx
git commit -m "feat: show due date, overdue badge, and inline picker in TodoItem"
```

---

### Task 5: CalendarView Component

**Files:**
- Create: `src/components/CalendarView.tsx`
- Create: `src/components/CalendarView.test.tsx`

**Interfaces:**
- Consumes: `Todo[]`, `dateUtils` helpers, `react-day-picker`.
- Produces: `CalendarView` component with props `{ todos: Todo[]; onDateSelect: (date: string) => void; }`.

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import type { Todo } from '../types/todo';

const makeTodo = (text: string, dueDate: string): Todo => ({
  id: text,
  text,
  completed: false,
  createdAt: Date.now(),
  dueDate,
});

describe('CalendarView', () => {
  test('renders month grid', () => {
    render(<CalendarView todos={[]} onDateSelect={vi.fn()} />);
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('calls onDateSelect when a day with a todo is clicked', () => {
    const onSelect = vi.fn();
    render(<CalendarView todos={[makeTodo('A', '2025-12-25')]} onDateSelect={onSelect} />);
    fireEvent.click(screen.getByText('25'));
    expect(onSelect).toHaveBeenCalledWith('2025-12-25');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/CalendarView.test.tsx`
Expected: FAIL with component not found.

- [ ] **Step 3: Implement `CalendarView.tsx`**

Render `DayPicker` in month view. Use `modifiers` or custom footer to show dots/badges on dates with todos. Highlight overdue dates. Clicking any date calls `onDateSelect`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/CalendarView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CalendarView.tsx src/components/CalendarView.test.tsx
git commit -m "feat: add CalendarView month grid with todo badges"
```

---

### Task 6: Update Filters and TodoList

**Files:**
- Modify: `src/types/todo.ts` (FilterType)
- Modify: `src/components/TodoFilter.tsx`
- Modify: `src/components/TodoFilter.test.tsx`
- Modify: `src/components/TodoList.tsx`
- Modify: `src/components/TodoList.test.tsx`

**Interfaces:**
- Consumes: `dateUtils`, updated `FilterType`.
- Produces: `FilterType` includes `'today' | 'upcoming' | 'overdue'`. `TodoList` sorts by due date and handles new filters.

- [ ] **Step 1: Update `FilterType`**

```ts
export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue';
```

- [ ] **Step 2: Write failing tests for new filters**

Update `TodoFilter.test.tsx` to expect six tabs.

Update `TodoList.test.tsx`:

```tsx
  test('filter overdue shows only overdue uncompleted todos', () => {
    const todos = [
      { id: '1', text: 'Old', completed: false, createdAt: 1, dueDate: '2020-01-01' },
      { id: '2', text: 'Done old', completed: true, createdAt: 1, dueDate: '2020-01-01' },
      { id: '3', text: 'Future', completed: false, createdAt: 1, dueDate: '2030-01-01' },
    ];
    render(<TodoList todos={todos} filter="overdue" onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('Old')).toBeDefined();
    expect(screen.queryByText('Done old')).toBeFalsy();
    expect(screen.queryByText('Future')).toBeFalsy();
  });

  test('todos are sorted by due date', () => {
    const todos = [
      { id: '1', text: 'Later', completed: false, createdAt: 1, dueDate: '2030-01-01' },
      { id: '2', text: 'Sooner', completed: false, createdAt: 1, dueDate: '2025-01-01' },
    ];
    render(<TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Sooner');
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/components/TodoFilter.test.tsx src/components/TodoList.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement filter updates**

Update `TodoFilter` to render six tabs with proper active styling and `aria-pressed`. Update `TodoList` filtering logic and sort todos by `dueDate` (undefined dates last).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/TodoFilter.test.tsx src/components/TodoList.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/todo.ts src/components/TodoFilter.tsx src/components/TodoFilter.test.tsx src/components/TodoList.tsx src/components/TodoList.test.tsx
git commit -m "feat: add today/upcoming/overdue filters and due-date sorting"
```

---

### Task 7: Integrate Calendar into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/EmptyState.tsx`

**Interfaces:**
- Consumes: `CalendarView`, `DueDatePicker`, updated `useTodos`, updated `TodoList`, updated `TodoFilter`.
- Produces: App with "Calendar" view toggle and date-selection flow.

- [ ] **Step 1: Write failing tests**

Update `App.test.tsx`:

```tsx
  test('switches to calendar view', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Calendar'));
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('selecting a calendar date filters list to that date', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs/i);
    fireEvent.change(input, { target: { value: 'Meeting' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    await screen.findByText('Meeting');

    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('25'));

    fireEvent.click(screen.getByText('Calendar'));
    fireEvent.click(screen.getByText('25'));

    expect(screen.getByText('Meeting')).toBeDefined();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `App.tsx`**

- Add view state: `'list' | 'calendar'`.
- Add "Calendar" tab/button next to filter tabs.
- When Calendar is active, render `<CalendarView todos={todos} onDateSelect={...} />`.
- On date select, switch back to list view and set filter to show todos for that date (use a helper or dedicated filter/state).
- Wire `onSetDueDate` from `TodoItem` to `useTodos.setDueDate`.
- Update `EmptyState` messages for calendar/date filters.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run: `npm run test:run`
Expected: ALL PASS.

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components/EmptyState.tsx
git commit -m "feat: integrate calendar view and due dates into App"
```

---

### Task 8: Final Review and Polish

**Files:**
- All modified files.

- [ ] **Step 1: Manual verification**

Run dev server: `npm run dev`
Open `http://localhost:5173`
Verify:
- Add todo with due date
- See overdue badge on past date
- Switch to Calendar view, see todo on date
- Click date, return to list filtered by that date
- Clear due date
- All filters work

- [ ] **Step 2: Accessibility spot check**

Ensure calendar buttons have labels, filter tabs have `aria-pressed`, due date text is readable.

- [ ] **Step 3: Commit any polish**

```bash
git add -A
git commit -m "polish: calendar feature final review"
```

## Self-Review

**Spec coverage:**
- Inline due date picker → Task 3 + Task 4
- Full month calendar view → Task 5 + Task 7
- Overdue warnings → Task 1 + Task 4
- Filter by date state → Task 6
- Sort by due date → Task 6
- Persistence → Task 2 (dueDate saved with todos)

**Step scan:** Each step has one clear deliverable.

**Type consistency:** `dueDate` is `string | undefined` everywhere; `FilterType` updated once.

**Review Focus coverage:**
- Timezone/overdue: tested in Task 1 with `isOverdue(today)` returning false.
- Legacy data: tested in Task 2.
- Calendar + filter interaction: tested in Task 7.
- Clear due date: tested in Task 2 and Task 3.
- Empty states: handled in Task 6 and Task 7.

**Proportion:** Plan focuses on interfaces and test assertions; implementation bodies left to implementer.
