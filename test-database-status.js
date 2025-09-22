#!/usr/bin/env node

/**
 * Test database connection and status
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL not set');
  process.exit(1);
}

async function testDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Database tables found:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
      console.log(`\n✅ Database is set up with ${result.rows.length} tables`);
    } else {
      console.log('❌ No tables found - database setup needed');
    }

    client.release();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
