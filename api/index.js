require('dotenv/config');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const connectDB = require('../lib/db');
const Teacher = require('../models/Teacher');
const Group = require('../models/Group');
const seed = require('../lib/seed');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use(async (req, _res, next) => {
  // Admin auth doesn't need MongoDB - skip DB connection for it
  if (req.path === '/api/auth/admin') return next();
  try { await connectDB(); await seed(); next(); }
  catch (err) { next(err); }
});

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SALT = 10;
const PC = { HTML: { levels: 1 }, CSS: { levels: 2 }, JavaScript: { levels: 3 }, 'React JS': { levels: 3 }, 'Node JS': { levels: 3 } };
const LPL = 13;
const validLangs = Object.keys(PC);
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin111';
const issueToken = payload => jwt.sign(payload, SECRET, { expiresIn: '8h' });

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization header missing' });
  try { req.user = jwt.verify(header.slice(7), SECRET); next(); }
  catch { res.status(401).json({ error: 'Token invalid or expired' }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

app.get('/api', (_req, res) => res.json({ status: 'ok', message: 'EduTrack API running' }));

app.post('/api/auth/admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (username !== ADMIN_USER || password !== ADMIN_PASS) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: issueToken({ role: 'admin' }) });
});

app.post('/api/auth/teacher', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const teacher = await Teacher.findOne({ username }).select('+hash');
    if (!teacher || !bcrypt.compareSync(password, teacher.hash)) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: issueToken({ role: 'teacher', tid: teacher.id }), teacher: teacher.toJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/teachers', auth, adminOnly, async (_req, res) => {
  try { res.json((await Teacher.find()).map(t => t.toJSON())); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/teachers/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });
    const t = await Teacher.findById(req.user.tid);
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(t.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/teachers', auth, adminOnly, async (req, res) => {
  try {
    const { name, username, password, subject } = req.body;
    if (!name || !username || !password || !subject) return res.status(400).json({ error: 'name, username, password, subject required' });
    if (await Teacher.findOne({ username })) return res.status(409).json({ error: 'Username already taken' });
    const teacher = await Teacher.create({ name, username, hash: bcrypt.hashSync(password, SALT), subject });
    res.status(201).json(teacher.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/teachers/:id', auth, adminOnly, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('+hash');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    const { name, username, password, subject } = req.body;
    if (username && username !== teacher.username && await Teacher.findOne({ username })) return res.status(409).json({ error: 'Username already taken' });
    if (name) teacher.name = name; if (username) teacher.username = username;
    if (subject) teacher.subject = subject; if (password) teacher.hash = bcrypt.hashSync(password, SALT);
    await teacher.save(); res.json(teacher.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/teachers/:id', auth, adminOnly, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    const { deletedCount } = await Group.deleteMany({ tid: req.params.id });
    await teacher.deleteOne();
    res.json({ success: true, deletedGroups: deletedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/groups', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { tid: req.user.tid };
    res.json((await Group.find(filter).sort({ createdAt: 1 })).map(g => g.toJSON()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/groups', auth, async (req, res) => {
  try {
    let { tid, group, lang, time, start, exam, students, level, doneInLevel, days } = req.body;
    if (req.user.role === 'teacher') tid = req.user.tid;
    if (!group || !lang || !time || !start || !exam || !students || !level || !tid) return res.status(400).json({ error: 'All fields required' });
    if (!validLangs.includes(lang)) return res.status(400).json({ error: 'Invalid lang' });
    level = +level; doneInLevel = +(doneInLevel ?? 0);
    const cfg = PC[lang];
    if (level < 1 || level > cfg.levels) return res.status(400).json({ error: 'Invalid level' });
    if (doneInLevel < 0 || doneInLevel > LPL) return res.status(400).json({ error: 'Invalid doneInLevel' });
    if (new Date(exam) <= new Date(start)) return res.status(400).json({ error: 'exam must be after start' });
    if (req.user.role === 'admin' && !(await Teacher.findById(tid))) return res.status(400).json({ error: 'Invalid tid' });
    const g = await Group.create({ tid, group, lang, time, start, exam, students: +students, level, doneInLevel, days: days || 'Every Day' });
    res.status(201).json(g.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/groups/:id', auth, async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role === 'teacher' && g.tid !== req.user.tid) return res.status(403).json({ error: 'Forbidden' });
    if (req.body.lang && !validLangs.includes(req.body.lang)) return res.status(400).json({ error: 'Invalid lang' });
    for (const f of ['group', 'lang', 'time', 'start', 'exam', 'students', 'level', 'doneInLevel', 'days']) if (req.body[f] != null) g[f] = req.body[f];
    await g.save(); res.json(g.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/groups/:id', auth, async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role === 'teacher' && g.tid !== req.user.tid) return res.status(403).json({ error: 'Forbidden' });
    await g.deleteOne(); res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', auth, adminOnly, async (_req, res) => {
  try {
    const allGroups = await Group.find();
    const doneFn = g => (g.level - 1) * LPL + g.doneInLevel;
    const totalFn = g => (PC[g.lang]?.levels || 1) * LPL;
    const avgProgress = allGroups.length ? Math.round(allGroups.reduce((a, g) => a + doneFn(g) / totalFn(g) * 100, 0) / allGroups.length) : 0;
    const byLang = validLangs.map(lang => {
      const gs = allGroups.filter(g => g.lang === lang);
      return { lang, groups: gs.length, students: gs.reduce((a, g) => a + g.students, 0), avgPct: gs.length ? Math.round(gs.reduce((a, g) => a + doneFn(g) / totalFn(g) * 100, 0) / gs.length) : 0 };
    });
    res.json({ totalGroups: allGroups.length, totalTeachers: await Teacher.countDocuments(), totalStudents: allGroups.reduce((a, g) => a + g.students, 0), avgProgress, byLang });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}