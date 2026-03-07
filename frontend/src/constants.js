export const PC = {
    // Web Development
    'HTML': { levels: 1, color: '#ff6b4a', category: 'Web Development' },
    'CSS': { levels: 2, color: '#6b8fff', category: 'Web Development' },
    'JavaScript': { levels: 3, color: '#f5c518', category: 'Web Development' },
    'React JS': { levels: 3, color: '#61dafb', category: 'Web Development' },
    'Node JS': { levels: 3, color: '#78c97a', category: 'Web Development' },
    // IT Kids
    'Python (Kids)': { levels: 3, color: '#306998', category: 'IT Kids' },
    'Scratch': { levels: 3, color: '#ff8f00', category: 'IT Kids' },
    // Computer Literacy
    'Computer Literacy': { levels: 2, color: '#4caf50', category: 'Computer Literacy' },
    // Graphic Design
    'Graphic Design': { levels: 6, color: '#e91e63', category: 'Graphic Design' },
    // Cyber Security
    'Cyber Security': { levels: 8, color: '#607d8b', category: 'Cyber Security' },
    // Python Backend
    'Python Backend': { levels: 9, color: '#3776ab', category: 'Python Backend' },
    // AI
    'AI': { levels: 12, color: '#9c27b0', category: 'AI' },
    // SMM
    'Marketing': { levels: 2, color: '#f44336', category: 'SMM' },
    'Mobilography': { levels: 2, color: '#ff9800', category: 'SMM' },
};

export const MODULES = {
    'Web Development': ['HTML', 'CSS', 'JavaScript', 'React JS', 'Node JS'],
    'IT Kids': ['Python (Kids)', 'Scratch'],
    'Computer Literacy': ['Computer Literacy'],
    'Graphic Design': ['Graphic Design'],
    'Cyber Security': ['Cyber Security'],
    'Python Backend': ['Python Backend'],
    'AI': ['AI'],
    'SMM': ['Marketing', 'Mobilography'],
};

export const LPL = 13;
export const VALID_LANGS = Object.keys(PC);

export const totalLessons = (lang) => (PC[lang]?.levels || 1) * LPL;
export const totalDone = (lv, dim) => (lv - 1) * LPL + (dim || 0);
export const pct = (d, t) => (t ? Math.min(100, Math.round((d / t) * 100)) : 0);

export const tagCls = (lang) => {
    const map = {
        'HTML': 'HTML', 'CSS': 'CSS', 'JavaScript': 'JavaScript', 'React JS': 'React', 'Node JS': 'Node',
        'Python (Kids)': 'Python', 'Scratch': 'Scratch',
        'Computer Literacy': 'CompLit',
        'Graphic Design': 'GraphicDesign',
        'Cyber Security': 'CyberSec',
        'Python Backend': 'PythonBack',
        'AI': 'AI',
        'Marketing': 'Marketing',
        'Mobilography': 'Mobilography',
    };
    return map[lang] || 'HTML';
};

/**
 * Count lesson sessions from startDateStr up to and including today,
 * following the group's Odd/Even/Every Day schedule (Sunday always skipped).
 */
export function computeElapsedLessons(startDateStr, daysSchedule) {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start > today) return 0;
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= today) {
        const dow = cursor.getDay(); // 0=Sun,1=Mon,...,6=Sat
        if (dow !== 0) {
            if (daysSchedule === 'Odd Days' && [1, 3, 5].includes(dow)) count++;
            else if (daysSchedule === 'Even Days' && [2, 4, 6].includes(dow)) count++;
            else if (daysSchedule === 'Every Day') count++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}

/**
 * Given a group object, compute where it should be today based purely on
 * the calendar. Returns { level, doneInLevel, totalDone }.
 * Capped at the course's maximum total lessons.
 */
export function autoProgress(group) {
    const elapsed = computeElapsedLessons(group.start, group.days);
    const maxTotal = totalLessons(group.lang);
    const clamped = Math.min(elapsed, maxTotal);
    if (clamped === 0) return { level: group.level, doneInLevel: group.doneInLevel, totalDone: totalDone(group.level, group.doneInLevel) };
    const level = Math.ceil(clamped / LPL) || 1;
    const doneInLevel = clamped - (level - 1) * LPL;
    return { level, doneInLevel, totalDone: clamped };
}

export const fmtDate = (d) => {
    if (!d) return '-';
    const [y, m, dy] = d.split('-');
    return dy + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y;
};
