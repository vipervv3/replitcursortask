#!/usr/bin/env node

/**
 * Import Essential Data to Railway PostgreSQL
 * Imports only the most important data for a working app
 */

import { Pool } from 'pg';
import fs from 'fs';

const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function importEssentialData() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Import users first (most important)
    await importUsers(pool);
    
    // Import projects
    await importProjects(pool);
    
    // Import tasks
    await importTasks(pool);
    
    // Import meetings
    await importMeetings(pool);
    
    // Import user settings
    await importUserSettings(pool);

    console.log('\n🎉 Essential data import completed!');
    console.log('🔍 Verifying imported data...');

    // Verify data
    const tables = ['users', 'projects', 'tasks', 'meetings', 'user_settings'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📊 ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`⚠️  Could not verify ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function importUsers(pool) {
  console.log('\n🔄 Importing users...');
  
  const csvFile = 'exported_users.csv';
  if (!fs.existsSync(csvFile)) {
    console.log('⚠️  users.csv not found, skipping');
    return;
  }

  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    console.log('⚠️  No user data found');
    return;
  }

  const columns = lines[0].split(',');
  const dataRows = lines.slice(1);

  console.log(`📊 Found ${dataRows.length} users to import`);

  // Clear existing data
  await pool.query('DELETE FROM users');
  console.log('🗑️  Cleared existing users');

  // Import users
  for (const row of dataRows) {
    const values = parseCSVRow(row);
    
    if (values.length >= 4) {
      const [id, username, email, password, name, role, avatar, createdAt] = values;
      
      try {
        await pool.query(`
          INSERT INTO users (id, username, email, password, name, role, avatar, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [id, username, email, password, name, role || 'member', avatar, createdAt]);
      } catch (error) {
        console.log(`⚠️  Failed to import user ${username}: ${error.message}`);
      }
    }
  }

  console.log('✅ Users imported successfully');
}

async function importProjects(pool) {
  console.log('\n🔄 Importing projects...');
  
  const csvFile = 'exported_projects.csv';
  if (!fs.existsSync(csvFile)) {
    console.log('⚠️  projects.csv not found, skipping');
    return;
  }

  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    console.log('⚠️  No project data found');
    return;
  }

  const columns = lines[0].split(',');
  const dataRows = lines.slice(1);

  console.log(`📊 Found ${dataRows.length} projects to import`);

  // Clear existing data
  await pool.query('DELETE FROM projects');
  console.log('🗑️  Cleared existing projects');

  // Import projects
  for (const row of dataRows) {
    const values = parseCSVRow(row);
    
    if (values.length >= 6) {
      const [id, name, description, status, progress, ownerId, dueDate, createdAt, updatedAt] = values;
      
      try {
        await pool.query(`
          INSERT INTO projects (id, name, description, status, progress, owner_id, due_date, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [id, name, description, status || 'active', parseInt(progress) || 0, ownerId, dueDate, createdAt, updatedAt]);
      } catch (error) {
        console.log(`⚠️  Failed to import project ${name}: ${error.message}`);
      }
    }
  }

  console.log('✅ Projects imported successfully');
}

async function importTasks(pool) {
  console.log('\n🔄 Importing tasks...');
  
  const csvFile = 'exported_tasks.csv';
  if (!fs.existsSync(csvFile)) {
    console.log('⚠️  tasks.csv not found, skipping');
    return;
  }

  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    console.log('⚠️  No task data found');
    return;
  }

  const columns = lines[0].split(',');
  const dataRows = lines.slice(1);

  console.log(`📊 Found ${dataRows.length} tasks to import`);

  // Clear existing data
  await pool.query('DELETE FROM tasks');
  console.log('🗑️  Cleared existing tasks');

  // Import tasks
  for (const row of dataRows) {
    const values = parseCSVRow(row);
    
    if (values.length >= 6) {
      const [id, title, description, status, priority, projectId, assigneeId, updatedBy, dueDate, createdAt, updatedAt] = values;
      
      try {
        await pool.query(`
          INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, updated_by, due_date, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [id, title, description, status || 'todo', priority || 'medium', projectId, assigneeId, updatedBy, dueDate, createdAt, updatedAt]);
      } catch (error) {
        console.log(`⚠️  Failed to import task ${title}: ${error.message}`);
      }
    }
  }

  console.log('✅ Tasks imported successfully');
}

async function importMeetings(pool) {
  console.log('\n🔄 Importing meetings...');
  
  const csvFile = 'exported_meetings.csv';
  if (!fs.existsSync(csvFile)) {
    console.log('⚠️  meetings.csv not found, skipping');
    return;
  }

  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    console.log('⚠️  No meeting data found');
    return;
  }

  const columns = lines[0].split(',');
  const dataRows = lines.slice(1);

  console.log(`📊 Found ${dataRows.length} meetings to import`);

  // Clear existing data
  await pool.query('DELETE FROM meetings');
  console.log('🗑️  Cleared existing meetings');

  // Import meetings
  for (const row of dataRows) {
    const values = parseCSVRow(row);
    
    if (values.length >= 6) {
      const [id, title, description, projectId, scheduledAt, duration, recordingUrl, transcription, aiSummary, extractedTasks, createdById, createdAt, isRecurring, recurrenceType, recurrenceInterval, recurrenceEndDate, recurringParentId, recurrencePattern] = values;
      
      try {
        await pool.query(`
          INSERT INTO meetings (id, title, description, project_id, scheduled_at, duration, recording_url, transcription, ai_summary, extracted_tasks, created_by_id, created_at, is_recurring, recurrence_type, recurrence_interval, recurrence_end_date, recurring_parent_id, recurrence_pattern) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [id, title, description, projectId, scheduledAt, parseInt(duration) || 60, recordingUrl, transcription, aiSummary, extractedTasks, createdById, createdAt, isRecurring === 'true', recurrenceType, parseInt(recurrenceInterval) || 1, recurrenceEndDate, recurringParentId, recurrencePattern]);
      } catch (error) {
        console.log(`⚠️  Failed to import meeting ${title}: ${error.message}`);
      }
    }
  }

  console.log('✅ Meetings imported successfully');
}

async function importUserSettings(pool) {
  console.log('\n🔄 Importing user settings...');
  
  const csvFile = 'exported_user_settings.csv';
  if (!fs.existsSync(csvFile)) {
    console.log('⚠️  user_settings.csv not found, skipping');
    return;
  }

  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    console.log('⚠️  No user settings data found');
    return;
  }

  const columns = lines[0].split(',');
  const dataRows = lines.slice(1);

  console.log(`📊 Found ${dataRows.length} user settings to import`);

  // Clear existing data
  await pool.query('DELETE FROM user_settings');
  console.log('🗑️  Cleared existing user settings');

  // Import user settings
  for (const row of dataRows) {
    const values = parseCSVRow(row);
    
    if (values.length >= 3) {
      const [id, userId, emailNotifications, morningBriefing, lunchReminder, endOfDaySummary, meetingReminders, taskDeadlineAlerts, aiInsights, workingHoursStart, workingHoursEnd, urgentOnly, outlookCalendarUrl, outlookCalendarEnabled, updatedAt] = values;
      
      try {
        await pool.query(`
          INSERT INTO user_settings (id, user_id, email_notifications, morning_briefing, lunch_reminder, end_of_day_summary, meeting_reminders, task_deadline_alerts, ai_insights, working_hours_start, working_hours_end, urgent_only, outlook_calendar_url, outlook_calendar_enabled, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [id, userId, emailNotifications === 'true', morningBriefing === 'true', lunchReminder === 'true', endOfDaySummary === 'true', meetingReminders === 'true', taskDeadlineAlerts === 'true', aiInsights === 'true', workingHoursStart || '09:00', workingHoursEnd || '18:00', urgentOnly === 'true', outlookCalendarUrl, outlookCalendarEnabled === 'true', updatedAt]);
      } catch (error) {
        console.log(`⚠️  Failed to import user settings for user ${userId}: ${error.message}`);
      }
    }
  }

  console.log('✅ User settings imported successfully');
}

function parseCSVRow(row) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

importEssentialData().catch(console.error);
