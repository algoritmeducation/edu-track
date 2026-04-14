import { PC, LPL, totalDone, totalLessons, pct, tagCls } from '../constants';

function fmtLastLogin(date) {
    if (!date) return 'Never logged in';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
}

export default function TeacherCard({ teacher, groups, index = 0, onEdit, onDelete, onViewSchedule }) {
    const ts = groups.reduce((a, g) => a + g.students, 0);
    const ap = groups.length
        ? Math.round(groups.reduce((a, g) => a + pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang)), 0) / groups.length)
        : 0;

    const isInactive = !teacher.lastLogin || (new Date() - new Date(teacher.lastLogin)) > 14 * 86400000;

    return (
        <div className="teacher-card" style={{ animationDelay: index * 0.05 + 's' }}>
            <div className="tc-head">
                <div className="tc-avatar">{teacher.name.charAt(0)}</div>
                <div>
                    <div className="tc-name">{teacher.name}</div>
                    <div style={{ margin: '3px 0 4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(Array.isArray(teacher.subject) ? teacher.subject : [teacher.subject]).map(s => (
                            <span key={s} style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--fm)', letterSpacing: '.5px', background: 'rgba(245,197,24,.12)', color: 'var(--yellow)', border: '1px solid rgba(245,197,24,.25)' }}>{s}</span>
                        ))}
                    </div>
                    <div className="tc-username">@{teacher.username}</div>
                </div>
            </div>
            <div className="tc-body">
                <div className="tc-stats">
                    <div className="tc-stat"><div className="tc-stat-num">{groups.length}</div><div className="tc-stat-lbl">Groups</div></div>
                    <div className="tc-stat"><div className="tc-stat-num">{ts}</div><div className="tc-stat-lbl">Students</div></div>
                    <div className="tc-stat"><div className="tc-stat-num">{ap}%</div><div className="tc-stat-lbl">Avg Prog</div></div>
                </div>

                {/* Last Login */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 10px', borderRadius: '8px', background: isInactive ? 'rgba(244,67,54,0.07)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (isInactive ? 'rgba(244,67,54,0.2)' : 'var(--border)') }}>
                    <span style={{ fontSize: '11px' }}>{isInactive ? '🔴' : '🟢'}</span>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: isInactive ? '#ef9a9a' : 'var(--gray)' }}>
                        Last login: <strong style={{ color: isInactive ? '#ef9a9a' : 'var(--gl)' }}>{fmtLastLogin(teacher.lastLogin)}</strong>
                    </span>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'var(--fm)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Groups</div>
                <div className="tc-groups-list">
                    {groups.length ? groups.map((g) => {
                        const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
                        const cfg = PC[g.lang] || { levels: 1 };
                        return (
                            <div key={g.id} className="tc-group-row">
                                <span className={'tag tag-' + tagCls(g.lang)} style={{ fontSize: '10px' }}>{g.lang}</span>
                                <span className="tc-group-name">{g.group}</span>
                                <span style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'var(--fm)', whiteSpace: 'nowrap' }}>Lv{g.level}/{cfg.levels}</span>
                                <div className="tc-group-prog">
                                    <div className="tc-mini-track"><div className="tc-mini-fill" style={{ width: p + '%' }}></div></div>
                                    <span className="tc-group-pct">{p}%</span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ fontSize: '13px', color: 'var(--gray)', textAlign: 'center', padding: '16px', fontFamily: 'var(--fm)' }}>No groups assigned yet</div>
                    )}
                </div>
            </div>
            <div className="tc-actions">
                {onViewSchedule && <button className="btn-sm" style={{ background: 'var(--darker)', color: 'var(--white)' }} onClick={() => onViewSchedule(teacher)}>Schedule</button>}
                <button className="btn-sm btn-sm-yellow" onClick={() => onEdit(teacher)}>Edit</button>
                <button className="btn-sm btn-sm-red" onClick={() => onDelete(teacher, groups.length)}>Delete</button>
            </div>
        </div>
    );
}
