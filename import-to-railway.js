#!/usr/bin/env node

/**
 * Import Data to Railway PostgreSQL
 * Imports exported CSV data into Railway PostgreSQL database
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// You'll need to replace this with your Railway PostgreSQL DATABASE_URL
const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_DATABASE_URL) {
  console.error('❌ RAILWAY_DATABASE_URL environment variable is required');
  console.log('Set it to your Railway PostgreSQL connection string');
  console.log('Example: RAILWAY_DATABASE_URL=postgresql://username:password@host:port/database node import-to-railway.js');
  process.exit(1);
}

async function importData() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Get all CSV files
    const csvFiles = fs.readdirSync('.')
      .filter(file => file.startsWith('exported_') && file.endsWith('.csv'));

    if (csvFiles.length === 0) {
      console.log('❌ No exported CSV files found');
      console.log('Run node export-data.js first');
      return;
    }

    console.log(`📊 Found ${csvFiles.length} CSV files to import`);

    // Import each CSV file
    for (const csvFile of csvFiles) {
      const tableName = csvFile.replace('exported_', '').replace('.csv', '');
      console.log(`\n🔄 Importing ${tableName}...`);

      try {
        const csvContent = fs.readFileSync(csvFile, 'utf8');
        const lines = csvContent.trim().split('\n');
        
        if (lines.length < 2) {
          console.log(`⚠️  ${tableName} is empty, skipping`);
          continue;
        }

        const columns = lines[0].split(',');
        const dataRows = lines.slice(1);

        console.log(`📊 Found ${dataRows.length} rows to import`);

        // Clear existing data
        await pool.query(`DELETE FROM ${tableName}`);
        console.log(`🗑️  Cleared existing data from ${tableName}`);

        // Import data row by row
        for (const row of dataRows) {
          const values = row.split(',').map(val => {
            if (val === '') return null;
            if (val.startsWith('"') && val.endsWith('"')) {
              return val.slice(1, -1).replace(/""/g, '"');
            }
            return val;
          });

          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
          
          await pool.query(query, values);
        }

        console.log(`✅ Successfully imported ${dataRows.length} rows to ${tableName}`);

      } catch (error) {
        console.log(`⚠️  Failed to import ${tableName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Data import completed!');
    console.log('🔍 Verifying imported data...');

    // Verify data
    for (const csvFile of csvFiles) {
      const tableName = csvFile.replace('exported_', '').replace('.csv', '');
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`📊 ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`⚠️  Could not verify ${tableName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importData().catch(console.error);
