const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { pool, init } = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// ── File upload setup ─────────────────────────────────────
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// ── Auth middleware ───────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Admin login ───────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  // Username login (users table)
  if (username) {
    const result = await pool.query('SELECT * FROM users WHERE username=$1 LIMIT 1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password || '', user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, unit_id: user.unit_id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }

  // Backwards-compatible admin password (env)
  const pass = password || '';
  if (pass === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }

  res.status(401).json({ error: 'Wrong password' });
});

// Return token info
app.get('/api/me', auth, (req, res) => {
  res.json(req.user);
});

// ── File upload endpoint ──────────────────────────────────
app.post('/api/upload', auth, upload.single('photo'), (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ── Registrations ─────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { name, age, parent, phone, email, message } = req.body;
  if (!name || !age || !email)
    return res.status(400).json({ error: 'Name, age and email are required' });
  try {
    const result = await pool.query(
      `INSERT INTO registrations (name, age, parent, phone, email, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, age, parent, phone, email, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/registrations', auth, async (req, res) => {
  // only superadmin can access full registrations list
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const result = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
  res.json(result.rows);
});

app.delete('/api/registrations/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM registrations WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Photos ────────────────────────────────────────────────
app.get('/api/photos', async (req, res) => {
  const result = await pool.query('SELECT * FROM photos ORDER BY position');
  res.json(result.rows);
});

// ── Progression / members endpoints ─────────────────────
app.get('/api/progression', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role === 'superadmin') {
    const r = await pool.query('SELECT m.*, u.name AS unit_name FROM members m LEFT JOIN units u ON u.id=m.unit_id ORDER BY created_at DESC');
    return res.json(r.rows);
  }
  if (req.user.role === 'chief') {
    const r = await pool.query('SELECT m.*, u.name AS unit_name FROM members m LEFT JOIN units u ON u.id=m.unit_id WHERE m.unit_id=$1 ORDER BY created_at DESC', [req.user.unit_id]);
    return res.json(r.rows);
  }
  res.status(403).json({ error: 'Forbidden' });
});

app.get('/api/progression/:id/history', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  if (req.user.role === 'chief') {
    const m = await pool.query('SELECT unit_id FROM members WHERE id=$1', [id]);
    if (!m.rows[0] || m.rows[0].unit_id !== req.user.unit_id) return res.status(403).json({ error: 'Forbidden' });
  }
  const events = await pool.query('SELECT * FROM progression_events WHERE member_id=$1 ORDER BY created_at DESC', [id]);
  res.json(events.rows);
});

app.post('/api/progression', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, age, unit_id, section, group_type, group_name, current_status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  let targetUnit = unit_id;
  if (req.user.role === 'chief') targetUnit = req.user.unit_id;
  if (!targetUnit) return res.status(400).json({ error: 'Unit required' });
  const result = await pool.query(
    'INSERT INTO members (name, age, unit_id, section, group_type, group_name, current_status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [name, age || null, targetUnit, section || null, group_type || null, group_name || null, current_status || null, notes || null]
  );
  res.json(result.rows[0]);
});

app.post('/api/progression/:id/event', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { event_type, event_name, details } = req.body;
  if (!event_type || !event_name) return res.status(400).json({ error: 'event_type and event_name required' });
  if (req.user.role === 'chief') {
    const m = await pool.query('SELECT unit_id FROM members WHERE id=$1', [id]);
    if (!m.rows[0] || m.rows[0].unit_id !== req.user.unit_id) return res.status(403).json({ error: 'Forbidden' });
  }
  const event = await pool.query(
    'INSERT INTO progression_events (member_id, event_type, event_name, details) VALUES ($1,$2,$3,$4) RETURNING *',
    [id, event_type, event_name, details || null]
  );
  const statusTypes = ['promesse', 'rank', 'status', 'jalon'];
  if (statusTypes.includes(event_type)) {
    await pool.query('UPDATE members SET current_status=$1 WHERE id=$2', [event_name, id]);
  }
  res.json(event.rows[0]);
});

app.put('/api/progression/:id', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { name, age, section, group_type, group_name, current_status, notes } = req.body;
  // chiefs can only update members in their unit
  if (req.user.role === 'chief') {
    const m = await pool.query('SELECT unit_id FROM members WHERE id=$1', [id]);
    if (!m.rows[0] || m.rows[0].unit_id !== req.user.unit_id) return res.status(403).json({ error: 'Forbidden' });
  }
  const result = await pool.query(
    'UPDATE members SET name=$1, age=$2, section=$3, group_type=$4, group_name=$5, current_status=$6, notes=$7 WHERE id=$8 RETURNING *',
    [name, age || null, section || null, group_type || null, group_name || null, current_status || null, notes || null, id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/progression/:id', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  if (req.user.role === 'chief') {
    const m = await pool.query('SELECT unit_id FROM members WHERE id=$1', [id]);
    if (!m.rows[0] || m.rows[0].unit_id !== req.user.unit_id) return res.status(403).json({ error: 'Forbidden' });
  }
  await pool.query('DELETE FROM members WHERE id=$1', [id]);
  res.json({ success: true });
});

// ── Units management (superadmin) ───────────────────────
app.get('/api/units', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const r = await pool.query('SELECT * FROM units ORDER BY name');
  res.json(r.rows);
});

app.post('/api/units', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = await pool.query('INSERT INTO units (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *', [name]);
  res.json(r.rows[0] || null);
});

app.delete('/api/units/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM units WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Users management (superadmin) ───────────────────────
app.get('/api/users', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const r = await pool.query('SELECT u.id, u.username, u.role, u.unit_id, un.name AS unit_name FROM users u LEFT JOIN units un ON un.id=u.unit_id ORDER BY u.username');
  res.json(r.rows);
});

app.post('/api/users', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, role, unit_id } = req.body || {};
  if (!username || !password || !role) return res.status(400).json({ error: 'username,password,role required' });
  if (role === 'chief' && !unit_id) return res.status(400).json({ error: 'unit_id required for chief' });
  const hash = bcrypt.hashSync(password, 8);
  const insert = await pool.query(
    'INSERT INTO users (username,password,role,unit_id) VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING RETURNING id',
    [username, hash, role, unit_id || null]
  );
  const existing = await pool.query('SELECT u.id, u.username, u.role, u.unit_id, un.name AS unit_name FROM users u LEFT JOIN units un ON un.id=u.unit_id WHERE u.username=$1 LIMIT 1', [username]);
  res.json(existing.rows[0] || null);
});

app.delete('/api/users/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

app.post('/api/photos', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { url, caption } = req.body;
  const pos = await pool.query('SELECT COALESCE(MAX(position)+1,0) AS p FROM photos');
  const result = await pool.query(
    'INSERT INTO photos (url, caption, position) VALUES ($1,$2,$3) RETURNING *',
    [url, caption, pos.rows[0].p]
  );
  res.json(result.rows[0]);
});

app.put('/api/photos/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { url, caption } = req.body;
  const result = await pool.query(
    'UPDATE photos SET url=$1, caption=$2 WHERE id=$3 RETURNING *',
    [url, caption, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/photos/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  // Also delete the file if it was uploaded (not an external URL)
  const row = await pool.query('SELECT url FROM photos WHERE id=$1', [req.params.id]);
  if (row.rows[0]?.url?.startsWith('/uploads/')) {
    const filePath = path.join(uploadDir, path.basename(row.rows[0].url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await pool.query('DELETE FROM photos WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────
init().then(() => {
  app.listen(process.env.PORT, () =>
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
  );
});