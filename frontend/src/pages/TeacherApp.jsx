import { useState, useEffect } from 'react';
import { api } from '../api';
import { PC, LPL, VALID_LANGS } from '../constants';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import GroupCard from '../components/GroupCard';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';

export default function TeacherApp({ token, user, isLight, onToggle, onLogout }) {
    const [groups, setGroups] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const showToast = useToast();

    // Form state
    const [fName, setFName] = useState('');
    const [fLang, setFLang] = useState('');
    const [fTime, setFTime] = useState('');
    const [fStart, setFStart] = useState('');
    const [fExam, setFExam] = useState('');
    const [fStudents, setFStudents] = useState('');
    const [fDone, setFDone] = useState('0');
    const [fDays, setFDays] = useState('Every Day');
    const [selectedStage, setSelectedStage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadGroups(); }, []);

    async function loadGroups() {
        try {
            setGroups(null);
            const data = await api('GET', '/api/groups', null, token);
            setGroups(data);
        } catch (err) {
            setGroups([]);
            showToast(err.message, true);
        }
    }

    function resetForm() {
        setFName(''); setFLang(''); setFTime(''); setFStart(''); setFExam('');
        setFStudents(''); setFDone('0'); setFDays('Every Day'); setSelectedStage(null); setEditingGroup(null);
    }

    function closeModal() { setModalOpen(false); resetForm(); }

    function openEditModal(group) {
        setEditingGroup(group);
        setFName(group.group);
        setFLang(group.lang);
        setFTime(group.time);
        setFStart(group.start.split('T')[0]);
        setFExam(group.exam.split('T')[0]);
        setFStudents(String(group.students));
        setFDone(String(group.doneInLevel || 0));
        setFDays(group.days || 'Every Day');
        setSelectedStage(group.level);
        setModalOpen(true);
    }

    function handleStartDateChange(e) {
        const val = e.target.value;
        if (!val) { setFStart(''); return; }

        const date = new Date(val);
        const day = date.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat

        if (day === 0) {
            showToast('Lessons cannot start on Sunday', true);
            setFStart('');
            return;
        }

        setFStart(val);
        if ([1, 3, 5].includes(day)) setFDays('Odd Days');
        if ([2, 4, 6].includes(day)) setFDays('Even Days');
    }

    async function handleSubmit() {
        const name = fName.trim();
        if (!name || !fLang || !fTime || !fStart || !fExam || !fStudents) {
            showToast('Please fill in all required fields', true); return;
        }
        if (!selectedStage) {
            showToast('Please select the current level', true); return;
        }
        if (new Date(fExam) <= new Date(fStart)) {
            showToast('Exam date must be after start date', true); return;
        }
        const doneInLevel = parseInt(fDone) || 0;
        if (doneInLevel > LPL) {
            showToast('Max ' + LPL + ' lessons per level', true); return;
        }
        setSubmitting(true);
        try {
            const payload = {
                group: name, lang: fLang, time: fTime, start: fStart, exam: fExam,
                students: parseInt(fStudents), level: selectedStage, doneInLevel, days: fDays
            };
            if (editingGroup) {
                await api('PUT', `/api/groups/${editingGroup.id || editingGroup._id}`, payload, token);
                showToast('Group updated successfully');
            } else {
                await api('POST', '/api/groups', payload, token);
                showToast('Group added successfully');
            }
            closeModal();
            loadGroups();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setSubmitting(false);
        }
    }

    const levels = fLang ? PC[fLang]?.levels || 1 : 0;

    return (
        <div className="view active" id="v-teacher-app">
            <Navbar
                isLight={isLight} onToggle={onToggle} onLogout={onLogout}
                user={{ avatar: user.teacher.name.charAt(0), name: user.teacher.name, role: 'Teacher' }}
            />
            <div style={{ flex: 1 }}>
                <div className="panel-header">
                    <div className="panel-title">MY <span className="y">GROUPS</span></div>
                    <div className="panel-subtitle">Welcome back, {user.teacher.name} - manage your groups below</div>
                </div>
                <div className="panel-body">
                    <span className="slabel">Your Groups</span>
                    <button className="add-btn" onClick={() => setModalOpen(true)}>
                        <span className="add-icon">+</span>Add New Group
                    </button>
                    <div className="groups-grid">
                        {groups === null ? <Skeleton /> : groups.length === 0 ? (
                            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                <div className="empty-line">NO GROUPS</div>
                                <p>Add your first group above.</p>
                            </div>
                        ) : groups.map((g, i) => (
                            <GroupCard key={g.id || g._id} group={g} teacherName={user.teacher.name} index={i} onEdit={() => openEditModal(g)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Add/Edit Group Modal */}
            <Modal open={modalOpen} onClose={closeModal}>
                <div className="modal-hd">
                    <div><div className="modal-title">{editingGroup ? 'Edit Group' : 'Add New Group'}</div><div className="modal-sub">Fill in all group details</div></div>
                    <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="form-grid">
                    <div className="f-group full">
                        <label className="f-label">Group Name</label>
                        <input className="f-input" type="text" maxLength="32" placeholder="e.g. React Batch 4" value={fName} onChange={(e) => setFName(e.target.value)} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Programming Language</label>
                        <select className="f-select" value={fLang} onChange={(e) => { setFLang(e.target.value); setSelectedStage(null); }}>
                            <option value="">Select language</option>
                            {VALID_LANGS.map((l) => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Class Time</label>
                        <input className="f-input" type="time" value={fTime} onChange={(e) => setFTime(e.target.value)} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Schedule</label>
                        <select className="f-select" value={fDays} onChange={(e) => setFDays(e.target.value)}>
                            <option value="Every Day">Every Day</option>
                            <option value="Odd Days">Odd Days</option>
                            <option value="Even Days">Even Days</option>
                        </select>
                    </div>
                    {fLang && (
                        <div className="f-group full">
                            <label className="f-label">Current Level</label>
                            <div>
                                <div className="stage-months">
                                    {Array.from({ length: levels }, (_, i) => {
                                        const lv = i + 1;
                                        return (
                                            <button key={lv} type="button" className={'stage-btn' + (selectedStage === lv ? ' active' : '')} onClick={() => setSelectedStage(lv)}>
                                                <span className="sb-num">{lv}</span>
                                                <span className="sb-lbl">Level {lv}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedStage && (
                                    <div className="stage-info-bar" style={{ display: 'flex' }}>
                                        Level <strong>{selectedStage}</strong>&nbsp;·&nbsp;Lessons <strong>{(selectedStage - 1) * LPL + 1}-{selectedStage * LPL}</strong>&nbsp;·&nbsp;Total: <strong>{levels * LPL}</strong> lessons
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="f-group">
                        <label className="f-label">Start Date</label>
                        <input className="f-input" type="date" value={fStart} onChange={handleStartDateChange} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Exam Date</label>
                        <input className="f-input" type="date" value={fExam} onChange={(e) => setFExam(e.target.value)} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Number of Students</label>
                        <input className="f-input" type="number" placeholder="e.g. 20" min="1" value={fStudents} onChange={(e) => setFStudents(e.target.value)} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Lessons Done (in this level)</label>
                        <input className="f-input" type="number" placeholder="0" min="0" value={fDone} onChange={(e) => setFDone(e.target.value)} />
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : (editingGroup ? 'Save Changes' : 'Add Group')}</button>
                    <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                </div>
            </Modal>
        </div>
    );
}
