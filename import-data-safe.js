#!/usr/bin/env node

/**
 * Safe Import Data to Railway PostgreSQL
 * Handles foreign key constraints by importing in the correct order
 */

import { Pool } from 'pg';
import fs from 'fs';

const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function importDataSafe() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Disable foreign key checks temporarily
    console.log('🔧 Disabling foreign key constraints...');
    await pool.query('SET session_replication_role = replica;');

    // Clear all tables in reverse dependency order
    console.log('🗑️  Clearing all existing data...');
    const clearOrder = [
      'meeting_participants', 'meetings', 'tasks', 'project_members', 'invitations', 
      'notifications', 'user_settings', 'external_meetings', 'login_events', 'authenticators',
      'projects', 'users'
    ];
    
    for (const table of clearOrder) {
      try {
        await pool.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }

    // Import in dependency order
    console.log('\n🔄 Importing data in dependency order...');
    
    // 1. Users (no dependencies)
    await importTable('users', pool);
    
    // 2. Projects (depends on users)
    await importTable('projects', pool);
    
    // 3. Tasks (depends on projects and users)
    await importTable('tasks', pool);
    
    // 4. Meetings (depends on projects and users)
    await importTable('meetings', pool);
    
    // 5. User settings (depends on users)
    await importTable('user_settings', pool);
    
    // 6. Project members (depends on projects and users)
    await importTable('project_members', pool);
    
    // 7. Notifications (depends on users)
    await importTable('notifications', pool);
    
    // 8. External meetings (depends on users and projects)
    await importTable('external_meetings', pool);
    
    // 9. Login events (depends on users)
    await importTable('login_events', pool);
    
    // 10. Invitations (depends on projects and users)
    await importTable('invitations', pool);
    
    // 11. Meeting participants (depends on meetings and users)
    await importTable('meeting_participants', pool);
    
    // 12. Authenticators (depends on users)
    await importTable('authenticators', pool);

    // Re-enable foreign key checks
    console.log('🔧 Re-enabling foreign key constraints...');
    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('\n🎉 Data import completed!');
    console.log('🔍 Verifying imported data...');

    // Verify data
    const tables = ['users', 'projects', 'tasks', 'meetings', 'user_settings', 'project_members', 'notifications', 'external_meetings', 'login_events', 'invitations', 'meeting_participants', 'authenticators'];
    
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

async function importTable(tableName, pool) {
  const csvFile = `exported_${tableName}.csv`;
  
  if (!fs.existsSync(csvFile)) {
    console.log(`⚠️  ${csvFile} not found, skipping ${tableName}`);
    return;
  }

  console.log(`\n🔄 Importing ${tableName}...`);

  try {
    const csvContent = fs.readFileSync(csvFile, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      console.log(`⚠️  ${tableName} is empty, skipping`);
      return;
    }

    const columns = lines[0].split(',');
    const dataRows = lines.slice(1);

    console.log(`📊 Found ${dataRows.length} rows to import`);

    // Import data row by row
    let successCount = 0;
    for (const row of dataRows) {
      const values = parseCSVRow(row);
      
      if (values.length !== columns.length) {
        console.log(`⚠️  Skipping row with mismatched columns: ${values.length} vs ${columns.length}`);
        continue;
      }

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      try {
        await pool.query(query, values);
        successCount++;
      } catch (error) {
        console.log(`⚠️  Failed to insert row: ${error.message}`);
      }
    }

    console.log(`✅ Successfully imported ${successCount}/${dataRows.length} rows to ${tableName}`);

  } catch (error) {
    console.log(`⚠️  Failed to import ${tableName}: ${error.message}`);
  }
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

importDataSafe().catch(console.error);
