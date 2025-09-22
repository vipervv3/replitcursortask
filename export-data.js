#!/usr/bin/env node

/**
 * Export Data Script
 * Exports all data from your current database to CSV files
 */

import { Pool } from 'pg';
import fs from 'fs';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cqWmsSPTpt21@ep-quiet-art-aeg9vhai.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function exportData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Starting data export...');

    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Found ${tables.length} tables:`, tables);

    // Export each table
    for (const table of tables) {
      console.log(`\n🔄 Exporting ${table}...`);
      
      // Get table data
      const dataResult = await pool.query(`SELECT * FROM ${table}`);
      
      if (dataResult.rows.length === 0) {
        console.log(`⚠️  Table ${table} is empty, skipping`);
        continue;
      }

      // Convert to CSV
      const columns = Object.keys(dataResult.rows[0]);
      const csvHeader = columns.join(',');
      const csvRows = dataResult.rows.map(row => 
        columns.map(col => {
          const value = row[col];
          if (value === null) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );

      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Write to file
      const filename = `exported_${table}.csv`;
      fs.writeFileSync(filename, csvContent);
      console.log(`✅ Exported ${dataResult.rows.length} rows to ${filename}`);
    }

    console.log('\n🎉 Data export completed!');
    console.log('📁 Check the exported CSV files in your project directory');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportData().catch(console.error);
