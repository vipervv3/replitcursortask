#!/usr/bin/env node

/**
 * Direct startup script for Railway
 * Uses tsx to run TypeScript directly without complex builds
 */

console.log('🚀 Starting AI ProjectHub (Direct Mode)...');

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
  console.log('🔄 Falling back to basic server mode...');
  
  // Import basic server
  await import('./bulletproof-start.js');
  return;
}

console.log('\n✅ All environment variables are set!');

// Try to start the full AI ProjectHub using tsx
console.log('🔄 Attempting to start full AI ProjectHub with tsx...');

try {
  // Use tsx to run the TypeScript server directly
  const { spawn } = await import('child_process');
  
  console.log('🚀 Starting server with tsx...');
  const child = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start server with tsx:', error.message);
    console.log('🔄 Falling back to basic server mode...');
    import('./bulletproof-start.js');
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      console.log('🔄 Falling back to basic server mode...');
      import('./bulletproof-start.js');
    }
  });
  
  console.log('🎉 Full AI ProjectHub started with tsx!');
  console.log('🔐 Login page should now be available!');
  
} catch (error) {
  console.error('❌ Failed to start full AI ProjectHub:', error.message);
  console.error('Stack trace:', error.stack);
  
  console.log('\n🔄 Falling back to basic server mode...');
  await import('./bulletproof-start.js');
}
