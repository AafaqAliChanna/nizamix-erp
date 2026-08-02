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
            .select('name')
            .eq('id', CURRENT_SCHOOL_ID)
            .maybeSingle();
        CURRENT_SCHOOL_NAME = schoolRow?.name || 'School';

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
        await loadAttendanceTab();
        await loadHomeworkTab();
        await loadExamsTab();
        await loadFeesTab();
        await loadMessagesTab();
        await loadAnnouncementsTab();
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

        document.getElementById('homeworkList').innerHTML = rows.map(({ hw, sub }) => `
            <tr>
                <td>${hw.title}</td>
                <td>${hw.subject || 'N/A'}</td>
                <td>${hw.due_date}</td>
                <td>${sub?.status || 'pending'}</td>
                <td>${sub?.marks_obtained ?? 'N/A'}</td>
                <td>${sub?.feedback || 'N/A'}</td>
            </tr>
        `).join('');
    }

    // ---- Exams / report cards ----
    async function loadExamsTab() {
        const child = children.find(c => c.id === currentChildId);
        const { data } = await supabaseClient
            .from('exams')
            .select('id, name, term, academic_year')
            .eq('school_id', CURRENT_SCHOOL_ID)
            .eq('class_id', child.class_id)
            .order('created_at', { ascending: false });

        const exams = data || [];
        if (exams.length === 0) {
            document.getElementById('examsList').innerHTML = '<tr><td colspan="3" class="empty-state">No exams recorded yet</td></tr>';
            return;
        }

        document.getElementById('examsList').innerHTML = exams.map(ex => `
            <tr>
                <td>${ex.name}</td>
                <td>${ex.term} (${ex.academic_year})</td>
                <td><button class="btn btn-primary" onclick="viewReportCard('${ex.id}', '${ex.name.replace(/'/g, "\\'")}', '${ex.term}')">View Report Card</button></td>
            </tr>
        `).join('');
    }

    // Read-only version of the staff report card - same idea (subjects,
    // total, percentage), but no editing, no remarks box (parents can only
    // VIEW remarks the teacher already wrote, not add their own).
    async function viewReportCard(examId, examName, term) {
        const child = children.find(c => c.id === currentChildId);
        const [resultsRes, remarksRes] = await Promise.all([
            supabaseClient.from('exam_results').select('subject, marks_obtained, total_marks').eq('exam_id', examId).eq('student_id', currentChildId),
            supabaseClient.from('exam_remarks').select('remarks').eq('exam_id', examId).eq('student_id', currentChildId).maybeSingle()
        ]);

        const results = resultsRes.data || [];
        if (results.length === 0) {
            alert('No marks recorded for this exam yet.');
            return;
        }

        const totalObtained = results.reduce((s, r) => s + Number(r.marks_obtained), 0);
        const totalMax = results.reduce((s, r) => s + Number(r.total_marks), 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

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
            <p style="margin-top: 16px; font-size: 18px; font-weight: 700;">Total: ${totalObtained}/${totalMax} (${percentage}%)</p>
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
                <td style="color: ${inv.paid ? '#166534' : '#991b1b'}; font-weight: 600;">${inv.paid ? 'Paid' : 'Unpaid'}</td>
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