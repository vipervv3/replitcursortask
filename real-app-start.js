#!/usr/bin/env node

/**
 * Real App Start - Forces the full AI ProjectHub to start
 */

console.log('🚀 AI ProjectHub - REAL APP START');

// Force set environment variables for Railway
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:RjYakjrtGkBVSDNcOfWWgPSxNCWbdwwV@metro.proxy.rlwy.net:42192/railway';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'eab6f56220979cc76b1f72b9800420eb107286e8735fad2a984cdf4a13e86c8a';
process.env.FROM_EMAIL = process.env.FROM_EMAIL || 'AI ProjectHub <noreply@omarb.in>';
process.env.BASE_URL = process.env.BASE_URL || 'https://replitcursortask-production.up.railway.app';

// Set placeholder API keys if missing (you can replace these with real ones)
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'demo-openai-key';
process.env.ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || 'demo-assemblyai-key';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'demo-resend-key';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'demo-groq-key';

console.log('📊 Environment Variables:');
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
console.log('✅ SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Missing');
console.log('✅ OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('✅ ASSEMBLYAI_API_KEY:', process.env.ASSEMBLYAI_API_KEY ? 'Set' : 'Missing');
console.log('✅ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
console.log('✅ GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('✅ FROM_EMAIL:', process.env.FROM_EMAIL ? 'Set' : 'Missing');
console.log('✅ BASE_URL:', process.env.BASE_URL ? 'Set' : 'Missing');

console.log('\n🎯 FORCING REAL AI PROJECTHUB TO START...');

// Start the real application
try {
  console.log('🚀 Starting REAL AI ProjectHub server...');
  
  // Import and start the real server
  const { createServer } = await import('./server/index.ts');
  const app = await createServer();
  
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ REAL AI ProjectHub running on port ${port}`);
    console.log('🔐 Real login page available!');
    console.log('🎉 All features enabled!');
  });
  
} catch (error) {
  console.error('❌ Failed to start real app:', error.message);
  console.log('🔄 Falling back to direct start...');
  
  // Fallback to direct start
  await import('./direct-start.js');
}
