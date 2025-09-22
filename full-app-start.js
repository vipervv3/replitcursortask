#!/usr/bin/env node

/**
 * Full AI ProjectHub startup script with login page
 */

async function startFullApp() {
  console.log('🚀 AI ProjectHub - Full App Start');

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
    console.log('🔄 Starting basic server mode...');
    
    // Start basic server
    await import('./bulletproof-start.js');
    return;
  }

  console.log('\n✅ All environment variables are set!');
  console.log('🔄 Starting full AI ProjectHub with login page...');

  try {
    // Try to start the full application using tsx
    const { spawn } = await import('child_process');
    
    console.log('🚀 Launching full AI ProjectHub with tsx...');
    const child = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    child.on('error', (error) => {
      console.error('❌ Failed to start full app with tsx:', error.message);
      console.log('🔄 Falling back to basic server mode...');
      import('./bulletproof-start.js');
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Full app exited with code ${code}`);
        console.log('🔄 Falling back to basic server mode...');
        import('./bulletproof-start.js');
      }
    });

    console.log('🎉 Full AI ProjectHub started with tsx!');
    console.log('🔐 Login page should now be available!');

  } catch (error) {
    console.error('❌ Unexpected error starting full app:', error.message);
    console.log('🔄 Falling back to basic server mode...');
    await import('./bulletproof-start.js');
  }
}

// Start the app
startFullApp().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});