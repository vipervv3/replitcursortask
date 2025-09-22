#!/usr/bin/env node

/**
 * Setup Railway Database Schema
 * Creates the database schema using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    if (tablesResult.rows.length === 0) {
      console.log('\n⚠️  No tables found! Creating database schema...');
      
      // Create basic tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          avatar TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          progress INTEGER NOT NULL DEFAULT 0,
          owner_id UUID NOT NULL REFERENCES users(id),
          due_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          priority TEXT NOT NULL DEFAULT 'medium',
          project_id UUID REFERENCES projects(id),
          assignee_id UUID REFERENCES users(id),
          due_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log('✅ Basic database schema created!');
    } else {
      console.log('\n✅ Database schema exists!');
    }

    client.release();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSchema().catch(console.error);
