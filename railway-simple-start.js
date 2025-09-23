#!/usr/bin/env node

/**
 * Simple Railway startup script that forces full app mode
 */

console.log('🚀 Railway Simple Start - AI ProjectHub');

// Force environment variables for Railway
process.env.NODE_ENV = 'production';

console.log('📊 Environment Variables Check:');
const vars = ['DATABASE_URL', 'SESSION_SECRET', 'OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 'GROQ_API_KEY', 'RESEND_API_KEY', 'FROM_EMAIL', 'BASE_URL'];

let allVarsPresent = true;
vars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allVarsPresent = false;
  }
});

if (allVarsPresent) {
  console.log('\n🎉 All variables present! Starting full app...');
  
  // Start the full application directly
  try {
    await import('./server/index.ts');
  } catch (error) {
    console.error('❌ Failed to start full app:', error.message);
    console.log('🔄 Falling back to bulletproof mode...');
    await import('./bulletproof-start.js');
  }
} else {
  console.log('\n⚠️ Missing variables, starting bulletproof mode...');
  await import('./bulletproof-start.js');
}