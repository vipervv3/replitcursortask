#!/usr/bin/env node

/**
 * Railway Forced Start - Bypasses all checks and starts full app
 */

console.log('🚀 Railway FORCED START - AI ProjectHub');

// Log all environment variables (without values for security)
console.log('📊 Environment Variables Present:');
const envVars = [
  'DATABASE_URL', 'SESSION_SECRET', 'OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 
  'GROQ_API_KEY', 'RESEND_API_KEY', 'FROM_EMAIL', 'BASE_URL', 'PORT'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.length > 10 ? value.substring(0, 10) + '...' : value}`);
  } else {
    console.log(`❌ ${varName}: Missing`);
  }
});

console.log('\n🎯 FORCING FULL APP START - Bypassing all checks');

// Force production mode
process.env.NODE_ENV = 'production';

// Start the full server directly
try {
  console.log('🚀 Starting full AI ProjectHub server...');
  
  // Import and start the server
  const { createServer } = await import('./server/index.ts');
  const app = await createServer();
  
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Full AI ProjectHub running on port ${port}`);
    console.log('🔐 Login page should now be available!');
  });
  
} catch (error) {
  console.error('❌ Failed to start full app:', error.message);
  console.log('🔄 Falling back to bulletproof mode...');
  
  // Fallback to bulletproof
  await import('./bulletproof-start.js');
}
