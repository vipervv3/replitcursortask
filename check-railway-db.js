#!/usr/bin/env node

/**
 * Check Railway Database Schema
 * Verifies if the database schema exists and creates it if needed
 */

import { Pool } from 'pg';

const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function checkDatabase() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    if (tablesResult.rows.length === 0) {
      console.log('\n⚠️  No tables found! Creating database schema...');
      
      // Create the schema
      const { execSync } = await import('child_process');
      execSync('node setup-railway-db.js', { stdio: 'inherit' });
      
      console.log('✅ Database schema created!');
    } else {
      console.log('\n✅ Database schema exists!');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);
