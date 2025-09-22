#!/usr/bin/env node

/**
 * Full AI ProjectHub startup script
 * Tries to start the full app first, falls back to basic server if needed
 */

async function startFullApp() {
  console.log('🚀 Starting AI ProjectHub (Full App Mode)...');

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

  // Try to start the full AI ProjectHub
  console.log('🔄 Attempting to start full AI ProjectHub...');

  try {
    // Run diagnostics first
    console.log('🔍 Running diagnostics...');
    await import('./debug-startup.js');
    
    // Import and start the full server
    console.log('🔄 Importing full AI ProjectHub...');
    await import('./dist/index.js');
    console.log('🎉 Full AI ProjectHub started successfully!');
    console.log('🔐 Login page should now be available!');
  } catch (error) {
    console.error('❌ Failed to start full AI ProjectHub:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔄 Falling back to basic server mode...');
    await import('./bulletproof-start.js');
  }
}

// Start the app
startFullApp().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
