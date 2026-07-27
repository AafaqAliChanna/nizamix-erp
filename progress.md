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
"Staff/timetable populated with real data.# Progress

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

## Step 7 - Multi-school + timetable year fix (done)
- Removed hardcoded BAAZ_SCHOOL_ID entirely - school, staff name/role, and
  branding are now all resolved live at login from the logged-in user's own
  staff row, so the same index.html works for any school
- Tested: created a throwaway second school + login, confirmed data stayed
  isolated (RLS + branding fix both working)
- Found and fixed a real bug: timetable's unique constraints didn't include
  academic_year, so saving next year's timetable would have silently
  overwritten this year's - fixed by rebuilding both constraints to include it

## Step 8 - Exams module (done)
- New tables: exams (class + required term: Term 1/2/Final), exam_results
  (per student per subject), exam_remarks (teacher comments per student)
- Marks entry grid per class: auto-pulls subjects from Timetable for grade 4+,
  manual "Add Subject" for grades 1-3 (no timetable to pull from)
- Printable report card: subject breakdown, percentage, letter grade,
  PASS/FAIL (40% threshold), attendance % for the year, remarks box -
  grading scale and passing % are still placeholder assumptions, not
  confirmed against the school's real policy yet

## Step 9 - Roles, permissions, promotion (done)
- Real RLS-level roles: Principal sees/manages everything in the school;
  Teacher is scoped to only the classes they're assigned to - checked
  against BOTH class_teachers (grade 1-3) and timetable (grade 4+ subject
  slots), since only the first one was being used before and would have
  locked out every subject teacher
- Added missing policies that didn't exist before: staff insert/update/delete
  (Principal only), students update (didn't exist at all)
- Promotion: "Promote" button per class, moves every student to the next
  grade's class + next academic year in one confirmed action. Locked to
  Principal-only via a database trigger (not just RLS) that specifically
  blocks changing class_id/academic_year for non-Principals, while still
  letting a Teacher edit their own students' other fields normally

## Step 10 - Fees module, redesigned to paid/unpaid (done)
- fee_structure (monthly amount per class per year), fee_invoices (one per
  student per month) - Principal-only via RLS, not exposed to teachers
- Generate a month's invoices for a class at once, from that class's set fee
- Originally built with partial-amount payment tracking, then redesigned:
  bank challans are paid in full or not at all, so this is now a simple
  Mark Paid / Mark Unpaid toggle - toggling back IS the correction, no
  separate undo flow needed
- Defaulters view: school-wide (all classes) list of unpaid invoices for a
  picked month
- Printable fee receipts, same browser print-to-PDF approach as report cards

## Step 11 - Student/staff data, photos, ID cards, profiles, dashboard (done)
- Added guardian_name, guardian_email, date_of_birth, photo_path to students;
  phone, email, date_of_birth to staff (staff had none of this before)
- Student photos: private Supabase Storage bucket, scoped per school by
  folder path, signed URLs generated on demand (nothing public)
- Printable student ID cards: photo, name, class, roll, guardian, DOB
- Student profile page: doughnut chart of attendance (present/absent),
  bar chart of percentage per exam - built with Chart.js (new dependency)
- Staff profile page: editable contact info (phone/email/DOB - this is the
  only place to enter it, no separate Add/Edit Staff form exists yet), plus
  a "teaching load by class" chart (periods/week from Timetable) - NOT an
  attendance chart, since staff attendance was never built; faking that
  chart with data that doesn't exist was rejected in favor of showing real
  data instead
- Dashboard: school-wide attendance chart, fees paid/unpaid chart, a fee
  defaulter severity chart (Good / Still Have Time / Not Good / Very Bad),
  and a "numbers to call" table for the Very Bad tier (3+ unpaid invoices)
  - severity is counted by TOTAL unpaid invoices this year, not verified
  consecutive months, since fee_invoices.month is a free-text label
  ("July 2026"), not a real date column

## Next
Test the full data set together (roles + promotion + fees + photos + new
dashboard charts) in one real walkthrough, not module by module. Clean up
demo data (delete the throwaway "Test School 2" test tenant - the 100 demo
students are being kept intentionally as filler). Waiting on the principal
to confirm the real grading scale, passing percentage, and pricing before
those get finalized.