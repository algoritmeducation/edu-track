import { useState, useEffect } from 'react';
import { api } from '../api';
import { totalDone, totalLessons, pct, tagCls } from '../constants';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import GroupRow from '../components/GroupRow';

export default function AdminGroups({ token }) {
    const [teachers, setTeachers] = useState(null);
    const [allGroups, setAllGroups] = useState(null);
    const [langFilter, setLangFilter] = useState('all');
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
    if (langFilter !== 'all') filtered = filtered.filter((g) => g.lang === langFilter);
    if (progFilter !== 'all') filtered = filtered.filter((g) => {
        const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
        return progFilter === 'not-started' ? p === 0 : progFilter === 'in-progress' ? p > 0 && p < 100 : p === 100;
    });

    const langs = ['all', 'HTML', 'CSS', 'JavaScript', 'React JS', 'Node JS'];
    const progs = [
        { key: 'all', label: 'All' },
        { key: 'not-started', label: 'Not Started (0%)' },
        { key: 'in-progress', label: 'In Progress (1-99%)' },
        { key: 'completed', label: 'Completed (100%)' },
    ];

    return (
        <div className="panel-body">
            <span className="slabel">Filter by Language</span>
            <div className="filter-row" id="lang-filter-bar">
                <span className="filter-label">Program:</span>
                {langs.map((l) => (
                    <button key={l} className={'filter-btn' + (langFilter === l ? ' active' : '')} onClick={() => setLangFilter(l)}>
                        {l === 'all' ? 'All' : l}
                    </button>
                ))}
            </div>
            <span className="slabel" style={{ marginTop: '8px' }}>Filter by Progress</span>
            <div className="filter-row" id="prog-filter-bar">
                <span className="filter-label">Progress:</span>
                {progs.map((p) => (
                    <button key={p.key} className={'filter-btn' + (progFilter === p.key ? ' active' : '')} onClick={() => setProgFilter(p.key)}>
                        {p.label}
                    </button>
                ))}
            </div>
            <span className="slabel" style={{ marginTop: '8px' }}>Groups by Teacher</span>
            {loading ? <Skeleton /> : !filtered.length ? (
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
                                    <div className="t-name-big">{t.name}<span className="t-badge">{t.subject}</span></div>
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
            )}
        </div>
    );
}
