import { useState, useEffect } from 'react';
import { api } from '../api';
import { PC, LPL, MODULES, totalDone, calcExamDate, autoProgress, computeElapsedLessons } from '../constants';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import GroupCard from '../components/GroupCard';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';

// Time slots 07:00 – 21:00 in 30-minute steps
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return { h, label: `${String(h).padStart(2, '0')}:${m}` };
}).filter(({ h }) => h >= 7 && h <= 21).map(({ label }) => label).filter(t => t <= '21:00');

export default function TeacherApp({ token, user, onLogout }) {
    const [groups, setGroups] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const showToast = useToast();

    const [avail, setAvail] = useState({ oddDays: {}, evenDays: {} });
    const [savingAvailability, setSavingAvailability] = useState(false);

    useEffect(() => {
        if (user?.teacher?.availability) {
            setAvail({
                oddDays: user.teacher.availability.oddDays || {},
                evenDays: user.teacher.availability.evenDays || {}
            });
        }
    }, [user]);

    // Form state
    const [fName, setFName] = useState('');
    const [fLang, setFLang] = useState('');
    const [fStartTime, setFStartTime] = useState('');
    const [fEndTime, setFEndTime] = useState('');
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const synced = await Promise.all(data.map(async (g) => {
                const maxLevels = PC[g.lang]?.levels || 1;
                const examDate = new Date(g.exam);
                examDate.setHours(0, 0, 0, 0);

                // Level-up: exam date has passed and group is not at final level
                if (today > examDate && g.level < maxLevels) {
                    const newLevel = g.level + 1;
                    const newStart = g.exam; // new level starts from old exam date
                    const newExam = calcExamDate(newStart, g.days);
                    const elapsed = computeElapsedLessons(newStart, g.days);
                    const newDoneInLevel = Math.min(elapsed, LPL);
                    try {
                        const updated = await api('PUT', `/api/groups/${g.id || g._id}`, {
                            level: newLevel, start: newStart, exam: newExam, doneInLevel: newDoneInLevel
                        }, token);
                        return updated;
                    } catch { return g; }
                }

                // Normal auto-advance within current level
                const { level: autoLevel, doneInLevel: autoDone, totalDone: autoTotal } = autoProgress(g);
                const storedTotal = totalDone(g.level, g.doneInLevel);
                if (autoTotal > storedTotal) {
                    try {
                        const updated = await api('PUT', `/api/groups/${g.id || g._id}`, { level: autoLevel, doneInLevel: autoDone }, token);
                        return updated;
                    } catch { return g; }
                }

                return g;
            }));
            setGroups(synced);
        } catch (err) {
            setGroups([]);
            showToast(err.message, true);
        }
    }

    function resetForm() {
        setFName(''); setFLang(''); setFStartTime(''); setFEndTime(''); setFStart(''); setFExam('');
        setFStudents(''); setFDone('0'); setFDays('Every Day'); setSelectedStage(null); setEditingGroup(null);
    }

    function closeModal() { setModalOpen(false); resetForm(); }

    function openEditModal(group) {
        setEditingGroup(group);
        setFName(group.group);
        setFLang(group.lang);
        setFStartTime(group.startTime || '');
        setFEndTime(group.endTime || '');
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
        let updatedDays = fDays;
        if ([1, 3, 5].includes(day)) updatedDays = 'Odd Days';
        if ([2, 4, 6].includes(day)) updatedDays = 'Even Days';
        setFDays(updatedDays);
        calculateExamDate(val, updatedDays);

        // Auto-fill lessons done based on elapsed calendar days
        const elapsed = computeElapsedLessons(val, updatedDays);
        if (elapsed > 0) {
            const maxTotal = fLang ? (PC[fLang]?.levels || 1) * LPL : Infinity;
            const clamped = Math.min(elapsed, maxTotal);
            const autoLevel = Math.ceil(clamped / LPL) || 1;
            const autoDone = clamped - (autoLevel - 1) * LPL;
            setSelectedStage(autoLevel);
            setFDone(String(autoDone));
        }
    }

    function calculateExamDate(startDateStr, scheduleMode) {
        if (!startDateStr) {
            setFExam('');
            return;
        }

        const date = new Date(startDateStr);
        let lessonsCount = 1; // Start date is lesson 1

        while (lessonsCount < LPL) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay();

            if (day === 0) continue; // No lessons on Sunday

            if (scheduleMode === 'Even Days' && ![2, 4, 6].includes(day)) continue;
            if (scheduleMode === 'Odd Days' && ![1, 3, 5].includes(day)) continue;

            // If we fall through to here, it's a valid lesson day based on the schedule, or "Every Day" (Mon-Sat).
            lessonsCount++;
        }

        // Format the date output
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        setFExam(`${y}-${m}-${d}`);
    }

    function handleNameChange(e) {
        let val = e.target.value;
        if (val.length > 32) {
            showToast('Group name cannot exceed 32 characters', true);
            val = val.substring(0, 32);
        }
        setFName(val);
    }

    function handleStartTimeChange(e) {
        const val = e.target.value;
        setFStartTime(val);
        if (!val) return;
        // IT Kids classes are 1.5 h, everything else is 2 h
        const isItKids = PC[fLang]?.category === 'IT Kids';
        const addMinutes = isItKids ? 90 : 120;
        const [hStr, mStr] = val.split(':');
        const totalMin = parseInt(hStr) * 60 + parseInt(mStr) + addMinutes;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const endM = totalMin % 60 === 0 ? '00' : '30';
        const endTime = `${endH}:${endM}`;
        if (TIME_OPTIONS.includes(endTime)) setFEndTime(endTime);
    }

    function handleLangChange(e) {
        const lang = e.target.value;
        setFLang(lang);
        setSelectedStage(null);
        // Re-compute level/doneInLevel for the newly selected subject if start is set
        if (fStart && lang) {
            const elapsed = computeElapsedLessons(fStart, fDays);
            if (elapsed > 0) {
                const maxTotal = (PC[lang]?.levels || 1) * LPL;
                const clamped = Math.min(elapsed, maxTotal);
                const autoLevel = Math.ceil(clamped / LPL) || 1;
                const autoDone = clamped - (autoLevel - 1) * LPL;
                setSelectedStage(autoLevel);
                setFDone(String(autoDone));
            }
        }
    }

    function handleDaysChange(e) {
        const val = e.target.value;
        setFDays(val);
        if (fStart) calculateExamDate(fStart, val);
    }

    function handleStudentsChange(e) {
        const val = e.target.value;
        if (val === '') {
            setFStudents('');
            return;
        }
        if (!/^\d+$/.test(val)) {
            showToast('Number of students must be a valid number', true);
            return;
        }
        setFStudents(val);
    }

    async function handleSubmit() {
        const name = fName.trim();
        if (!name || !fLang || !fStartTime || !fEndTime || !fStart || !fExam || !fStudents) {
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
                group: name, lang: fLang, startTime: fStartTime, endTime: fEndTime, start: fStart, exam: fExam,
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

    // teacher.subject is now an array of up to 2 specialization categories
    const teacherSubjects = Array.isArray(user?.teacher?.subject)
        ? user.teacher.subject
        : (user?.teacher?.subject ? [user.teacher.subject] : []);

    // Merge allowed modules from all teacher subjects (1 or 2)
    const allowedModules = teacherSubjects.length
        ? teacherSubjects.reduce((acc, cat) => {
            if (MODULES[cat]) acc[cat] = MODULES[cat];
            return acc;
        }, {})
        : MODULES;

    // For display in the label — show both categories if present
    const teacherCategory = teacherSubjects.join(' + ');

    function generateSlots(isItKids) {
        const slots = [];
        let currentMin = 8 * 60;
        const endMin = 20 * 60;
        const intervalMin = isItKids ? 90 : 120;
        while (currentMin + intervalMin <= endMin) {
            const h1 = String(Math.floor(currentMin / 60)).padStart(2, '0');
            const m1 = String(currentMin % 60).padStart(2, '0');
            const nextMin = currentMin + intervalMin;
            const h2 = String(Math.floor(nextMin / 60)).padStart(2, '0');
            const m2 = String(nextMin % 60).padStart(2, '0');
            slots.push(`${h1}:${m1}-${h2}:${m2}`);
            currentMin = nextMin;
        }
        return slots;
    }

    function isOverlapping(slotStr, lessonStart, lessonEnd) {
        if (!lessonStart || !lessonEnd) return false;
        const [s1, e1] = slotStr.split('-');
        const toMins = t => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };
        return toMins(s1) < toMins(lessonEnd) && toMins(lessonStart) < toMins(e1);
    }

    // If they have dual specialization, only use 1.5h if BOTH are IT kids or they ONLY teach IT Kids
    const isStrictlyItKids = teacherSubjects.length > 0 && teacherSubjects.every(s => s === 'IT Kids');
    const standardSlots = generateSlots(isStrictlyItKids);
    const oddGroups = (groups || []).filter(g => g.days === 'Odd Days' || g.days === 'Every Day');
    const evenGroups = (groups || []).filter(g => g.days === 'Even Days' || g.days === 'Every Day');

    const getSlotStatus = (dayType, slot) => {
        const dayGroups = dayType === 'odd' ? oddGroups : evenGroups;
        const isLesson = dayGroups.some(g => isOverlapping(slot, g.startTime, g.endTime));
        if (isLesson) return 'Lesson';
        return avail[dayType === 'odd' ? 'oddDays' : 'evenDays'][slot] || 'Unset';
    };

    const handleAvailChange = (dayType, slot, status) => {
        setAvail(prev => ({
            ...prev,
            [dayType === 'odd' ? 'oddDays' : 'evenDays']: {
                ...prev[dayType === 'odd' ? 'oddDays' : 'evenDays'],
                [slot]: status
            }
        }));
    };

    const saveAvailability = async () => {
        setSavingAvailability(true);
        try {
            await api('PUT', '/api/teachers/me/availability', avail, token);
            showToast('Schedule saved successfully!');
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setSavingAvailability(false);
        }
    };

    return (
        <div className="view active" id="v-teacher-app">
            <Navbar
                onLogout={onLogout}
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

                <div className="panel-body" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <span className="slabel" style={{ margin: 0 }}>My Schedule</span>
                        <button className="btn-submit" style={{ padding: '8px 16px', fontSize: '12px', width: 'auto' }} onClick={saveAvailability} disabled={savingAvailability}>
                            {savingAvailability ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                    <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                        <div className="schedule-col">
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Odd Days</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {standardSlots.map(slot => {
                                    const status = getSlotStatus('odd', slot);
                                    return (
                                        <div key={slot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--darker)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontFamily: 'var(--fm)', fontSize: '13px', color: 'var(--gray)' }}>{slot}</span>
                                            {status === 'Lesson' ? (
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)', padding: '4px 10px', background: 'rgba(244,67,54,0.1)', borderRadius: '6px' }}>Lesson</span>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => handleAvailChange('odd', slot, 'Free')} style={{ cursor: 'pointer', background: status === 'Free' ? '#4caf50' : 'transparent', color: status === 'Free' ? '#fff' : 'var(--gray)', border: '1px solid ' + (status === 'Free' ? '#4caf50' : 'var(--border)'), padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, transition: 'all .2s' }}>Free</button>
                                                    <button onClick={() => handleAvailChange('odd', slot, 'Busy')} style={{ cursor: 'pointer', background: status === 'Busy' ? '#ff9800' : 'transparent', color: status === 'Busy' ? '#fff' : 'var(--gray)', border: '1px solid ' + (status === 'Busy' ? '#ff9800' : 'var(--border)'), padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, transition: 'all .2s' }}>Busy</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="schedule-col">
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Even Days</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {standardSlots.map(slot => {
                                    const status = getSlotStatus('even', slot);
                                    return (
                                        <div key={slot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--darker)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontFamily: 'var(--fm)', fontSize: '13px', color: 'var(--gray)' }}>{slot}</span>
                                            {status === 'Lesson' ? (
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)', padding: '4px 10px', background: 'rgba(244,67,54,0.1)', borderRadius: '6px' }}>Lesson</span>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => handleAvailChange('even', slot, 'Free')} style={{ cursor: 'pointer', background: status === 'Free' ? '#4caf50' : 'transparent', color: status === 'Free' ? '#fff' : 'var(--gray)', border: '1px solid ' + (status === 'Free' ? '#4caf50' : 'var(--border)'), padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, transition: 'all .2s' }}>Free</button>
                                                    <button onClick={() => handleAvailChange('even', slot, 'Busy')} style={{ cursor: 'pointer', background: status === 'Busy' ? '#ff9800' : 'transparent', color: status === 'Busy' ? '#fff' : 'var(--gray)', border: '1px solid ' + (status === 'Busy' ? '#ff9800' : 'var(--border)'), padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, transition: 'all .2s' }}>Busy</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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
                        <input className="f-input" type="text" placeholder="e.g. React Batch 4" value={fName} onChange={handleNameChange} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Module / Subject
                            {teacherCategory && <span style={{ color: 'var(--yellow)', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>({teacherCategory})</span>}
                        </label>
                        <select className="f-select" value={fLang} onChange={handleLangChange}>
                            <option value="">Select subject</option>
                            {Object.entries(allowedModules).map(([mod, subjs]) => (
                                <optgroup key={mod} label={mod}>
                                    {subjs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Start Time (24h)</label>
                        <select className="f-select" value={fStartTime} onChange={handleStartTimeChange}>
                            <option value="">Select start time</option>
                            {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">End Time (24h)</label>
                        <select className="f-select" value={fEndTime} onChange={(e) => setFEndTime(e.target.value)}>
                            <option value="">Select end time</option>
                            {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
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
                        <label className="f-label">Schedule</label>
                        <select className="f-select" value={fDays} onChange={handleDaysChange}>
                            <option value="Every Day">Every Day</option>
                            <option value="Odd Days">Odd Days</option>
                            <option value="Even Days">Even Days</option>
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Exam Date</label>
                        <input className="f-input" type="date" value={fExam} onChange={(e) => setFExam(e.target.value)} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Number of Students</label>
                        <input className="f-input" type="text" inputMode="numeric" placeholder="e.g. 20" value={fStudents} onChange={handleStudentsChange} />
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
