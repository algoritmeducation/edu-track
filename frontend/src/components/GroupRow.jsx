import { PC, totalDone, totalLessons, tagCls, fmtDate } from '../constants';
import LevelBar from './LevelBar';

export default function GroupRow({ group }) {
    const cfg = PC[group.lang] || { levels: 1 };
    const done = totalDone(group.level, group.doneInLevel);
    const tl = totalLessons(group.lang);

    return (
        <tr>
            <td className="td-w">{group.group}</td>
            <td><span className={'tag tag-' + tagCls(group.lang)}>{group.lang}</span></td>
            <td>
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--yellow)', background: 'var(--yglow)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--yborder)', whiteSpace: 'nowrap' }}>
                    Lv {group.level}/{cfg.levels}
                </span>
            </td>
            <td className="td-m">{group.time}</td>
            <td className="td-m">{group.days || 'Every Day'}</td>
            <td>{fmtDate(group.start)}</td>
            <td>{fmtDate(group.exam)}</td>
            <td className="td-n">{group.students}</td>
            <td className="td-m">{done}/{tl}</td>
            <td><LevelBar group={group} mode="table" /></td>
        </tr>
    );
}
