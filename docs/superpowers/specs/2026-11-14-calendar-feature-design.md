# Calendar Feature Design

## Intent
Add due dates to todos with a full month calendar view, inline date picker, and date-aware filtering/sorting.

## Goals
- Users can set an optional due date per todo inline.
- Users can view todos on a full month calendar.
- The app surfaces overdue todos with a visual warning.
- Todos can be filtered by date state (Today, Upcoming, Overdue).
- Due dates persist with existing localStorage data.

## Non-Goals
- Time-of-day scheduling.
- Recurring todos.
- Calendar export/sync.
- Drag-and-drop rescheduling.

## Anti-Goals
- Blocking users from creating todos without a due date.
- Making the calendar view the default landing screen.

## Data Model
```ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string; // ISO date string YYYY-MM-DD
}
```

## Components

### 1. `DueDatePicker`
- Props: `value?: string`, `onChange(date: string | undefined): void`
- Uses `react-day-picker` in a popover.
- Shows selected date or a calendar icon when empty.
- Allows clearing the date.

### 2. Updated `TodoItem`
- Displays formatted due date next to todo text.
- Shows overdue badge when `dueDate < today && !completed`.
- Includes inline `DueDatePicker`.

### 3. `CalendarView`
- Props: `todos: Todo[]`, `onDateSelect(date: string): void`
- Renders a month grid using `react-day-picker`.
- Badges/dots under dates that have todos.
- Highlights dates with overdue todos in red.

### 4. Updated `TodoFilter`
- New filter options: `all`, `active`, `completed`, `today`, `upcoming`, `overdue`
- Existing tabs remain; calendar tab is separate.

### 5. Updated `TodoList`
- Sorts todos by `dueDate` (nearest first) when not explicitly filtered by date.
- Empty state messages updated for new filters.

### 6. Updated `App`
- Adds a "Calendar" view toggle next to filter tabs.
- When a calendar date is selected, switches to list view filtered to that date.

## Hook Updates
- `useTodos` adds `setDueDate(id, date)` action.
- Helpers: `isOverdue(dueDate, completed)`, `isToday(date)`, `formatDate(date)`.

## Dependencies
- `react-day-picker` (v9)
- `date-fns` for date utilities

## Persistence
- Existing localStorage todos without `dueDate` load normally.
- New todos may have `dueDate` written back to localStorage.

## Accessibility
- Date picker uses native button semantics and `aria-label`.
- Calendar grid uses `role="grid"` from `react-day-picker`.
- Due date text has `aria-label` describing the date status.

## Tests
- Set/clear due date on a todo.
- Overdue detection helper.
- Calendar view shows todos on correct dates.
- Filter "Overdue" only shows overdue todos.
- Full E2E flow: add todo with due date, view in calendar, mark complete.
