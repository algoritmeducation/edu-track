export const PC = {
    HTML: { levels: 1, color: '#ff6b4a' },
    CSS: { levels: 2, color: '#6b8fff' },
    JavaScript: { levels: 3, color: '#f5c518' },
    'React JS': { levels: 3, color: '#61dafb' },
    'Node JS': { levels: 3, color: '#78c97a' },
};

export const LPL = 13;
export const VALID_LANGS = Object.keys(PC);

export const totalLessons = (lang) => (PC[lang]?.levels || 1) * LPL;
export const totalDone = (lv, dim) => (lv - 1) * LPL + (dim || 0);
export const pct = (d, t) => (t ? Math.min(100, Math.round((d / t) * 100)) : 0);

export const tagCls = (lang) =>
    ({ HTML: 'HTML', CSS: 'CSS', JavaScript: 'JavaScript', 'React JS': 'React', 'Node JS': 'Node' }[lang] || 'HTML');

export const fmtDate = (d) => {
    if (!d) return '-';
    const [y, m, dy] = d.split('-');
    return dy + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y;
};
