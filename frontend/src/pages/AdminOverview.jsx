import { useState, useEffect } from 'react';
import { api } from '../api';
import { PC, LPL, totalDone, totalLessons, pct, tagCls } from '../constants';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';

export default function AdminOverview({ token }) {
    const [stats, setStats] = useState(null);
    const showToast = useToast();

    useEffect(() => { loadStats(); }, []);

    async function loadStats() {
        try {
            setStats(null);
            const s = await api('GET', '/api/stats', null, token);
            setStats(s);
        } catch (err) {
            showToast('Failed to load stats: ' + err.message, true);
        }
    }

    if (!stats) return <div className="panel-body"><Skeleton /></div>;

    return (
        <div className="panel-body">
            <span className="slabel">Platform Stats</span>
            <div className="stats-row">
                <div className="stat-card"><div className="stat-card-num">{stats.totalGroups}</div><div className="stat-card-lbl">Groups</div></div>
                <div className="stat-card"><div className="stat-card-num">{stats.totalTeachers}</div><div className="stat-card-lbl">Teachers</div></div>
                <div className="stat-card"><div className="stat-card-num">{stats.totalStudents}</div><div className="stat-card-lbl">Students</div></div>
                <div className="stat-card"><div className="stat-card-num">{stats.avgProgress}%</div><div className="stat-card-lbl">Avg Progress</div></div>
                <div className="stat-card"><div className="stat-card-num">{stats.byLang.filter((l) => l.groups > 0).length}</div><div className="stat-card-lbl">Languages</div></div>
            </div>
            <span className="slabel">Quick Summary by Language</span>
            {stats.byLang.filter((l) => l.groups > 0).length === 0 ? (
                <div className="empty-state"><div className="empty-line">NO DATA</div><p>No groups yet.</p></div>
            ) : (
                stats.byLang.filter((l) => l.groups > 0).map((l) => {
                    const cfg = PC[l.lang] || { levels: 1 };
                    return (
                        <div key={l.lang} style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px', transition: 'border-color .2s' }}>
                            <span className={'tag tag-' + tagCls(l.lang)} style={{ fontSize: '13px', padding: '6px 14px' }}>{l.lang}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gl)' }}>
                                        {l.groups} group{l.groups > 1 ? 's' : ''} &nbsp;·&nbsp; {l.students} students &nbsp;·&nbsp; {cfg.levels} level{cfg.levels > 1 ? 's' : ''} ({cfg.levels * LPL} lessons)
                                    </span>
                                    <span style={{ fontFamily: 'var(--fm)', fontSize: '13px', color: 'var(--yellow)', fontWeight: 700 }}>{l.avgPct}%</span>
                                </div>
                                <div style={{ background: 'var(--dark2)', borderRadius: '100px', height: '5px', overflow: 'hidden' }}>
                                    <div style={{ width: l.avgPct + '%', height: '100%', background: PC[l.lang]?.color || 'var(--yellow)', borderRadius: '100px' }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
