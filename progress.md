# Progress

- Created `progress.md` to track current workspace updates.
- Added repository changes and new documentation files.
- Pushed latest commit to `origin main`.
## Step 3 - Attendance (done)
- Table: attendance (school_id, student_id, date, status, unique constraint on student+date)
- RLS written correctly from the start this time - no repeat of the Step 2 recursion bug
- Tested live: mark present/absent, updates instead of duplicating, confirmed in Supabase directly

## Lesson learned
RLS bug in Step 2 wasn't in the students policy - it was staff/schools tables
having RLS enabled with zero policies, silently blocking every subquery that
touched them. Check RLS on every table a policy depends on, not just the one
you're debugging.

## Next
Baaz Grammar School said fees isn't a priority. They asked for something else -
need to get their exact words down before building it, not a paraphrase.
# Progress

- Created `progress.md` to track current workspace updates.
- Added repository changes and new documentation files.
- Pushed latest commit to `origin main`.
## Step 3 - Attendance (done)
- Table: attendance (school_id, student_id, date, status, unique constraint on student+date)
- RLS written correctly from the start this time - no repeat of the Step 2 recursion bug
- Tested live: mark present/absent, updates instead of duplicating, confirmed in Supabase directly

## Lesson learned
RLS bug in Step 2 wasn't in the students policy - it was staff/schools tables
having RLS enabled with zero policies, silently blocking every subquery that
touched them. Check RLS on every table a policy depends on, not just the one
you're debugging.

## Next
Baaz Grammar School said fees isn't a priority. They asked for something else -
need to get their exact words down before building it, not a paraphrase.

## Step 5 - Classes page + class-based Attendance (done) - July 19, 2026
- Classes nav added: lists all classes with student counts, click a class to
  view its roster and mark attendance right there
- Attendance page reworked to be class-first: pick a class, its students load
  with a Present/Absent dropdown each, one "Save Attendance" button upserts
  the whole class at once (no more one-student-at-a-time dropdown)
- Both flows read the same students table (filtered by class_id) and write to
  the same attendance table, so history stays consistent either way

## Step 6 - Timetable (done) - July 19, 2026
- New table: timetable (school_id, class_id, staff_id, subject, day_of_week,
  period_number) with two unique constraints - one prevents two subjects in
  the same class/period, the other prevents a teacher being double-booked in
  two classes at the same period/day
- class_teachers was missing a DELETE policy - added, needed for reassigning
  a grade 1-3 class teacher
- Timetable nav added: grades 1-3 show a single "Class Teacher" dropdown (no
  periods, matches typical Karachi-board primary setup); grade 4+ shows a
  Monday-Friday x 7-period grid, each cell is a subject + teacher, autosaves
  on change
- Added 100 demo students (10 per class) with real Pakistani names via SQL,
  roll numbers S001-S100, properly linked to class_id
- Staffing gap identified: only 2 staff members exist right now, need ~10-12
  (3 class teachers for grades 1-3, ~7-9 subject teachers for grades 4-10)
  before the timetable can actually be filled in for real
- Confirmed: staff.id is a foreign key into auth.users(id), so every new
  teacher needs a Supabase Auth user created first, then a staff row using
  that same UUID - can't just generate a random UUID like the early demo
  teacher insert did

## Next
Add real staff (need Auth users created first, then staff rows) before the
Timetable page has anything real to show. After that: either build an
in-app "Add Staff" form, or keep doing it by hand in the Supabase dashboard.
"Staff/timetable populated with real data.