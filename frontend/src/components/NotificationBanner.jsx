import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { totalDone, totalLessons, pct } from '../constants';

const DISMISS_KEY = 'nearComplete_dismissed';

function loadDismissed() {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}'); }
    catch { return {}; }
}
function saveDismissed(map) {
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(map)); } catch { }
}

export default function NotificationBanner({ token, onGoToGroups }) {
    const [nearGroups, setNearGroups] = useState([]);
    const [dismissed, setDismissed] = useState(loadDismissed);
    const [collapsed, setCollapsed] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const groups = await api('GET', '/api/groups', null, token);
            const near = groups.filter(g => {
                const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
                return p >= 95;
            });
            setNearGroups(near);
        } catch { }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // Prune stale dismissals (group ids that no longer exist in near-complete set)
    const visible = nearGroups.filter(g => {
        const id = g.id || g._id;
        const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
        const key = `${id}_${p}`;
        return !dismissed[key];
    });

    if (!visible.length) return null;

    function dismiss(group) {
        const id = group.id || group._id;
        const p = pct(totalDone(group.level, group.doneInLevel), totalLessons(group.lang));
        const key = `${id}_${p}`;
        const next = { ...dismissed, [key]: true };
        setDismissed(next);
        saveDismissed(next);
    }

    function dismissAll() {
        const next = { ...dismissed };
        visible.forEach(g => {
            const id = g.id || g._id;
            const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
            next[`${id}_${p}`] = true;
        });
        setDismissed(next);
        saveDismissed(next);
    }

    return (
        <div className="notif-banner-wrap">
            <div className="notif-banner-header">
                <div className="notif-banner-title">
                    <span className="notif-pulse-dot" />
                    <span>
                        {visible.length} group{visible.length > 1 ? 's' : ''} nearly finished
                        <span className="notif-banner-sub"> — please review and delete completed classes</span>
                    </span>
                </div>
                <div className="notif-banner-actions">
                    <button className="notif-btn-link" onClick={dismissAll}>Dismiss all</button>
                    <button
                        className="notif-btn-collapse"
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? '▾' : '▴'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div className="notif-cards">
                    {visible.map(g => {
                        const id = g.id || g._id;
                        const p = pct(totalDone(g.level, g.doneInLevel), totalLessons(g.lang));
                        const isComplete = p >= 100;
                        return (
                            <div key={id} className={`notif-card${isComplete ? ' notif-card--done' : ''}`}>
                                <div className="notif-card-left">
                                    <div className={`notif-pct-badge${isComplete ? ' done' : ''}`}>{p}%</div>
                                    <div>
                                        <div className="notif-card-name">{g.group}</div>
                                        <div className="notif-card-meta">{g.lang} &nbsp;·&nbsp; {g.students} students</div>
                                    </div>
                                </div>
                                <div className="notif-card-right">
                                    {isComplete ? (
                                        <span className="notif-label-done">✓ Complete</span>
                                    ) : (
                                        <span className="notif-label-near">Nearly done</span>
                                    )}
                                    <button
                                        className="notif-goto-btn"
                                        onClick={() => onGoToGroups && onGoToGroups()}
                                        title="Go to All Groups to manage this class"
                                    >
                                        Manage →
                                    </button>
                                    <button
                                        className="notif-dismiss-btn"
                                        onClick={() => dismiss(g)}
                                        title="Dismiss this notification"
                                    >✕</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
