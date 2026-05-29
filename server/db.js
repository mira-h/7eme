const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scoutdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

const init = async () => {
  // Retry loop — wait for Postgres to be ready
  for (let i = 0; i < 10; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS registrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          age INTEGER NOT NULL,
          parent TEXT,
          phone TEXT,
          email TEXT NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS photos (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          caption TEXT,
          position INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS units (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          unit_id INTEGER REFERENCES units(id)
        );
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          age INTEGER,
          unit_id INTEGER REFERENCES units(id),
          section TEXT,
          group_type TEXT,
          group_name TEXT,
          current_status TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS progression_events (
          id SERIAL PRIMARY KEY,
          member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          event_name TEXT,
          details TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`
        ALTER TABLE members ADD COLUMN IF NOT EXISTS section TEXT;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS group_type TEXT;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS group_name TEXT;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS current_status TEXT;
      `);

      const { rowCount } = await pool.query('SELECT 1 FROM photos LIMIT 1');
      if (rowCount === 0) {
        await pool.query(`
          INSERT INTO photos (url, caption, position) VALUES
          ('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', 'Summer Camp 2024', 0),
          ('https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80', 'Night Hike', 1),
          ('https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 'Mountain Trail', 2),
          ('https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&q=80', 'Team Building', 3),
          ('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', 'Peak Conquest', 4),
          ('https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=800&q=80', 'Campfire Stories', 5)
        `);
      }

      // Seed default units and users if none exist
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (+userCountRes.rows[0].count === 0) {
        // seed units from env or defaults
        const unitsEnv = process.env.UNITS || 'Unit A,Unit B';
        const units = unitsEnv.split(',').map(s => s.trim()).filter(Boolean);

        for (const uName of units) {
          await pool.query('INSERT INTO units (name) VALUES ($1) ON CONFLICT DO NOTHING', [uName]);
        }

        // seed superadmin
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
        const adminHash = bcrypt.hashSync(adminPass, 8);
        await pool.query('INSERT INTO users (username,password,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', ['admin', adminHash, 'superadmin']);

        // seed chiefs from env: format username:password:unitName,username2:password2:unitName2
        const chiefsEnv = process.env.CHIEFS || `chief1:${process.env.CHIEF_PASSWORD || 'chiefpass'}:${units[0]}`;
        const chiefs = chiefsEnv.split(',').map(s => s.trim()).filter(Boolean);
        for (const c of chiefs) {
          const parts = c.split(':');
          const [uname, upass, unitName] = parts;
          if (!uname || !upass) continue;
          const unitRow = (await pool.query('SELECT id FROM units WHERE name=$1 LIMIT 1', [unitName || units[0]])).rows[0];
          const unitId = unitRow ? unitRow.id : null;
          const hash = bcrypt.hashSync(upass, 8);
          await pool.query('INSERT INTO users (username,password,role,unit_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [uname, hash, 'chief', unitId]);
        }
      }

      console.log('✅ Database ready');
      return;
    } catch (err) {
      console.log(`⏳ Waiting for database... (attempt ${i + 1}/10)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('❌ Could not connect to database after 10 attempts');
};

module.exports = { pool, init };
