import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';

export default function AdminSchedule({ token }) {
    const [teachers, setTeachers] = useState(null);
    const [groups, setGroups] = useState(null);
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

    const renderChip = (dayType, teacher, teacherSlots, teacherGroups) => {
        const avail = teacher.availability || { oddDays: {}, evenDays: {} };
        const dayGroups = teacherGroups.filter(g => g.days === (dayType === 'odd' ? 'Odd Days' : 'Even Days') || g.days === 'Every Day');

        return teacherSlots.map((slot) => {
            const hasLesson = dayGroups.some(g => isOverlapping(slot, g.startTime, g.endTime));
            let status = avail[dayType === 'odd' ? 'oddDays' : 'evenDays']?.[slot] || 'Unset';
            if (hasLesson) status = 'Lesson';

            let bg = 'rgba(255,255,255,0.05)', color = 'var(--gray)', borderColor = 'var(--border)';
            if (status === 'Lesson') { bg = 'rgba(244,67,54,0.1)'; color = 'var(--red)'; borderColor = 'rgba(244,67,54,0.2)'; }
            else if (status === 'Free') { bg = 'rgba(76,175,80,0.1)'; color = 'var(--green)'; borderColor = 'rgba(76,175,80,0.2)'; }
            else if (status === 'Busy') { bg = 'rgba(255,255,255,0.05)'; color = 'var(--gray)'; borderColor = 'var(--border)'; }

            return (
                <div key={slot} style={{ background: bg, border: `1px solid ${borderColor}`, padding: '6px 10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '94px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--fm)', color: 'var(--gray)', fontWeight: 400 }}>{slot}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color }}>{status}</span>
                </div>
            );
        });
    };

    const countFree = (teacher, teacherSlots, teacherGroups) => {
        const avail = teacher.availability || { oddDays: {}, evenDays: {} };
        const oddGroups = teacherGroups.filter(g => g.days === 'Odd Days' || g.days === 'Every Day');
        const evenGroups = teacherGroups.filter(g => g.days === 'Even Days' || g.days === 'Every Day');

        let freeCount = 0;
        teacherSlots.forEach(slot => {
            if (!oddGroups.some(g => isOverlapping(slot, g.startTime, g.endTime)) && avail.oddDays?.[slot] === 'Free') freeCount++;
            if (!evenGroups.some(g => isOverlapping(slot, g.startTime, g.endTime)) && avail.evenDays?.[slot] === 'Free') freeCount++;
        });
        return freeCount;
    };

    if (!teachers || !groups) {
        return <div className="panel-body"><Skeleton /></div>;
    }

    return (
        <div className="panel-body">
            {allSubjects.map((subject) => {
                const subjTeachers = groupedTeachers[subject] || [];
                return (
                    <div key={subject} style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{subject}</span>
                            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--gray)', background: 'var(--darker)', padding: '4px 10px', borderRadius: '12px' }}>{subjTeachers.length} teachers</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {subjTeachers.map((t) => {
                                const tGroups = groups.filter(g => g.tid === t.id);
                                const subs = Array.isArray(t.subject) ? t.subject : [t.subject];
                                const strictlyItKids = subs.length > 0 && subs.every(s => s === 'IT Kids');
                                const tSlots = generateSlots(strictlyItKids);
                                const freeSlotsCount = countFree(t, tSlots, tGroups);

                                return (
                                    <div key={t.id} style={{ background: 'var(--darker)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontWeight: 600, fontSize: '16px' }}>
                                                    {t.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px' }}>{t.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--fm)' }}>@{t.username}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)' }}>{tGroups.length}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Groups</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{freeSlotsCount}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Free Slots</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>ODD DAYS (Mon, Wed, Fri)</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {renderChip('odd', t, tSlots, tGroups)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>EVEN DAYS (Tue, Thu, Sat)</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {renderChip('even', t, tSlots, tGroups)}
                                                </div>
                                            </div>
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
        </div>
    );
}
