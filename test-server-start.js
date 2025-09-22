#!/usr/bin/env node

/**
 * Test server startup to identify issues
 */

async function testServerStart() {
  console.log('🧪 Testing server startup...');
  
  try {
    // Test basic imports
    console.log('1. Testing basic imports...');
    const express = await import('express');
    console.log('✅ Express import successful');
    
    const session = await import('express-session');
    console.log('✅ Express-session import successful');
    
    // Test database connection
    console.log('2. Testing database connection...');
    const { pool } = await import('./server/db.js');
    console.log('✅ Database pool import successful');
    
    // Test database query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0]);
    client.release();
    
    // Test shared schema import
    console.log('3. Testing shared schema import...');
    const schema = await import('./shared/schema.js');
    console.log('✅ Shared schema import successful');
    
    // Test server routes import
    console.log('4. Testing server routes import...');
    const routes = await import('./server/routes.js');
    console.log('✅ Server routes import successful');
    
    console.log('🎉 All imports successful! Server should start properly.');
    
  } catch (error) {
    console.error('❌ Error during startup test:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to identify the specific issue
    if (error.message.includes('Cannot find module')) {
      console.log('💡 This looks like a missing module or import path issue');
    } else if (error.message.includes('DATABASE_URL')) {
      console.log('💡 This looks like a database configuration issue');
    } else if (error.message.includes('syntax')) {
      console.log('💡 This looks like a syntax error in the code');
    }
  }
  
  process.exit(0);
}

testServerStart();
