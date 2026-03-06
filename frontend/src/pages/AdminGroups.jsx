import { useState, useEffect } from 'react';
import { api } from '../api';
import { totalDone, totalLessons, pct, tagCls, MODULES } from '../constants';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import GroupRow from '../components/GroupRow';

export default function AdminGroups({ token }) {
    const [teachers, setTeachers] = useState(null);
    const [allGroups, setAllGroups] = useState(null);
    const [langFilter, setLangFilter] = useState('all');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [progFilter, setProgFilter] = useState('all');
    const showToast = useToast();

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

    const loading = teachers === null || allGroups === null;

    let filtered = allGroups || [];
    // Module (category) filter
    if (moduleFilter !== 'all') {
        const moduleCourses = MODULES[moduleFilter] || [];
        filtered = filtered.filter((g) => moduleCourses.includes(g.lang));
    }
    // Subject (specific course) filter
    if (langFilter !== 'all') filtered = filtered.filter((g) => g.lang === langFilter);
    if (progFilter !== 'all') filtered = filtered.filter((g) => {
        const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
        return progFilter === 'not-started' ? p === 0 : progFilter === 'in-progress' ? p > 0 && p < 100 : p === 100;
    });

    // Subjects available in the subject dropdown: if a module is selected, show only its courses
    const availableSubjects = moduleFilter !== 'all'
        ? { [moduleFilter]: MODULES[moduleFilter] }
        : MODULES;

    const progs = [
        { key: 'all', label: 'All' },
        { key: 'not-started', label: 'Not Started (0%)' },
        { key: 'in-progress', label: 'In Progress (1-99%)' },
        { key: 'completed', label: 'Completed (100%)' },
    ];

    return (
        <div className="panel-body">
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'flex-start' }}>
                {/* Module filter */}
                <div>
                    <span className="slabel" style={{ marginBottom: '10px' }}>Filter by Module</span>
                    <div className="filter-row" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
                        <span className="filter-label">Module:</span>
                        {[{ key: 'all', label: 'All' }, ...Object.keys(MODULES).map(m => ({ key: m, label: m }))].map(m => (
                            <button
                                key={m.key}
                                className={'filter-btn' + (moduleFilter === m.key ? ' active' : '')}
                                onClick={() => { setModuleFilter(m.key); setLangFilter('all'); }}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'flex-start' }}>
                {/* Subject filter */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <span className="slabel" style={{ marginBottom: '10px' }}>Filter by Subject</span>
                    <div className="filter-row" id="lang-filter-bar" style={{ alignItems: 'center', marginBottom: 0 }}>
                        <span className="filter-label">Subject:</span>
                        <select className="f-select" style={{ width: 'auto', padding: '8px 30px 8px 16px', fontSize: '13px' }} value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
                            <option value="all">All Subjects</option>
                            {Object.entries(availableSubjects).map(([mod, subjs]) => (
                                <optgroup key={mod} label={mod}>
                                    {subjs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Progress filter */}
                <div style={{ flex: 2, minWidth: '280px' }}>
                    <span className="slabel" style={{ marginBottom: '10px' }}>Filter by Progress</span>
                    <div className="filter-row" id="prog-filter-bar" style={{ marginBottom: 0 }}>
                        <span className="filter-label">Progress:</span>
                        {progs.map((p) => (
                            <button key={p.key} className={'filter-btn' + (progFilter === p.key ? ' active' : '')} onClick={() => setProgFilter(p.key)}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <span className="slabel" style={{ marginTop: '16px' }}>Groups by Teacher</span>
            {
                loading ? <Skeleton /> : !filtered.length ? (
                    <div className="empty-state"><div className="empty-line">NO RESULTS</div><p>No groups match the selected filters.</p></div>
                ) : (
                    (teachers || []).map((t) => {
                        const gs = filtered.filter((g) => g.tid === t.id);
                        if (!gs.length) return null;
                        return (
                            <div key={t.id} className="teacher-section">
                                <div className="teacher-hdr">
                                    <div className="t-avatar">{t.name.charAt(0)}</div>
                                    <div>
                                        <div className="t-name-big">
                                            {t.name}
                                            {(Array.isArray(t.subject) ? t.subject : [t.subject]).map(s => (
                                                <span key={s} className="t-badge" style={{ marginLeft: '8px' }}>{s}</span>
                                            ))}
                                        </div>
                                        <div className="t-count">{gs.length} group{gs.length > 1 ? 's' : ''} &nbsp;·&nbsp; {gs.reduce((a, g) => a + g.students, 0)} students</div>
                                    </div>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead><tr><th>Group</th><th>Language</th><th>Level</th><th>Time</th><th>Schedule</th><th>Start</th><th>Exam</th><th>Students</th><th>Done</th><th>Progress</th></tr></thead>
                                        <tbody>{gs.map((g) => <GroupRow key={g.id} group={g} />)}</tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )
            }
        </div >
    );
}
