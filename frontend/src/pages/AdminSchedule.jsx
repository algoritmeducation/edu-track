import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';

export default function AdminSchedule({ token }) {
    const [teachers, setTeachers] = useState(null);
    const [groups, setGroups] = useState(null);
    const [filterSubject, setFilterSubject] = useState('All');
    const [dayView, setDayView] = useState('odd'); // 'odd' or 'even'
    const showToast = useToast();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setTeachers(null); setGroups(null);
            const [t, g] = await Promise.all([
                api('GET', '/api/teachers', null, token),
                api('GET', '/api/groups', null, token),
            ]);
            setTeachers(t);
            setGroups(g);
        } catch (err) {
            setTeachers([]); setGroups([]);
            showToast(err.message, true);
        }
    }

    const { groupedTeachers, allSubjects } = useMemo(() => {
        if (!teachers || !groups) return { groupedTeachers: {}, allSubjects: [] };

        const bySubject = {};
        teachers.forEach(teacher => {
            const subs = Array.isArray(teacher.subject) ? teacher.subject : [teacher.subject];
            const primary = subs[0] || 'Uncategorized';
            if (!bySubject[primary]) bySubject[primary] = [];
            bySubject[primary].push(teacher);
        });

        const subjectKeys = Object.keys(bySubject).sort();
        return { groupedTeachers: bySubject, allSubjects: subjectKeys };
    }, [teachers, groups]);

    function generateSlots(isStrictlyItKids) {
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

        // Filter out slots starting at 12 or 13 (12pm-1pm ignore per user request)
        return slots.filter(s => {
            const startH = parseInt(s.split(':')[0]);
            return startH !== 12 && startH !== 13;
        });
    }

    const isOverlapping = (slotStr, gStart, gEnd) => {
        if (!gStart || !gEnd) return false;
        const [s1, e1] = slotStr.split('-');
        const toMins = t => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };
        return toMins(s1) < toMins(gEnd) && toMins(gStart) < toMins(e1);
    };

    if (!teachers || !groups) {
        return <div className="panel-body"><Skeleton /></div>;
    }

    const displayedSubjects = filterSubject === 'All' ? allSubjects : allSubjects.filter(s => s === filterSubject);

    return (
        <div className="panel-body">
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--gray)', fontSize: '14px', fontWeight: 500 }}>Filter:</span>
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#121212',
                            border: '1px solid var(--border)',
                            color: '#ffffff',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Specializations</option>
                        {allSubjects.map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', background: 'var(--darker)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
                    <button
                        onClick={() => setDayView('odd')}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                            background: dayView === 'odd' ? 'var(--primary)' : 'transparent',
                            color: dayView === 'odd' ? '#fff' : 'var(--gray)', cursor: 'pointer', border: 'none'
                        }}
                    >ODD DAYS (Mon, Wed, Fri)</button>
                    <button
                        onClick={() => setDayView('even')}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                            background: dayView === 'even' ? 'var(--primary)' : 'transparent',
                            color: dayView === 'even' ? '#fff' : 'var(--gray)', cursor: 'pointer', border: 'none'
                        }}
                    >EVEN DAYS (Tue, Thu, Sat)</button>
                </div>
            </div>

            {displayedSubjects.map((subject) => {
                const subjTeachers = groupedTeachers[subject] || [];
                return (
                    <div key={subject} style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{subject}</span>
                            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--gray)', background: 'var(--darker)', padding: '4px 10px', borderRadius: '12px' }}>{subjTeachers.length} teachers</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {subjTeachers.map((t) => {
                                const tGroups = groups.filter(g => g.tid === t.id);
                                const subs = Array.isArray(t.subject) ? t.subject : [t.subject];
                                const strictlyItKids = subs.length > 0 && subs.every(s => s === 'IT Kids');
                                const tSlots = generateSlots(strictlyItKids);
                                const avail = t.availability || { oddDays: {}, evenDays: {} };

                                const targetGroups = tGroups.filter(g => g.days === (dayView === 'odd' ? 'Odd Days' : 'Even Days') || g.days === 'Every Day');

                                let freeSlotsCount = 0;
                                tSlots.forEach(slot => {
                                    if (!targetGroups.some(g => isOverlapping(slot, g.startTime, g.endTime)) && avail[dayView === 'odd' ? 'oddDays' : 'evenDays']?.[slot] === 'Free') {
                                        freeSlotsCount++;
                                    }
                                });

                                return (
                                    <div key={t.id} style={{ display: 'flex', background: 'var(--darker)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                        {/* Left Side: Teacher Info */}
                                        <div style={{ padding: '12px 16px', minWidth: '220px', maxWidth: '220px', display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #9c27b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontWeight: 600, fontSize: '16px', flexShrink: 0 }}>
                                                {t.name.charAt(0)}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--fm)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <span>{tGroups.length} grps</span>
                                                    <span style={{ color: freeSlotsCount > 0 ? 'var(--green)' : 'inherit' }}>{freeSlotsCount} free</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Horizontal Timeline Blocks */}
                                        <div style={{ display: 'flex', flex: 1, padding: '8px', gap: '6px', overflowX: 'auto', alignItems: 'stretch' }}>
                                            {tSlots.map(slot => {
                                                const hasLesson = targetGroups.some(g => isOverlapping(slot, g.startTime, g.endTime));
                                                let status = avail[dayView === 'odd' ? 'oddDays' : 'evenDays']?.[slot] || 'Unset';

                                                // Find specific group taking this slot to render in the block
                                                const groupInSlot = hasLesson ? targetGroups.find(g => isOverlapping(slot, g.startTime, g.endTime)) : null;

                                                if (hasLesson) status = 'Lesson';

                                                let bg = 'rgba(255,255,255,0.03)', color = 'var(--gray)', badgeColor = 'rgba(255,255,255,0.1)';
                                                if (status === 'Lesson') { bg = 'rgba(244,67,54,0.08)'; color = 'var(--red)'; badgeColor = '#f44336'; }
                                                else if (status === 'Free') { bg = 'rgba(76,175,80,0.08)'; color = 'var(--green)'; badgeColor = '#4caf50'; }
                                                else if (status === 'Busy') { bg = 'rgba(255,152,0,0.08)'; color = '#ff9800'; badgeColor = '#ff9800'; }

                                                return (
                                                    <div key={slot} title={groupInSlot ? `Group: ${groupInSlot.group}` : status} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, borderRadius: '6px', padding: '6px', border: '1px solid rgba(255,255,255,0.02)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor, position: 'absolute', top: '6px', right: '6px' }} />
                                                        <span style={{ fontSize: '11px', fontFamily: 'var(--fm)', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                                                            {slot.split('-')[0]}
                                                        </span>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                                                            {hasLesson && groupInSlot ? groupInSlot.group : status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {allSubjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray)' }}>No teachers active</div>
            )}
            {allSubjects.length > 0 && displayedSubjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray)' }}>No teachers found for this specialization</div>
            )}
        </div>
    );
}
