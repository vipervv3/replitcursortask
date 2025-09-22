#!/usr/bin/env node

/**
 * Debug startup script for Railway
 * This will help identify what's causing the deployment failure
 */

console.log('🚀 Starting AI ProjectHub...');
console.log('📊 Environment check:');

// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'OPENAI_API_KEY',
  'ASSEMBLYAI_API_KEY',
  'RESEND_API_KEY',
  'GROQ_API_KEY',
  'FROM_EMAIL',
  'BASE_URL'
];

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
  process.exit(1);
}

console.log('\n✅ All environment variables are set!');
console.log('🔄 Starting server...');

// Import and start the server
import('./dist/index.js').catch(error => {
  console.error('❌ Failed to start server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
