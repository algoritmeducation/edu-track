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

    const renderCell = (dayType, teacher, teacherSlots, teacherGroups) => {
        const avail = teacher.availability || { oddDays: {}, evenDays: {} };
        const dayGroups = teacherGroups.filter(g => g.days === (dayType === 'odd' ? 'Odd Days' : 'Even Days') || g.days === 'Every Day');

        return teacherSlots.map((slot, idx) => {
            const hasLesson = dayGroups.some(g => isOverlapping(slot, g.startTime, g.endTime));
            if (hasLesson) {
                return <td key={idx} className="sch-cell sch-lesson">Lesson</td>;
            }
            const status = avail[dayType === 'odd' ? 'oddDays' : 'evenDays']?.[slot] || 'Unset';
            if (status === 'Free') return <td key={idx} className="sch-cell sch-free">Free</td>;
            if (status === 'Busy') return <td key={idx} className="sch-cell sch-busy">Busy</td>;
            return <td key={idx} className="sch-cell sch-unset">-</td>;
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
            <div style={{ overflowX: 'auto', paddingBottom: '24px' }}>
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="sch-th-name">Ism / Familiya</th>
                            <th rowSpan="2" className="sch-th-sm">Gr</th>
                            <th rowSpan="2" className="sch-th-sm">Fr</th>
                            <th colSpan="8" className="sch-th-group" style={{ background: '#4caf50', color: '#fff' }}>Dush-Chor-Jum (Odd Days)</th>
                            <th colSpan="8" className="sch-th-group" style={{ background: '#2196f3', color: '#fff' }}>Sesh-Pay-Shan (Even Days)</th>
                            <th rowSpan="2" className="sch-th-sm">Shift</th>
                        </tr>
                        <tr>
                            {/* Generic Headers for Odd */}
                            <th className="sch-th-time">Sl 1</th><th className="sch-th-time">Sl 2</th><th className="sch-th-time">Sl 3</th><th className="sch-th-time">Sl 4</th><th className="sch-th-time">Sl 5</th><th className="sch-th-time">Sl 6</th><th className="sch-th-time">Sl 7</th><th className="sch-th-time">Sl 8</th>
                            {/* Generic Headers for Even */}
                            <th className="sch-th-time">Sl 1</th><th className="sch-th-time">Sl 2</th><th className="sch-th-time">Sl 3</th><th className="sch-th-time">Sl 4</th><th className="sch-th-time">Sl 5</th><th className="sch-th-time">Sl 6</th><th className="sch-th-time">Sl 7</th><th className="sch-th-time">Sl 8</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allSubjects.map((subject) => {
                            const subjTeachers = groupedTeachers[subject] || [];
                            return (
                                <React.Fragment key={subject}>
                                    <tr className="sch-category-row">
                                        <td colSpan="20" className="sch-category-cell">{subject}</td>
                                    </tr>
                                    {subjTeachers.map((t, index) => {
                                        const tGroups = groups.filter(g => g.tid === t.id);
                                        const subs = Array.isArray(t.subject) ? t.subject : [t.subject];
                                        const strictlyItKids = subs.length > 0 && subs.every(s => s === 'IT Kids');
                                        const tSlots = generateSlots(strictlyItKids);
                                        const freeSlotsCount = countFree(t, tSlots, tGroups);

                                        // Pad empty cells up to 8 max slots for display alignment
                                        const maxRenderSlots = 8;
                                        const oddCells = renderCell('odd', t, tSlots, tGroups);
                                        const evenCells = renderCell('even', t, tSlots, tGroups);

                                        while (oddCells.length < maxRenderSlots) oddCells.push(<td key={'p-o-' + oddCells.length} className="sch-cell sch-unset sch-pad"></td>);
                                        while (evenCells.length < maxRenderSlots) evenCells.push(<td key={'p-e-' + evenCells.length} className="sch-cell sch-unset sch-pad"></td>);

                                        return (
                                            <tr key={t.id} className="sch-teacher-row">
                                                <td className="sch-cell-name">
                                                    <span className="sch-idx">{index + 1}</span> {t.name}
                                                </td>
                                                <td className="sch-cell-center">{tGroups.length}</td>
                                                <td className="sch-cell-center">{freeSlotsCount}</td>
                                                {oddCells}
                                                {evenCells}
                                                <td className="sch-cell-center">Full</td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                        {allSubjects.length === 0 && (
                            <tr><td colSpan="20" style={{ textAlign: 'center', padding: '16px' }}>No teachers active</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
