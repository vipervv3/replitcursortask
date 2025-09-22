#!/usr/bin/env node

/**
 * Database Migration Script for Railway
 * 
 * This script helps migrate your existing data to Railway PostgreSQL
 * 
 * Usage:
 * 1. Set your new Railway DATABASE_URL in environment variables
 * 2. Run: node migrate-to-railway.js
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const NEW_DATABASE_URL = process.env.DATABASE_URL;

if (!NEW_DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('Set it to your Railway PostgreSQL connection string');
  process.exit(1);
}

async function migrateDatabase() {
  const pool = new Pool({
    connectionString: NEW_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if production_backup.sql exists
    const backupFile = path.join(process.cwd(), 'production_backup.sql');
    if (!fs.existsSync(backupFile)) {
      console.log('⚠️  production_backup.sql not found');
      console.log('Please ensure you have exported your data from the current database');
      return;
    }

    console.log('📄 Found production_backup.sql');
    console.log('🔄 Reading backup file...');
    
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    
    // Split the backup into individual statements
    const statements = backupContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected): ${error.message}`);
        }
      }
    }

    console.log('🎉 Database migration completed!');
    console.log('🔍 Verifying data...');

    // Verify some key tables
    const tables = ['users', 'projects', 'tasks', 'meetings'];
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📊 ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`⚠️  Could not verify ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateDatabase().catch(console.error);
