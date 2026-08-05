// Same Supabase project as the staff app (index.html) - parents and
    // staff both connect to the exact same database, just through two
    // different front-end pages with two different sets of database rules
    // (RLS policies) deciding what each of them can see.
    const supabaseClient = window.supabase.createClient(
        'https://ypiamdjdxploowjubibj.supabase.co',
        'sb_publishable_Ci3pvImXio3xZ3gk3PTsaA_wZar0bIn'
    );

    let CURRENT_SCHOOL_ID = null;
    let CURRENT_SCHOOL_NAME = '';
    let CURRENT_PARENT_NAME = '';
    let CURRENT_SHOW_RANK = true;
    let children = []; // [{id, full_name, class_id, ...}]
    let currentChildId = null;
    let attChartInstance = null;

    /*
        NEW: resolveParentContext()
        WHAT: after login, figures out who this parent is and which
        child(ren) belong to them - the parent-side equivalent of
        resolveSchoolContext() in the staff app.
        WHY we need BOTH the parent's own row AND their children: the
        parent row tells us their name and which school they belong to;
        the children list is what every other tab (Attendance, Homework,
        Fees...) is filtered by.
    */
    async function resolveParentContext() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return false;

        const { data: parentRow, error: parentError } = await supabaseClient
            .from('parents')
            .select('school_id, full_name')
            .eq('id', user.id)
            .maybeSingle();

        if (parentError || !parentRow) {
            alert('This account is not linked to a parent record. Contact the school office.');
            await supabaseClient.auth.signOut();
            return false;
        }

        CURRENT_SCHOOL_ID = parentRow.school_id;
        CURRENT_PARENT_NAME = parentRow.full_name;

        const { data: schoolRow } = await supabaseClient
            .from('schools')
            .select('name, show_rank')
            .eq('id', CURRENT_SCHOOL_ID)
            .maybeSingle();
        CURRENT_SCHOOL_NAME = schoolRow?.name || 'School';
        CURRENT_SHOW_RANK = schoolRow?.show_rank ?? true;

        const { data: childRows } = await supabaseClient
            .from('students')
            .select('id, full_name, class_id, classes(grade, section)')
            .in('id', (await supabaseClient.from('parent_students').select('student_id').eq('parent_id', user.id)).data.map(r => r.student_id));

        children = childRows || [];
        if (children.length === 0) {
            alert('No children are linked to this account yet. Contact the school office.');
            return false;
        }
        currentChildId = children[0].id;

        document.getElementById('topSchoolName').textContent = CURRENT_SCHOOL_NAME;
        document.getElementById('topParentName').textContent = `Parent: ${CURRENT_PARENT_NAME}`;
        document.title = CURRENT_SCHOOL_NAME + ' - Parent Portal';

        // Only show the child switcher if there's actually more than one -
        // no point showing a dropdown with one option in it.
        if (children.length > 1) {
            document.getElementById('childSelector').style.display = 'inline-block';
            document.getElementById('childSelector').innerHTML = children.map(c => `<option value="${c.id}">${c.full_name}</option>`).join('');
        }

        return true;
    }

    function switchChild() {
        currentChildId = document.getElementById('childSelector').value;
        loadAllTabs();
    }

    async function checkSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const ok = await resolveParentContext();
            if (ok) { showApp(); await loadAllTabs(); }
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            document.getElementById('loginMessage').className = 'login-message error';
            document.getElementById('loginMessage').textContent = error.message;
            return;
        }

        const ok = await resolveParentContext();
        if (!ok) return;
        showApp();
        await loadAllTabs();
    }

    async function handleLogout() {
        await supabaseClient.auth.signOut();
        location.reload();
    }

    function showApp() {
        document.getElementById('loginContainer').classList.add('hide');
        document.getElementById('appContainer').classList.add('show');
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-page').forEach(p => p.style.display = 'none');
        document.getElementById('tab-' + tabName).style.display = 'block';
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');

        // Only NOW - the parent genuinely opening this tab - do we mark
        // anything as read. See the big comment on loadMessagesTab() above
        // for why this can't happen during the earlier background pre-load.
        if (tabName === 'messages') {
            markMessagesRead();
        }
    }

    async function loadAllTabs() {
        await loadDashboardTab();
        await loadAttendanceTab();
        await loadHomeworkTab();
        await loadExamsTab();
        await loadFeesTab();
        await loadMessagesTab();
        await loadAnnouncementsTab();
    }

    /*
        NEW: loadDashboardTab()
        WHAT: this is the parent's landing page - a summary pulled from
        several different places at once, so a parent doesn't have to
        click through six tabs just to see "is everything okay today".
        WHY so many separate queries instead of one big one: each piece
        (attendance, homework, exams, fees, announcements, calendar) lives
        in its own table for good reasons we set up earlier - this
        function's whole job is just to ask each one a small, specific
        question and stitch the answers together into one screen.
    */
    async function loadDashboardTab() {
        const child = children.find(c => c.id === currentChildId);
        const classLabel = child.classes ? `Grade ${child.classes.grade}${child.classes.section ? '-' + child.classes.section : ''}` : 'N/A';

        // ---- Child summary + current class ----
        document.getElementById('dashChildName').textContent = child.full_name;
        document.getElementById('dashChildClass').textContent = classLabel;

        const { data: fullChild } = await supabaseClient
            .from('students')
            .select('photo_path')
            .eq('id', currentChildId)
            .maybeSingle();

        const photoImg = document.getElementById('dashChildPhoto');
        const photoFallback = document.getElementById('dashChildPhotoFallback');
        photoImg.style.display = 'none';
        photoFallback.style.display = 'flex';
        if (fullChild?.photo_path) {
            const { data: signed } = await supabaseClient.storage.from('student-photos').createSignedUrl(fullChild.photo_path, 3600);
            if (signed?.signedUrl) {
                photoImg.src = signed.signedUrl;
                photoImg.style.display = 'inline-block';
                photoFallback.style.display = 'none';
            }
        }

        // ---- Today's attendance ----
        const { data: todayAtt } = await supabaseClient
            .from('attendance')
            .select('status')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .eq('date', new Date().toISOString().split('T')[0])
            .maybeSingle();

        const attEl = document.getElementById('dashTodayAttendance');
        if (!todayAtt) {
            attEl.innerHTML = '<span class="badge badge-neutral">Not marked yet</span>';
        } else if (todayAtt.status === 'present') {
            attEl.innerHTML = '<span class="badge badge-success"><i class="fas fa-check"></i> Present</span>';
        } else {
            attEl.innerHTML = '<span class="badge badge-danger"><i class="fas fa-xmark"></i> Absent</span>';
        }

        // ---- Homework due today ----
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: dueTodayHw } = await supabaseClient
            .from('homework')
            .select('title, subject')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('class_id', child.class_id)
            .eq('due_date', todayStr);

        document.getElementById('dashHomeworkToday').innerHTML = (dueTodayHw && dueTodayHw.length > 0)
            ? dueTodayHw.map(h => `
                <div class="feed-row">
                    <div class="feed-icon"><i class="fas fa-book"></i></div>
                    <div class="feed-text"><strong>${h.title}</strong>${h.subject ? '<div class="feed-sub">' + h.subject + '</div>' : ''}</div>
                </div>
            `).join('')
            : '<p class="empty-state"><i class="fas fa-circle-check" style="color: var(--success); margin-right: 6px;"></i>Nothing due today</p>';

        // ---- Upcoming exams ----
        // "Upcoming" here means: exams for this class that don't have any
        // marks entered for THIS child yet. There's no exam date field in
        // the schema (exams only track term/year, not a specific day), so
        // this is the closest honest proxy: not yet graded = presumably
        // not yet happened, or at least not yet finished.
        const { data: allExams } = await supabaseClient
            .from('exams')
            .select('id, name, term')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('class_id', child.class_id);

        const upcomingExams = [];
        for (const ex of (allExams || [])) {
            const { count } = await supabaseClient
                .from('exam_results')
                .select('id', { count: 'exact', head: true })
                .eq('exam_id', ex.id)
                .eq('student_id', currentChildId);
            if (!count || count === 0) upcomingExams.push(ex);
        }

        document.getElementById('dashUpcomingExams').innerHTML = upcomingExams.length > 0
            ? upcomingExams.map(ex => `
                <div class="feed-row">
                    <div class="feed-icon"><i class="fas fa-file-lines"></i></div>
                    <div class="feed-text">${ex.name}<div class="feed-sub">${ex.term}</div></div>
                </div>
            `).join('')
            : '<p class="empty-state">No upcoming exams - all graded, or none scheduled</p>';

        // ---- Fee due ----
        const { data: unpaidInvoices } = await supabaseClient
            .from('fee_invoices')
            .select('month, amount_due')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .eq('paid', false);

        const feeDueEl = document.getElementById('dashFeeDue');
        if (unpaidInvoices && unpaidInvoices.length > 0) {
            const totalDue = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0);
            feeDueEl.innerHTML = `<span style="color: var(--danger);">${totalDue}</span> <span style="font-size: 12px; font-weight: 500; color: var(--text-light);">(${unpaidInvoices.length} month${unpaidInvoices.length > 1 ? 's' : ''})</span>`;
        } else {
            feeDueEl.innerHTML = '<span style="color: var(--success);">All paid</span>';
        }

        // ---- Unread messages count ----
        const { count: unreadCount } = await supabaseClient
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .eq('sender_role', 'staff')
            .is('read_at', null);

        document.getElementById('dashUnreadCount').innerHTML = `<span style="color: ${(unreadCount && unreadCount > 0) ? 'var(--danger)' : 'var(--success)'};">${unreadCount || 0}</span>`;

        // ---- School calendar highlights ----
        const { data: events } = await supabaseClient
            .from('school_events')
            .select('title, event_date')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .gte('event_date', todayStr)
            .order('event_date', { ascending: true })
            .limit(5);

        document.getElementById('dashCalendar').innerHTML = (events && events.length > 0)
            ? events.map(e => `
                <div class="feed-row">
                    <div class="feed-icon"><i class="fas fa-calendar-day"></i></div>
                    <div class="feed-text">${e.title}<div class="feed-sub">${e.event_date}</div></div>
                </div>
            `).join('')
            : '<p class="empty-state">No upcoming events</p>';

        // ---- Recent announcements (just the latest 3, full list is its own tab) ----
        const { data: recentAnnouncements } = await supabaseClient
            .from('announcements')
            .select('title, created_at')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .order('created_at', { ascending: false })
            .limit(3);

        document.getElementById('dashAnnouncements').innerHTML = (recentAnnouncements && recentAnnouncements.length > 0)
            ? recentAnnouncements.map(a => `
                <div class="feed-row">
                    <div class="feed-icon"><i class="fas fa-bullhorn"></i></div>
                    <div class="feed-text">${a.title}<div class="feed-sub">${new Date(a.created_at).toLocaleDateString()}</div></div>
                </div>
            `).join('')
            : '<p class="empty-state">No announcements yet</p>';

        // ---- Latest notifications: a merged, time-sorted feed ----
        // WHY merge three different kinds of things into one list: a real
        // "notifications" feed is supposed to answer "what's new" in ONE
        // place, not make you check three separate tabs to find out. Each
        // item gets a "kind" and its own timestamp, then everything gets
        // sorted together by how recent it is.
        const notifications = [];
        if (unreadCount > 0) notifications.push({ time: new Date(), text: `You have ${unreadCount} unread message(s) from the school`, icon: 'fas fa-comment' });
        if (dueTodayHw && dueTodayHw.length > 0) notifications.push({ time: new Date(), text: `${dueTodayHw.length} homework item(s) due today`, icon: 'fas fa-book' });
        (recentAnnouncements || []).slice(0, 2).forEach(a => notifications.push({ time: new Date(a.created_at), text: `New announcement: ${a.title}`, icon: 'fas fa-bullhorn' }));

        notifications.sort((a, b) => b.time - a.time);

        document.getElementById('dashNotifications').innerHTML = notifications.length > 0
            ? notifications.map(n => `
                <div class="feed-row">
                    <div class="feed-icon"><i class="${n.icon}"></i></div>
                    <div class="feed-text">${n.text}</div>
                </div>
            `).join('')
            : '<p class="empty-state">Nothing new right now</p>';
    }

    // ---- Attendance ----
    async function loadAttendanceTab() {
        const { data } = await supabaseClient
            .from('attendance')
            .select('status')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId);

        const rows = data || [];
        const present = rows.filter(r => r.status === 'present').length;
        const absent = rows.filter(r => r.status === 'absent').length;
        const pct = rows.length > 0 ? ((present / rows.length) * 100).toFixed(1) : '0.0';
        document.getElementById('attSummary').textContent = rows.length > 0
            ? `${pct}% present (${present} present, ${absent} absent, ${rows.length} days total)`
            : 'No attendance recorded yet';

        if (attChartInstance) attChartInstance.destroy();
        attChartInstance = new Chart(document.getElementById('attChart'), {
            type: 'doughnut',
            data: { labels: ['Present', 'Absent'], datasets: [{ data: [present, absent], backgroundColor: ['#166534', '#991b1b'] }] },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    }

    // ---- Homework ----
    async function loadHomeworkTab() {
        const child = children.find(c => c.id === currentChildId);
        const { data } = await supabaseClient
            .from('homework')
            .select('id, title, subject, due_date')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('class_id', child.class_id)
            .order('due_date', { ascending: false });

        const assignments = data || [];
        if (assignments.length === 0) {
            document.getElementById('homeworkList').innerHTML = '<tr><td colspan="6" class="empty-state">No homework yet</td></tr>';
            return;
        }

        // For each assignment, also fetch THIS child's own submission row -
        // parents only see their own child's status/marks/feedback, never
        // the whole class's.
        const rows = await Promise.all(assignments.map(async hw => {
            const { data: sub } = await supabaseClient
                .from('homework_submissions')
                .select('status, marks_obtained, feedback')
                .eq('homework_id', hw.id)
                .eq('student_id', currentChildId)
                .maybeSingle();
            return { hw, sub };
        }));

        document.getElementById('homeworkList').innerHTML = rows.map(({ hw, sub }) => {
            const status = sub?.status || 'pending';
            const statusBadge = status === 'submitted' ? '<span class="badge badge-success">Submitted</span>'
                : status === 'late' ? '<span class="badge badge-warning">Late</span>'
                : '<span class="badge badge-neutral">Pending</span>';
            return `
                <tr>
                    <td>${hw.title}</td>
                    <td>${hw.subject || 'N/A'}</td>
                    <td>${hw.due_date}</td>
                    <td>${statusBadge}</td>
                    <td>${sub?.marks_obtained ?? 'N/A'}</td>
                    <td>${sub?.feedback || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    }

    // ---- Exams / report cards ----
    async function loadExamsTab() {
        // NEW: this used to look up exams by the child's CURRENT class,
        // which silently lost every previous year's exam once a child got
        // promoted (promotion changes class_id, so the old class's exams
        // stopped matching). This now looks up exams through the child's
        // OWN exam_results instead - which stay attached to the child
        // forever, no matter how many times they get promoted.
        const { data: resultRows } = await supabaseClient
            .from('exam_results')
            .select('exam_id, exams(id, name, term, academic_year, classes(grade, section))')
            .eq('student_id', currentChildId);

        // exam_results has one row PER SUBJECT, so the same exam shows up
        // several times here - this collapses it down to one entry per exam.
        const examsMap = {};
        (resultRows || []).forEach(r => { if (r.exams) examsMap[r.exam_id] = r.exams; });
        const allExams = Object.values(examsMap);

        const years = [...new Set(allExams.map(e => e.academic_year))].sort().reverse();
        const yearSelect = document.getElementById('examsYearFilter');
        const previousSelection = yearSelect.value;

        if (years.length === 0) {
            yearSelect.innerHTML = '<option value="">No results yet</option>';
            document.getElementById('examsList').innerHTML = '<tr><td colspan="4" class="empty-state">No exam results recorded yet</td></tr>';
            return;
        }

        yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
        // Keep whatever year was already selected if it's still valid for
        // this child (e.g. switching between siblings), otherwise default
        // to the most recent year - most parents want THIS year first.
        yearSelect.value = years.includes(previousSelection) ? previousSelection : years[0];

        const exams = allExams
            .filter(e => e.academic_year === yearSelect.value)
            .sort((a, b) => (a.term || '').localeCompare(b.term || ''));

        if (exams.length === 0) {
            document.getElementById('examsList').innerHTML = '<tr><td colspan="4" class="empty-state">No exams for this year</td></tr>';
            return;
        }

        document.getElementById('examsList').innerHTML = exams.map(ex => {
            const classLabel = ex.classes ? `Grade ${ex.classes.grade}${ex.classes.section ? '-' + ex.classes.section : ''}` : 'N/A';
            return `
                <tr>
                    <td>${ex.name}</td>
                    <td>${ex.term}</td>
                    <td>${classLabel}</td>
                    <td><button class="btn btn-primary" onclick="viewReportCard('${ex.id}', '${ex.name.replace(/'/g, "\\'")}', '${ex.term}')">View Report Card</button></td>
                </tr>
            `;
        }).join('');
    }

    // Same letter-grade bands used on the staff side, kept consistent so a
    // report card means the same thing wherever it's printed from.
    function gradeFor(percentage) {
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    // Turns a percentage into a 4.0-scale grade point, matching the same
    // A/B/C/D/F bands as gradeFor() - so a GPA of 4.0 always means "all A's".
    function gradePointFor(percentage) {
        if (percentage >= 80) return 4.0;
        if (percentage >= 70) return 3.0;
        if (percentage >= 60) return 2.0;
        if (percentage >= 50) return 1.0;
        return 0.0;
    }

    // Read-only version of the staff report card - same idea (subjects,
    // total, percentage, grade, rank), but no editing, no remarks box
    // (parents can only VIEW remarks the teacher already wrote, not add
    // their own).
    async function viewReportCard(examId, examName, term) {
        const child = children.find(c => c.id === currentChildId);
        const [resultsRes, remarksRes, rankRes] = await Promise.all([
            supabaseClient.from('exam_results').select('subject, marks_obtained, total_marks').eq('exam_id', examId).eq('student_id', currentChildId),
            supabaseClient.from('exam_remarks').select('remarks').eq('exam_id', examId).eq('student_id', currentChildId).maybeSingle(),
            // NEW: rank comes from the database function, never from raw
            // data fetched here - see exam_rank_function.sql for why.
            supabaseClient.rpc('get_exam_rank', { p_exam_id: examId, p_student_id: currentChildId })
        ]);

        const results = resultsRes.data || [];
        if (results.length === 0) {
            alert('No marks recorded for this exam yet.');
            return;
        }

        const totalObtained = results.reduce((s, r) => s + Number(r.marks_obtained), 0);
        const totalMax = results.reduce((s, r) => s + Number(r.total_marks), 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100) : 0;
        const grade = gradeFor(percentage);

        // NEW: GPA - average the grade POINT of each individual subject
        // (not just one grade point for the overall percentage), which is
        // the standard way GPA works: each subject counts on its own,
        // then they're averaged together.
        const gpa = (results.reduce((sum, r) => {
            const subjectPct = Number(r.total_marks) > 0 ? (Number(r.marks_obtained) / Number(r.total_marks)) * 100 : 0;
            return sum + gradePointFor(subjectPct);
        }, 0) / results.length).toFixed(2);

        // Rank: "(if enabled)" in practice means "if it could be computed" -
        // if the database function returned nothing (e.g. an error, or this
        // exam somehow has only one student), we just don't show a rank
        // line instead of showing a broken one.
        const rankRow = (rankRes.data && rankRes.data.length > 0)
            ? `<p style="margin-top: 8px;">Rank: ${rankRes.data[0].student_rank} of ${rankRes.data[0].total_students}</p>`
            : '';

        document.getElementById('printContent').innerHTML = `
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px;">
                <h2>${CURRENT_SCHOOL_NAME}</h2>
                <p>${examName} (${term})</p>
                <p style="font-weight: 600;">${child.full_name}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="border-bottom: 2px solid #333;"><th style="text-align:left; padding:8px;">Subject</th><th style="text-align:right; padding:8px;">Marks</th><th style="text-align:right; padding:8px;">Total</th></tr></thead>
                <tbody>${results.map(r => `<tr><td style="padding:8px;">${r.subject}</td><td style="text-align:right; padding:8px;">${r.marks_obtained}</td><td style="text-align:right; padding:8px;">${r.total_marks}</td></tr>`).join('')}</tbody>
            </table>
            <p style="margin-top: 16px; font-size: 18px; font-weight: 700;">Total: ${totalObtained}/${totalMax} (${percentage.toFixed(1)}%) &nbsp;|&nbsp; Grade: ${grade} &nbsp;|&nbsp; GPA: ${gpa}</p>
            ${rankRow}
            <p style="margin-top: 8px;">Remarks: ${remarksRes.data?.remarks || 'None'}</p>
        `;
        document.getElementById('printOverlay').style.display = 'block';
    }

    // ---- Fees ----
    async function loadFeesTab() {
        const { data } = await supabaseClient
            .from('fee_invoices')
            .select('month, amount_due, paid')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .order('created_at', { ascending: false });

        const invoices = data || [];
        if (invoices.length === 0) {
            document.getElementById('feesList').innerHTML = '<tr><td colspan="3" class="empty-state">No fee records yet</td></tr>';
            return;
        }

        document.getElementById('feesList').innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.month}</td>
                <td>${inv.amount_due}</td>
                <td>${inv.paid ? '<span class="badge badge-success"><i class="fas fa-check"></i> Paid</span>' : '<span class="badge badge-danger"><i class="fas fa-xmark"></i> Unpaid</span>'}</td>
            </tr>
        `).join('');
    }

    // ---- Messages ----
    /*
        NEW: loadMessagesTab() only RENDERS the conversation - it does NOT
        mark anything as read. WHY that split matters: this function also
        gets called automatically in the background right after login (see
        loadAllTabs below), to make every tab feel instant when clicked.
        If it marked messages read just for being LOADED (not actually
        looked at), the red "unread" highlight would vanish before the
        parent ever saw it - the whole feature would be pointless. Marking
        as read only happens in markMessagesRead(), called separately, only
        when the parent actually clicks the Messages tab (see switchTab()
        further down).
    */
    async function loadMessagesTab() {
        const { data } = await supabaseClient
            .from('messages')
            .select('id, sender_role, body, created_at, read_at')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .order('created_at', { ascending: true });

        const messages = data || [];
        if (messages.length === 0) {
            document.getElementById('messageThread').innerHTML = '<p class="empty-state">No messages yet</p>';
            return;
        }

        // An unread teacher message (one the parent hasn't opened this
        // thread to see yet) gets a red left border, same idea as the staff
        // side's unread highlighting.
        document.getElementById('messageThread').innerHTML = messages.map(m => {
            const isUnread = m.sender_role === 'staff' && !m.read_at;
            return `
            <div style="display: flex; justify-content: ${m.sender_role === 'parent' ? 'flex-end' : 'flex-start'}; margin-bottom: 10px;">
                <div style="max-width: 70%; background: ${m.sender_role === 'parent' ? '#e0f2fe' : '#f1f5f9'}; padding: 10px 14px; border-radius: 10px; ${isUnread ? 'border-left: 4px solid #dc2626;' : ''}">
                    <p style="margin: 0; font-size: 0.75rem; color: var(--text-light); text-transform: capitalize;">${m.sender_role === 'parent' ? 'You' : 'Teacher'}${isUnread ? ' - NEW' : ''}</p>
                    <p style="margin: 4px 0 0 0;">${m.body}</p>
                </div>
            </div>
        `;
        }).join('');
    }

    // NEW: the actual "mark as read" step - only called from switchTab()
    // when the parent genuinely opens the Messages tab.
    async function markMessagesRead() {
        const { data } = await supabaseClient
            .from('messages')
            .select('id')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('student_id', currentChildId)
            .eq('sender_role', 'staff')
            .is('read_at', null);

        const unreadIds = (data || []).map(m => m.id);
        if (unreadIds.length > 0) {
            await supabaseClient.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
            await loadMessagesTab(); // re-render so the red highlight actually clears
            await updateParentUnreadBadge();
        }
    }

    // NEW: counts unread teacher messages across ALL of this parent's
    // children (not just whichever one is currently selected), since the
    // badge on the tab button should reflect everything, not just the
    // currently-viewed child.
    async function updateParentUnreadBadge() {
        const childIds = children.map(c => c.id);
        const { count } = await supabaseClient
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', CURRENT_SCHOOL_ID)
            .in('student_id', childIds)
            .eq('sender_role', 'staff')
            .is('read_at', null);

        const badge = document.getElementById('parentUnreadBadge');
        if (count && count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    async function sendParentMessage() {
        const body = document.getElementById('newMessageBody').value.trim();
        if (!body) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        const { error } = await supabaseClient.from('messages').insert({
            school_id: CURRENT_SCHOOL_ID,
            student_id: currentChildId,
            sender_role: 'parent',
            sender_id: user.id,
            body: body
        });

        if (error) {
            alert('Error sending message: ' + error.message);
            return;
        }

        document.getElementById('newMessageBody').value = '';
        await loadMessagesTab();
    }

    // ---- Announcements ----
    async function loadAnnouncementsTab() {
        const { data } = await supabaseClient
            .from('announcements')
            .select('title, body, created_at')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .order('created_at', { ascending: false });

        const announcements = data || [];
        if (announcements.length === 0) {
            document.getElementById('announcementsList').innerHTML = '<p class="empty-state">No announcements yet</p>';
            return;
        }

        document.getElementById('announcementsList').innerHTML = announcements.map(a => `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <p style="font-weight: 600;">${a.title}</p>
                <p style="color: var(--text-light); font-size: 13px;">${new Date(a.created_at).toLocaleDateString()}</p>
                <p style="margin-top: 6px;">${a.body}</p>
            </div>
        `).join('');
    }

    checkSession();