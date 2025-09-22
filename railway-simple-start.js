#!/usr/bin/env node

/**
 * Ultra-simple Railway startup that bypasses all build complexity
 */

console.log('🚀 AI ProjectHub - Simple Railway Start');

// Check if we have essential environment variables
const hasDatabase = !!process.env.DATABASE_URL;
const hasSession = !!process.env.SESSION_SECRET;

console.log('📊 Environment Status:');
console.log(`Database: ${hasDatabase ? '✅' : '❌'}`);
console.log(`Session: ${hasSession ? '✅' : '❌'}`);

if (!hasDatabase || !hasSession) {
  console.log('\n⚠️  Missing essential environment variables');
  console.log('Starting basic server mode...');
  
  // Start a basic Express server
  const express = await import('express');
  const app = express.default();
  const port = process.env.PORT || 8080;

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: 'basic',
      message: 'Add environment variables to enable full features',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>AI ProjectHub - Basic Mode</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #6366f1;">🚀 AI ProjectHub</h1>
            <p><strong>Status:</strong> Basic mode running</p>
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Add environment variables in Railway dashboard</li>
              <li>Redeploy to enable full features</li>
            </ol>
            <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
          </div>
        </body>
      </html>
    `);
  });

  app.listen(port, () => {
    console.log(`✅ Basic server running on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  });

  return;
}

console.log('\n✅ Essential environment variables found!');
console.log('🔄 Attempting to start full AI ProjectHub...');

try {
  // Try to start the full application
  const { spawn } = await import('child_process');
  
  console.log('🚀 Starting with tsx...');
  const child = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  child.on('error', (error) => {
    console.error('❌ tsx failed:', error.message);
    console.log('🔄 Falling back to basic mode...');
    
    // Fallback to basic server
    const express = await import('express');
    const app = express.default();
    const port = process.env.PORT || 8080;

    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        mode: 'fallback',
        message: 'tsx failed, running in fallback mode',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/', (req, res) => {
      res.send(`
        <html>
          <head><title>AI ProjectHub - Fallback Mode</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #ef4444;">⚠️ AI ProjectHub - Fallback Mode</h1>
              <p>Full app failed to start, running in basic mode.</p>
              <p>Check logs for details.</p>
              <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
            </div>
          </body>
        </html>
      `);
    });

    app.listen(port, () => {
      console.log(`✅ Fallback server running on port ${port}`);
    });
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ tsx exited with code ${code}`);
    }
  });

} catch (error) {
  console.error('❌ Unexpected error:', error.message);
}
