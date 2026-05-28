const { Pool } = require('pg');

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
