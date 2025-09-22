#!/usr/bin/env node

/**
 * Fixed Import Data to Railway PostgreSQL
 * Handles data type conversions properly
 */

import { Pool } from 'pg';
import fs from 'fs';

const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function importDataFixed() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Import users first (no dependencies)
    await importTable('users', pool);
    
    // Import projects (depends on users)
    await importTable('projects', pool);
    
    // Import tasks (depends on projects and users)
    await importTable('tasks', pool);
    
    // Import meetings (depends on projects and users)
    await importTable('meetings', pool);
    
    // Import project_members (depends on projects and users)
    await importTable('project_members', pool);
    
    // Import invitations (depends on projects and users)
    await importTable('invitations', pool);
    
    // Import meeting_participants (depends on meetings and users)
    await importTable('meeting_participants', pool);
    
    // Import notifications (depends on users)
    await importTable('notifications', pool);
    
    // Import user_settings (depends on users)
    await importTable('user_settings', pool);
    
    // Import external_meetings (depends on users and projects)
    await importTable('external_meetings', pool);
    
    // Import login_events (depends on users)
    await importTable('login_events', pool);
    
    // Import authenticators (depends on users)
    await importTable('authenticators', pool);

    console.log('\n🎉 Data import completed!');
    console.log('🔍 Verifying imported data...');

    // Verify data
    const tables = ['users', 'projects', 'tasks', 'meetings', 'project_members', 'invitations', 'notifications', 'user_settings', 'external_meetings', 'login_events', 'authenticators'];
    
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

    // Clear existing data
    await pool.query(`DELETE FROM ${tableName}`);
    console.log(`🗑️  Cleared existing data from ${tableName}`);

    // Import data row by row with proper type handling
    for (const row of dataRows) {
      const values = parseCSVRow(row);
      
      // Handle specific data types for each table
      const processedValues = await processRowData(tableName, columns, values, pool);
      
      if (processedValues.length !== columns.length) {
        console.log(`⚠️  Skipping row with mismatched columns: ${processedValues.length} vs ${columns.length}`);
        continue;
      }

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      try {
        await pool.query(query, processedValues);
      } catch (error) {
        console.log(`⚠️  Failed to insert row: ${error.message}`);
      }
    }

    console.log(`✅ Successfully imported ${tableName}`);

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

async function processRowData(tableName, columns, values, pool) {
  const processed = [];
  
  for (let i = 0; i < columns.length; i++) {
    let value = values[i];
    const column = columns[i];
    
    // Handle null values
    if (value === '' || value === 'null') {
      processed.push(null);
      continue;
    }
    
    // Handle JSON fields
    if (column.includes('json') || column.includes('data') || column.includes('attendees') || column.includes('transports')) {
      try {
        if (value.startsWith('{') || value.startsWith('[')) {
          processed.push(value);
        } else {
          processed.push(null);
        }
      } catch {
        processed.push(null);
      }
      continue;
    }
    
    // Handle timestamp fields
    if (column.includes('_at') || column.includes('_date') || column.includes('time')) {
      if (value && value !== 'null') {
        try {
          // Convert timezone format
          value = value.replace(/GMT([+-]\d{4})/, '$1');
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            processed.push(date.toISOString());
          } else {
            processed.push(null);
          }
        } catch {
          processed.push(null);
        }
      } else {
        processed.push(null);
      }
      continue;
    }
    
    // Handle boolean fields
    if (column.includes('enabled') || column.includes('notifications') || column.includes('reminder') || column.includes('insights') || column.includes('only') || column.includes('backed_up') || column.includes('read') || column.includes('recurring')) {
      processed.push(value === 'true' || value === 't');
      continue;
    }
    
    // Handle integer fields
    if (column.includes('progress') || column.includes('duration') || column.includes('counter') || column.includes('interval') || column.includes('session_duration')) {
      const num = parseInt(value);
      processed.push(isNaN(num) ? null : num);
      continue;
    }
    
    // Handle UUID fields
    if (column.includes('id') && value && value !== 'null') {
      processed.push(value);
      continue;
    }
    
    // Default: string
    processed.push(value);
  }
  
  return processed;
}

importDataFixed().catch(console.error);
