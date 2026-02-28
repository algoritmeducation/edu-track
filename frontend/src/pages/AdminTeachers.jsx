import { useState, useEffect } from 'react';
import { api } from '../api';
import { totalDone, totalLessons, pct, tagCls } from '../constants';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import TeacherCard from '../components/TeacherCard';
import GroupRow from '../components/GroupRow';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminTeachers({ token }) {
    const [teachers, setTeachers] = useState(null);
    const [allGroups, setAllGroups] = useState(null);
    const showToast = useToast();

    // Teacher modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tmName, setTmName] = useState('');
    const [tmUsername, setTmUsername] = useState('');
    const [tmPass, setTmPass] = useState('');
    const [tmSubject, setTmSubject] = useState('');
    const [tmError, setTmError] = useState(false);
    const [tmLoading, setTmLoading] = useState(false);

    // Delete confirm
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setTeachers(null); setAllGroups(null);
            const [t, g] = await Promise.all([
                api('GET', '/api/teachers', null, token),
                api('GET', '/api/groups', null, token),
            ]);
            setTeachers(t);
            setAllGroups(g);
        } catch (err) {
            setTeachers([]); setAllGroups([]);
            showToast(err.message, true);
        }
    }

    function openCreate() {
        setEditingId(null); setTmName(''); setTmUsername(''); setTmPass(''); setTmSubject('');
        setTmError(false); setModalOpen(true);
    }

    function openEdit(teacher) {
        setEditingId(teacher.id);
        setTmName(teacher.name); setTmUsername(teacher.username); setTmPass(''); setTmSubject(teacher.subject);
        setTmError(false); setModalOpen(true);
    }

    function closeModal() { setModalOpen(false); setEditingId(null); }

    async function handleSubmit() {
        if (!tmName.trim() || !tmUsername.trim() || !tmSubject.trim()) {
            showToast('Please fill in all fields', true); return;
        }
        if (!editingId && !tmPass) {
            showToast('Password is required for new accounts', true); return;
        }
        setTmError(false); setTmLoading(true);
        try {
            if (editingId) {
                const body = { name: tmName.trim(), username: tmUsername.trim(), subject: tmSubject.trim() };
                if (tmPass) body.password = tmPass;
                await api('PUT', '/api/teachers/' + editingId, body, token);
                showToast('Teacher account updated');
            } else {
                await api('POST', '/api/teachers', {
                    name: tmName.trim(), username: tmUsername.trim(), password: tmPass, subject: tmSubject.trim(),
                }, token);
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
            await api('DELETE', '/api/teachers/' + pendingDeleteId, null, token);
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

    return (
        <div className="panel-body">
            <span className="slabel">All Teachers</span>
            <button className="add-btn" onClick={openCreate}>
                <span className="add-icon">+</span>Create Teacher Account
            </button>

            <div className="teachers-grid">
                {loading ? <Skeleton /> : !teachers.length ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-line">NO TEACHERS</div>
                        <p>Create your first teacher account above.</p>
                    </div>
                ) : teachers.map((t, i) => (
                    <TeacherCard
                        key={t.id} teacher={t} index={i}
                        groups={(allGroups || []).filter((g) => g.tid === t.id)}
                        onEdit={openEdit} onDelete={handleDeleteClick}
                    />
                ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0 40px' }}></div>
            <span className="slabel">Groups by Teacher</span>

            {loading ? <Skeleton /> : (teachers || []).map((t, i) => {
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
                                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--fm)', marginTop: '2px' }}>@{t.username} &nbsp;·&nbsp; {t.subject}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                        <div className="modal-sub">{editingId ? 'Update credentials or subject' : 'Set up login credentials and subject'}</div>
                    </div>
                    <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="f-group">
                    <label className="f-label">Full Name</label>
                    <input className="f-input" type="text" maxLength="32" placeholder="e.g. Alisher Nazarov" value={tmName} onChange={(e) => setTmName(e.target.value)} />
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
                    <label className="f-label">Subject / Specialization</label>
                    <input className="f-input" type="text" placeholder="e.g. React JS" value={tmSubject} onChange={(e) => setTmSubject(e.target.value)} />
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
        </div>
    );
}
