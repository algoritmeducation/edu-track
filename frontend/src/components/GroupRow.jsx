import { PC, totalDone, totalLessons, tagCls, fmtDate } from '../constants';
import LevelBar from './LevelBar';

export default function GroupRow({ group, onDelete, selected, onSelect }) {
    const cfg = PC[group.lang] || { levels: 1 };
    const done = totalDone(group.level, group.doneInLevel);
    const tl = totalLessons(group.lang);

    return (
        <tr className={selected ? 'selected-row' : ''}>
            {onSelect !== undefined && (
                <td style={{ textAlign: 'center' }}>
                    <input
                        type="checkbox"
                        checked={selected || false}
                        onChange={() => onSelect(group.id || group._id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', opacity: 0.8 }}
                    />
                </td>
            )}
            <td className="td-w">{group.group}</td>
            <td><span className={'tag tag-' + tagCls(group.lang)}>{group.lang}</span></td>
            <td>
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--yellow)', background: 'var(--yglow)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--yborder)', whiteSpace: 'nowrap' }}>
                    Lv {group.level}/{cfg.levels}
                </span>
            </td>
            <td className="td-m">{group.startTime || '–'} – {group.endTime || '–'}</td>
            <td className="td-m">{group.days || 'Every Day'}</td>
            <td>{fmtDate(group.start)}</td>
            <td>{fmtDate(group.exam)}</td>
            <td className="td-n">{group.students}</td>
            <td className="td-m">{done}/{tl}</td>
            <td><LevelBar group={group} mode="table" /></td>
            {onDelete && (
                <td style={{ textAlign: 'right' }}>
                    <button
                        onClick={() => onDelete(group)}
                        title="Delete Group"
                        style={{
                            color: 'var(--red)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            opacity: 0.5,
                            transition: 'opacity 0.2s, background 0.2s',
                            borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            )}
        </tr>
    );
}
