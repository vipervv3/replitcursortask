#!/usr/bin/env node

/**
 * Setup Railway PostgreSQL Database
 * Creates the database schema using Drizzle migrations
 */

import { Pool } from 'pg';
import fs from 'fs';

const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    console.log('🔄 Creating database schema...');

    // Read the schema file
    const schemaContent = fs.readFileSync('./shared/schema.ts', 'utf8');
    
    // For now, let's create the tables manually using the schema
    const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  progress INTEGER NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES users(id) NOT NULL,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  project_id UUID REFERENCES projects(id) NOT NULL,
  assignee_id UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  recording_url TEXT,
  transcription TEXT,
  ai_summary TEXT,
  extracted_tasks JSONB,
  created_by_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_type TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date TIMESTAMP,
  recurring_parent_id UUID,
  recurrence_pattern TEXT
);

-- Project Members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  inviter_user_id UUID REFERENCES users(id) NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- Meeting Participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  morning_briefing BOOLEAN NOT NULL DEFAULT TRUE,
  lunch_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  end_of_day_summary BOOLEAN NOT NULL DEFAULT TRUE,
  meeting_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  task_deadline_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ai_insights BOOLEAN NOT NULL DEFAULT TRUE,
  working_hours_start TEXT NOT NULL DEFAULT '09:00',
  working_hours_end TEXT NOT NULL DEFAULT '18:00',
  urgent_only BOOLEAN NOT NULL DEFAULT FALSE,
  outlook_calendar_url TEXT,
  outlook_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- External Meetings table
CREATE TABLE IF NOT EXISTS external_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location TEXT,
  attendees JSONB,
  source TEXT NOT NULL DEFAULT 'outlook',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Authenticators table
CREATE TABLE IF NOT EXISTS authenticators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  credential_device_type TEXT NOT NULL,
  credential_backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  transports JSONB,
  device_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Login Events table
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address TEXT,
  location TEXT,
  session_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

    // Execute the SQL
    await pool.query(createTablesSQL);
    console.log('✅ Database schema created successfully');

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
