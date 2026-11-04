const fs = require('fs');
const path = require('path');

// Ensure packages installed in backend/node_modules or root can be required
module.paths.push(path.join(__dirname, '../backend/node_modules'));
module.paths.push(path.join(__dirname, '../node_modules'));

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load env from backend/.env or root .env if present
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || (
  process.env.DB_HOST ? `postgresql://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}` : null
);

async function runSeed() {
  if (!connectionString || connectionString === 'memory') {
    console.log('⚡ No live DATABASE_URL provided. The application is configured with zero-config in-memory database fallback for immediate testing.');
    console.log('🔑 Test Logins:');
    console.log('   Admin:         admin@campus.edu / admin123');
    console.log('   Predegree:     predegree@campus.edu / student123');
    console.log('   Undergraduate: undergrad@campus.edu / student123');
    return;
  }

  const isCloudHost = connectionString.includes('render.com') ||
                      connectionString.includes('supabase') ||
                      connectionString.includes('neon.tech') ||
                      connectionString.includes('sslmode=require') ||
                      connectionString.includes('ssl=true') ||
                      process.env.NODE_ENV === 'production' ||
                      process.env.DB_SSL === 'true';

  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl: isCloudHost ? { rejectUnauthorized: false } : false
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('Executing database schema.sql...');
    await pool.query(schemaSql);
    console.log('✅ Schema applied successfully.');

    console.log('Executing database seed.sql...');
    await pool.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    console.log('\n🎉 Database setup complete!');
    console.log('Test Logins:');
    console.log('   Admin:         admin@campus.edu / admin123');
    console.log('   Predegree:     predegree@campus.edu / student123');
    console.log('   Undergraduate: undergrad@campus.edu / student123');
  } catch (err) {
    console.error('❌ Error executing database setup script:', err);
  } finally {
    await pool.end();
  }
}

runSeed();
