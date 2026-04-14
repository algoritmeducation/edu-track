import { PC, LPL, totalDone, totalLessons, pct, tagCls, fmtDate } from '../constants';
import LevelBar from './LevelBar';

export default function GroupCard({ group, teacherName, index = 0, onEdit, onArchive }) {
    const cfg = PC[group.lang] || { levels: 1 };
    const done = totalDone(group.level, group.doneInLevel);
    const tl = totalLessons(group.lang);

    return (
        <div className="group-card" style={{ animationDelay: index * 0.06 + 's', opacity: group.archived ? 0.65 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={'tag tag-' + tagCls(group.lang)}>{group.lang}</span>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--yellow)', background: 'var(--yglow)', padding: '3px 12px', borderRadius: '100px', border: '1px solid var(--yborder)' }}>
                        Level {group.level} / {cfg.levels}
                    </span>
                    {group.archived ? (
                        <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--gray)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '100px', border: '1px solid var(--border)' }}>
                            📦 Archived
                        </span>
                    ) : (
                        <span className="gc-auto-chip" title="Lesson count auto-advances based on schedule">
                            ⟳ Auto
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {onEdit && !group.archived && (
                        <button className="edit-btn" onClick={() => onEdit(group)} title="Edit group" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        </button>
                    )}
                    {onArchive && (
                        <button onClick={() => onArchive(group)} title={group.archived ? 'Unarchive group' : 'Archive group'} style={{ background: 'transparent', border: 'none', color: group.archived ? 'var(--yellow)' : 'var(--gray)', cursor: 'pointer', padding: '4px', fontSize: '14px', lineHeight: 1 }}>
                            {group.archived ? '📤' : '📦'}
                        </button>
                    )}
                </div>
            </div>
            <div className="gc-name">{group.group}</div>
            <div className="gc-meta">{teacherName} &nbsp;·&nbsp; {group.startTime || '–'} – {group.endTime || '–'} &nbsp;·&nbsp; {group.days || 'Every Day'}</div>
            <div className="gc-stats">
                <div className="stat-box"><div className="stat-lbl">Students</div><div className="stat-val">{group.students}</div></div>
                <div className="stat-box"><div className="stat-lbl">Total Lessons</div><div className="stat-val">{tl}</div></div>
                <div className="stat-box"><div className="stat-lbl">Done</div><div className="stat-val">{done}</div></div>
                <div className="stat-box"><div className="stat-lbl">This Level</div><div className="stat-val">{group.doneInLevel} / {LPL}</div></div>
                <div className="stat-box"><div className="stat-lbl">Start</div><div className="stat-val sm">{fmtDate(group.start)}</div></div>
                <div className="stat-box"><div className="stat-lbl">Exam</div><div className="stat-val sm">{fmtDate(group.exam)}</div></div>
            </div>
            <LevelBar group={group} mode="card" />
        </div>
    );
}
