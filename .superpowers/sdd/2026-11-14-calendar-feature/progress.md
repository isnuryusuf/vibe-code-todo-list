# SDD ledger — plan: docs/superpowers/plans/2026-11-14-calendar-feature.md

## Pre-flight
- Interfaces checked: Task 2 produces `Todo.dueDate` and `setDueDate` consumed by Tasks 4, 6, 7. Task 1 produces `dateUtils` consumed by Tasks 4, 5, 6. Task 3 produces `DueDatePicker` consumed by Tasks 4, 7. Task 6 updates `FilterType` consumed by Tasks 5, 7.
- Rulings: none yet.

## Task log
- Task 1 — dateUtils + date-fns, 6 tests, commit 5195133.
- Task 2 — Todo.dueDate + setDueDate, 10 tests, commit 35c29c6.
- Task 3 — DueDatePicker (react-day-picker), 3 tests, commit 7c424dc.
- Task 4 — TodoItem due date display, overdue badge, inline picker, 8 tests, commit 4734d83.
- Task 5 — CalendarView month grid, 2 tests, commit 7e5524e.
- Task 6 — today/upcoming/overdue filters + due-date sorting, 8 tests, commit d26c9ca.
- Task 7 — App calendar toggle + date selection filter, 4 tests, commit 9837f2c.
- Task 8 — full suite 48/48 pass, production build clean, commit 9837f2c.

## Post-plan request — visual polish (icons + pictures)
- Custom SVG favicon (`public/favicon.svg`) + generated PNG apple-touch icon.
- Header: floating 📋 emoji, subtitle, shimmer gradient animation.
- Decorative blurred gradient orbs and floating sparkles behind the card.
- Filter tabs: emoji icons via `before:content-[attr(data-icon)]` so text queries stay exact.
- View tabs: 📝 List / 🗓️ Calendar icons.
- Todo items: custom round check with ✓ overlay, due-date pill (⚠️ overdue / ☀️ today / 📅 future), 🔥 Overdue badge, 🗑️ delete.
- Input: ✍️ icon, gradient Add ✨ button.
- Stats: 🎯/🏆 pill. Clear completed: 🧹 hover button.
- Empty states: floating illustrated emoji badge + hint copy per filter.
- Calendar: 🗓️ title, clearer legend, click hint.
- Verification: 48/48 tests pass, `tsc -b && vite build` clean, browser DOM checks for calendar, today/upcoming/overdue filters, and date popover.
- Committed as 9a8a9f4.

## Post-plan request — desktop layout (≥1000×700)
- New `useMediaQuery` hook (`useIsDesktop`, breakpoint 900px) with 3 unit tests.
- App widened to `max-w-6xl`; header gains a "today" date pill on desktop.
- Two-column card at ≥900px: task list (left, 1fr) + sticky calendar sidebar (340px). Calendar is always visible on desktop; mobile keeps the List/Calendar toggle.
- Filter list scrolls inside the card (`max-h: calc(100vh - 430px)`) with a thin custom scrollbar, so 1000×700 fits without page scroll.
- Added desktop layout test (matchMedia mock) asserting list + calendar render together.
- Verification: 52/52 tests pass (11 files), `tsc -b && vite build` clean, live browser at 1076×904 shows side-by-side columns, card 997px wide, no horizontal overflow (doc height 983px). Tailwind generated `@media (width>=900px)` rules as expected.
- Committed as ad4157a.

## Post-plan request — OLED black theme + header redesign
- Pure black page background (`#000`, body + root), dark color scheme, theme-color meta black — saves power on OLED.
- Header rebuilt: aurora glow layers, gradient app icon tile with fuchsia glow, gradient title, glass date pill, animated fuchsia neon underline.
- All surfaces rethemed: card zinc-950/80, inputs, filters, todo rows, due pills, stats, empty states, calendar, date popover.
- Imported `react-day-picker/style.css` and added dark overrides: 38px day cells, uppercase weekdays, indigo/purple selected gradient, today accent, dimmed outside days, dark nav chevrons.
- Fixed calendar bug: selected date was never passed to CalendarView, so the picked day never highlighted. Added `selectedDate` prop + regression test (53 tests now).
- Compacted filter tabs to fit one row at 1000px; desktop card min-height 540px and list cap `calc(100vh - 460px)` so 1000×700 fits with ~696px document height.
- Verification: 53/53 tests pass, build clean, live browser 1319×904 shows pure black body, gradient header, dark card, dark calendar with gradient selected day, document height 904 (no page scroll). Screenshot reviewed.

## Post-plan request — Google Calendar / Outlook export
- `src/utils/calendarExport.ts`: `toGoogleCalendarUrl` (TEMPLATE action, all-day dates, exclusive end +1 day), `toOutlookCalendarUrl` (deeplink compose, 00:00:00–23:59:59, `allday=true`), `buildICS` (one VEVENT per dated todo, RFC 5545 escaping, CRLF, UTC `DTSTAMP`, `STATUS:COMPLETED`, injectable clock), `downloadICS` (Blob + anchor download, deferred revoke).
- `CalendarExportButton` in the header: disabled with no dated tasks, shows dated count, transient "Downloaded!" feedback; icon-only on small screens.
- Every dated task row gains compact Google and Outlook quick-add links in a new tab; undated tasks show none.
- Tests: 11 utility tests + 2 button tests + 2 TodoItem link tests + 1 App header test (69 total).
- Verification: 69/69 tests pass (13 files), `tsc -b && vite build` clean. Live browser: 6 dated todos produced correct Google/Outlook URLs; captured bulk download blob is `text/calendar`, 1281 bytes, 6 VEVENTs, CRLF endings, wrapper intact, 2 completed statuses; screenshot reviewed at 1319×904 with no horizontal overflow.
- Committed as 2cc3345.
