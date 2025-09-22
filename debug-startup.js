#!/usr/bin/env node

/**
 * Debug startup script to diagnose Railway deployment issues
 */

console.log('🔍 Starting Railway Deployment Diagnostics...');

// Check environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'ASSEMBLYAI_API_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'BASE_URL'
];

console.log('\n📊 Environment Variables Check:');
let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

console.log(`\n📈 Summary: ${requiredEnvVars.length - missingVars.length}/${requiredEnvVars.length} variables set`);

if (missingVars.length > 0) {
  console.log(`\n❌ Missing variables: ${missingVars.join(', ')}`);
  console.log('\n🔧 To fix this:');
  console.log('1. Go to Railway dashboard');
  console.log('2. Click on your project');
  console.log('3. Go to Variables tab');
  console.log('4. Add the missing variables');
} else {
  console.log('\n✅ All environment variables are set!');
}

// Check if dist directory exists
console.log('\n📁 Checking build artifacts...');
try {
  const fs = await import('fs');
  const path = await import('path');
  
  const distExists = fs.existsSync('./dist');
  console.log(`📦 dist/ directory: ${distExists ? '✅ Exists' : '❌ Missing'}`);
  
  if (distExists) {
    const distIndexExists = fs.existsSync('./dist/index.js');
    console.log(`📄 dist/index.js: ${distIndexExists ? '✅ Exists' : '❌ Missing'}`);
    
    if (distIndexExists) {
      const stats = fs.statSync('./dist/index.js');
      console.log(`📏 dist/index.js size: ${stats.size} bytes`);
    }
  }
  
  const publicExists = fs.existsSync('./dist/public');
  console.log(`📁 dist/public/: ${publicExists ? '✅ Exists' : '❌ Missing'}`);
  
} catch (error) {
  console.log('❌ Error checking build artifacts:', error.message);
}

// Check Node.js version
console.log('\n🔧 System Information:');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Working directory: ${process.cwd()}`);

// Try to test database connection
if (process.env.DATABASE_URL) {
  console.log('\n🗄️ Testing database connection...');
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Database tables found: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log(`Tables: ${result.rows.map(row => row.table_name).join(', ')}`);
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

// Try to import the full app
console.log('\n🚀 Testing full app import...');
try {
  const fullApp = await import('./dist/index.js');
  console.log('✅ Full app import successful');
  console.log('🎉 The full AI ProjectHub should work!');
} catch (error) {
  console.log('❌ Full app import failed:', error.message);
  console.log('Stack trace:', error.stack);
  
  console.log('\n🔧 Possible fixes:');
  console.log('1. Check if build process completed successfully');
  console.log('2. Verify all dependencies are installed');
  console.log('3. Check if there are any TypeScript compilation errors');
}

console.log('\n🏁 Diagnostics complete!');
