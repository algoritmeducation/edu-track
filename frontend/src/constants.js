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
 * Compute the exam date (last lesson day) starting from startDateStr,
 * counting LPL valid lesson days per the schedule. Returns 'YYYY-MM-DD'.
 */
export function calcExamDate(startDateStr, scheduleMode) {
    const date = new Date(startDateStr);
    let lessonsCount = 1;
    while (lessonsCount < LPL) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day === 0) continue;
        if (scheduleMode === 'Even Days' && ![2, 4, 6].includes(day)) continue;
        if (scheduleMode === 'Odd Days' && ![1, 3, 5].includes(day)) continue;
        lessonsCount++;
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const fmtDate = (d) => {
    if (!d) return '-';
    const [y, m, dy] = d.split('-');
    return dy + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y;
};
