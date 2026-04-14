import { useState, useEffect } from 'react';
import { api } from '../api';
import { totalDone, totalLessons, pct, tagCls, MODULES } from '../constants';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import TeacherCard from '../components/TeacherCard';
import GroupRow from '../components/GroupRow';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminTeachers({ token, onLogout }) {
    const [teachers, setTeachers] = useState(null);
    const [allGroups, setAllGroups] = useState(null);
    const [sortBy, setSortBy] = useState('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('All');
    const showToast = useToast();

    // Teacher modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tmName, setTmName] = useState('');
    const [tmUsername, setTmUsername] = useState('');
    const [tmPass, setTmPass] = useState('');
    const [tmSubjects, setTmSubjects] = useState(['', '']);
    const [tmError, setTmError] = useState(false);
    const [tmLoading, setTmLoading] = useState(false);

    // Delete confirm
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Schedule view
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleTeacher, setScheduleTeacher] = useState(null);

    useEffect(() => { loadData(); }, []);

    function openSchedule(teacher) {
        setScheduleTeacher(teacher);
        setScheduleOpen(true);
    }

    async function loadData() {
        try {
            setTeachers(null); setAllGroups(null);
            const [t, g] = await Promise.all([
                api('GET', '/api/teachers', null, token, onLogout),
                api('GET', '/api/groups', null, token, onLogout),
            ]);
            setTeachers(t);
            setAllGroups(g);
        } catch (err) {
            setTeachers([]); setAllGroups([]);
            showToast(err.message, true);
        }
    }

    function openCreate() {
        setEditingId(null); setTmName(''); setTmUsername(''); setTmPass(''); setTmSubjects(['', '']);
        setTmError(false); setModalOpen(true);
    }

    function openEdit(teacher) {
        setEditingId(teacher.id);
        const subs = Array.isArray(teacher.subject) ? teacher.subject : [teacher.subject];
        setTmName(teacher.name); setTmUsername(teacher.username); setTmPass('');
        setTmSubjects([subs[0] || '', subs[1] || '']);
        setTmError(false); setModalOpen(true);
    }

    function handleNameChange(e) {
        let val = e.target.value;
        if (val.length > 32) {
            showToast('Teacher name cannot exceed 32 characters', true);
            val = val.substring(0, 32);
        }
        setTmName(val);
    }

    function closeModal() { setModalOpen(false); setEditingId(null); }

    async function handleSubmit() {
        const subjects = tmSubjects.filter(Boolean);
        if (!tmName.trim() || !tmUsername.trim() || !subjects.length) {
            showToast('Please fill in all fields', true); return;
        }
        if (!editingId && !tmPass) {
            showToast('Password is required for new accounts', true); return;
        }
        setTmError(false); setTmLoading(true);
        try {
            if (editingId) {
                const body = { name: tmName.trim(), username: tmUsername.trim(), subject: subjects };
                if (tmPass) body.password = tmPass;
                await api('PUT', '/api/teachers/' + editingId, body, token, onLogout);
                showToast('Teacher account updated');
            } else {
                await api('POST', '/api/teachers', {
                    name: tmName.trim(), username: tmUsername.trim(), password: tmPass, subject: subjects,
                }, token, onLogout);
                showToast('Teacher account created');
            }
            closeModal();
            loadData();
        } catch (err) {
            if (err.message?.toLowerCase().includes('taken') || err.message?.toLowerCase().includes('exists')) {
                setTmError(true);
            } else {
                showToast(err.message, true);
            }
        } finally {
            setTmLoading(false);
        }
    }

    function handleDeleteClick(teacher, groupCount) {
        setPendingDeleteId(teacher.id);
        setConfirmMsg(
            'Delete <strong>' + teacher.name + '</strong>?' +
            (groupCount ? ' This will also remove their <strong>' + groupCount + ' group' + (groupCount > 1 ? 's' : '') + '</strong>.' : '') +
            ' This cannot be undone.'
        );
        setConfirmOpen(true);
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await api('DELETE', '/api/teachers/' + pendingDeleteId, null, token, onLogout);
            setConfirmOpen(false); setPendingDeleteId(null);
            loadData();
            showToast('Teacher account deleted');
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setDeleting(false);
        }
    }

    const loading = teachers === null || allGroups === null;

    const sortedTeachers = [...(teachers || [])]
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.username.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(t => filterSubject === 'All' || (Array.isArray(t.subject) ? t.subject.includes(filterSubject) : t.subject === filterSubject))
        .sort((a, b) => {
            if (sortBy === 'default') return 0;

            const mgA = (allGroups || []).filter(g => g.tid === a.id);
            const tsA = mgA.reduce((acc, g) => acc + g.students, 0);

            const mgB = (allGroups || []).filter(g => g.tid === b.id);
            const tsB = mgB.reduce((acc, g) => acc + g.students, 0);

            if (sortBy === 'groups-asc') return mgA.length - mgB.length;
            if (sortBy === 'groups-desc') return mgB.length - mgA.length;
            if (sortBy === 'students-asc') return tsA - tsB;
            if (sortBy === 'students-desc') return tsB - tsA;

            return 0;
        });

    return (
        <div className="panel-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <span className="slabel" style={{ margin: 0 }}>All Teachers</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        className="f-input"
                        style={{ padding: '8px 16px', width: '200px', margin: 0, height: '36px', fontSize: '13px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select className="f-select" style={{ width: 'auto', padding: '8px 30px 8px 16px', fontSize: '13px' }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                        <option value="All">All Specializations</option>
                        {Object.keys(MODULES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select className="f-select" style={{ width: 'auto', padding: '8px 30px 8px 16px', fontSize: '13px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="default">Sort: Default</option>
                        <option value="groups-asc">Groups: Min to Max</option>
                        <option value="groups-desc">Groups: Max to Min</option>
                        <option value="students-asc">Students: Min to Max</option>
                        <option value="students-desc">Students: Max to Min</option>
                    </select>
                    <button className="add-btn" onClick={openCreate} style={{ margin: 0 }}>
                        <span className="add-icon">+</span>Create
                    </button>
                </div>
            </div>

            <div className="teachers-grid">
                {loading ? <Skeleton /> : !sortedTeachers.length ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-line">NO TEACHERS</div>
                        <p>Create your first teacher account above.</p>
                    </div>
                ) : sortedTeachers.map((t, i) => (
                    <TeacherCard
                        key={t.id} teacher={t} index={i}
                        groups={(allGroups || []).filter((g) => g.tid === t.id)}
                        onEdit={openEdit} onDelete={handleDeleteClick} onViewSchedule={openSchedule}
                    />
                ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0 40px' }}></div>
            <span className="slabel">Groups by Teacher</span>

            {loading ? <Skeleton /> : (sortedTeachers || []).map((t, i) => {
                const mg = (allGroups || []).filter((g) => g.tid === t.id);
                const ts = mg.reduce((a, g) => a + g.students, 0);
                const ap = mg.length ? Math.round(mg.reduce((a, g) => a + pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang)), 0) / mg.length) : 0;
                const langBreak = [...new Set(mg.map((g) => g.lang))];

                return (
                    <div key={t.id} style={{ marginBottom: '44px', animation: 'fadeU .4s ' + (i * 0.07) + 's ease both' }}>
                        <div className="tg-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div className="tg-avatar">{t.name.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--white)' }}>{t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--fm)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        @{t.username}
                                        &nbsp;·&nbsp;
                                        {(Array.isArray(t.subject) ? t.subject : [t.subject]).map(s => (
                                            <span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--fm)', background: 'rgba(245,197,24,.12)', color: 'var(--yellow)', border: '1px solid rgba(245,197,24,.25)' }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {langBreak.map((l) => <span key={l} className={'tag tag-' + tagCls(l)} style={{ fontSize: '10px' }}>{l}</span>)}
                                </div>
                                <div className="tg-meta-pills">
                                    <span className="tg-pill">{mg.length} group{mg.length !== 1 ? 's' : ''}</span>
                                    <span className="tg-pill">{ts} students</span>
                                    <span className="tg-pill tg-pill-y">{ap}% avg</span>
                                </div>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead><tr><th>Group</th><th>Language</th><th>Level</th><th>Time</th><th>Schedule</th><th>Start</th><th>Exam</th><th>Students</th><th>Done</th><th>Progress</th></tr></thead>
                                <tbody>
                                    {mg.length ? mg.map((g) => <GroupRow key={g.id} group={g} />) : (
                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--gray)', fontFamily: 'var(--fm)', fontSize: '13px' }}>No groups yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {/* Teacher Create/Edit Modal */}
            <Modal open={modalOpen} onClose={closeModal} className="" style={{ maxWidth: '480px' }}>
                <div className="modal-hd">
                    <div>
                        <div className="modal-title">{editingId ? 'Edit Teacher Account' : 'Create Teacher Account'}</div>
                        <div className="modal-sub">{editingId ? 'Update credentials or specialization' : 'Set up login credentials and specialization'}</div>
                    </div>
                    <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="f-group">
                    <label className="f-label">Full Name</label>
                    <input className="f-input" type="text" placeholder="e.g. Alisher Nazarov" value={tmName} onChange={handleNameChange} />
                </div>
                <div className="f-group">
                    <label className="f-label">Username</label>
                    <input className="f-input" type="text" placeholder="e.g. alisher.n" autoComplete="off" value={tmUsername} onChange={(e) => setTmUsername(e.target.value)} />
                    <div className={'f-error' + (tmError ? ' show' : '')}>Username already exists.</div>
                </div>
                <div className="f-group">
                    <label className="f-label">Password</label>
                    <input className="f-input" type="password" placeholder={editingId ? 'Leave blank to keep current' : '••••••••'} value={tmPass} onChange={(e) => setTmPass(e.target.value)} />
                </div>
                <div className="f-group">
                    <label className="f-label">Specialization 1 <span style={{ color: 'var(--red)' }}>*</span></label>
                    <select className="f-select" value={tmSubjects[0]} onChange={(e) => setTmSubjects([e.target.value, tmSubjects[1] === e.target.value ? '' : tmSubjects[1]])}>
                        <option value="">Select specialization</option>
                        {Object.keys(MODULES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {tmSubjects[0] && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--fm)' }}>
                            Courses: {(MODULES[tmSubjects[0]] || []).join(' · ')}
                        </div>
                    )}
                </div>
                <div className="f-group">
                    <label className="f-label">Specialization 2 <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: '10px', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <select className="f-select" value={tmSubjects[1]} onChange={(e) => setTmSubjects([tmSubjects[0], e.target.value])} disabled={!tmSubjects[0]}>
                        <option value="">None</option>
                        {Object.keys(MODULES).filter(cat => cat !== tmSubjects[0]).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {tmSubjects[1] && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--fm)' }}>
                            Courses: {(MODULES[tmSubjects[1]] || []).join(' · ')}
                        </div>
                    )}
                </div>
                <div className="modal-actions">
                    <button className="btn-submit" onClick={handleSubmit} disabled={tmLoading}>
                        {tmLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Account'}
                    </button>
                    <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                </div>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmModal
                open={confirmOpen}
                onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
                onConfirm={handleDelete}
                message={confirmMsg}
                loading={deleting}
            />

            {/* View Schedule Modal */}
            {scheduleTeacher && (
                <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} className="" style={{ maxWidth: '640px' }}>
                    <div className="modal-hd">
                        <div>
                            <div className="modal-title">{scheduleTeacher.name}'s Schedule</div>
                            <div className="modal-sub">Odd and Even Days Availability</div>
                        </div>
                        <button className="modal-close" onClick={() => setScheduleOpen(false)}>×</button>
                    </div>
                    {(() => {
                        const subs = Array.isArray(scheduleTeacher.subject) ? scheduleTeacher.subject : [scheduleTeacher.subject];
                        const isStrictlyItKids = subs.length > 0 && subs.every(s => s === 'IT Kids');
                        const slots = [];
                        let currentMin = 8 * 60;
                        const intervalMin = isStrictlyItKids ? 90 : 120;
                        while (currentMin + intervalMin <= 20 * 60) {
                            const h1 = String(Math.floor(currentMin / 60)).padStart(2, '0');
                            const m1 = String(currentMin % 60).padStart(2, '0');
                            const nextMin = currentMin + intervalMin;
                            const h2 = String(Math.floor(nextMin / 60)).padStart(2, '0');
                            const m2 = String(nextMin % 60).padStart(2, '0');
                            slots.push(`${h1}:${m1}-${h2}:${m2}`);
                            currentMin = nextMin;
                        }

                        const tGroups = (allGroups || []).filter(g => g.tid === scheduleTeacher.id);
                        const oddGroups = tGroups.filter(g => g.days === 'Odd Days' || g.days === 'Every Day');
                        const evenGroups = tGroups.filter(g => g.days === 'Even Days' || g.days === 'Every Day');

                        const isOverlapping = (slotStr, gStart, gEnd) => {
                            if (!gStart || !gEnd) return false;
                            const [s1, e1] = slotStr.split('-');
                            const toMins = t => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };
                            return toMins(s1) < toMins(gEnd) && toMins(gStart) < toMins(e1);
                        };

                        const avail = scheduleTeacher.availability || { oddDays: {}, evenDays: {} };

                        const getStatus = (dayType, slot) => {
                            const dayGroups = dayType === 'odd' ? oddGroups : evenGroups;
                            if (dayGroups.some(g => isOverlapping(slot, g.startTime, g.endTime))) return 'Lesson';
                            return avail[dayType === 'odd' ? 'oddDays' : 'evenDays']?.[slot] || 'Unset';
                        };

                        const renderStatus = status => {
                            if (status === 'Lesson') return <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', padding: '2px 8px', background: 'rgba(244,67,54,0.1)', borderRadius: '4px' }}>Lesson</span>;
                            if (status === 'Free') return <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', padding: '2px 8px', background: 'rgba(76,175,80,0.1)', borderRadius: '4px' }}>Free</span>;
                            if (status === 'Busy') return <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Busy</span>;
                            return <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', opacity: 0.5 }}>Unset</span>;
                        };

                        return (
                            <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                                <div className="schedule-col">
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--white)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Odd Days</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {slots.map(slot => (
                                            <div key={slot} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--darker)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: '12px', fontFamily: 'var(--fm)', color: 'var(--gray)' }}>{slot}</span>
                                                {renderStatus(getStatus('odd', slot))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="schedule-col">
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--white)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Even Days</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {slots.map(slot => (
                                            <div key={slot} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--darker)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: '12px', fontFamily: 'var(--fm)', color: 'var(--gray)' }}>{slot}</span>
                                                {renderStatus(getStatus('even', slot))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Modal>
            )}
        </div>
    );
}
