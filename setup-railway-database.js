#!/usr/bin/env node

/**
 * Setup Railway PostgreSQL Database Schema
 * This script creates all necessary tables for AI ProjectHub
 */

import { Pool } from 'pg';

console.log('🚀 Setting up Railway PostgreSQL Database...');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.log('Please set DATABASE_URL in Railway dashboard → Variables');
  process.exit(1);
}

console.log('📊 Database URL found:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

async function setupDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    console.log('🔄 Creating database schema...');

    // Create all tables using raw SQL
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
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        progress INTEGER NOT NULL DEFAULT 0,
        owner_id UUID REFERENCES users(id) NOT NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        project_id UUID REFERENCES projects(id),
        assigned_to UUID REFERENCES users(id),
        created_by UUID REFERENCES users(id) NOT NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        duration INTEGER,
        transcript TEXT,
        summary TEXT,
        project_id UUID REFERENCES projects(id),
        created_by UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS external_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        duration INTEGER,
        transcript TEXT,
        summary TEXT,
        created_by UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
        theme TEXT DEFAULT 'light',
        notifications BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      )
    `);

    console.log('✅ Database schema created successfully!');
    console.log('📋 Created tables:');
    console.log('  - users');
    console.log('  - projects');
    console.log('  - tasks');
    console.log('  - meetings');
    console.log('  - external_meetings');
    console.log('  - user_settings');
    console.log('  - project_members');

    // Test the connection by counting tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Database tables:', result.rows.map(row => row.table_name).join(', '));

    client.release();
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
