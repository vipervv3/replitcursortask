#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Tests connection to your Neon database
 */

import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cqWmsSPTpt21@ep-quiet-art-aeg9vhai.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log('📊 Current time:', result.rows[0].current_time);
    console.log('📊 PostgreSQL version:', result.rows[0].postgres_version);
    
    // Test if your tables exist
    console.log('\n🔄 Checking for existing tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Found existing tables:');
      tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('⚠️  No tables found - database is empty');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);
