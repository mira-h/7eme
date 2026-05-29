const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { pool, init } = require('./db');

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
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Admin login ───────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// ── File upload endpoint ──────────────────────────────────
app.post('/api/upload', auth, upload.single('photo'), (req, res) => {
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
  const result = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
  res.json(result.rows);
});

app.delete('/api/registrations/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM registrations WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Photos ────────────────────────────────────────────────
app.get('/api/photos', async (req, res) => {
  const result = await pool.query('SELECT * FROM photos ORDER BY position');
  res.json(result.rows);
});

app.post('/api/photos', auth, async (req, res) => {
  const { url, caption } = req.body;
  const pos = await pool.query('SELECT COALESCE(MAX(position)+1,0) AS p FROM photos');
  const result = await pool.query(
    'INSERT INTO photos (url, caption, position) VALUES ($1,$2,$3) RETURNING *',
    [url, caption, pos.rows[0].p]
  );
  res.json(result.rows[0]);
});

app.put('/api/photos/:id', auth, async (req, res) => {
  const { url, caption } = req.body;
  const result = await pool.query(
    'UPDATE photos SET url=$1, caption=$2 WHERE id=$3 RETURNING *',
    [url, caption, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/photos/:id', auth, async (req, res) => {
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