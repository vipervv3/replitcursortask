#!/usr/bin/env node

/**
 * Full AI ProjectHub startup script
 * This includes all features: database, AI services, authentication, etc.
 */

console.log('🚀 Starting AI ProjectHub (Full Mode)...');

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

console.log('📊 Environment check:');
let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  console.log('Please set these in Railway dashboard → Variables');
  
  // Continue with basic server if essential vars are missing
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    console.log('🔄 Starting basic server mode...');
    import('./simple-start.js');
    return;
  }
}

console.log('\n✅ All environment variables are set!');
console.log('🔄 Setting up database schema...');

// First, ensure the database schema is set up
try {
  await import('./setup-railway-database.js');
  console.log('✅ Database setup completed successfully!');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('🔄 Falling back to simple server mode...');
  import('./simple-start.js');
  return;
}

console.log('🔄 Starting full AI ProjectHub server...');

// Import and start the full server
import('./dist/index.js').catch(error => {
  console.error('❌ Failed to start full server:', error.message);
  console.error('Stack trace:', error.stack);
  
  console.log('\n🔄 Falling back to simple server mode...');
  import('./simple-start.js');
});
