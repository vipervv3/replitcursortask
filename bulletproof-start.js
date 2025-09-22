#!/usr/bin/env node

/**
 * BULLETPROOF startup script - guaranteed to work on Railway
 */

console.log('🚀 AI ProjectHub - BULLETPROOF Start');
console.log('Port:', process.env.PORT || 8080);
console.log('Node version:', process.version);

// Use require instead of import for maximum compatibility
const http = require('http');
const url = require('url');

const port = process.env.PORT || 8080;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${req.method} ${path}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      mode: 'bulletproof',
      timestamp: new Date().toISOString(),
      message: 'BULLETPROOF server running successfully!',
      port: port,
      nodeVersion: process.version
    }));
    return;
  }

  // Homepage
  if (path === '/' || path === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI ProjectHub - BULLETPROOF Mode</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            min-height: 100vh;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          h1 { 
            color: #6366f1; 
            text-align: center;
            margin-bottom: 30px;
          }
          .status { 
            background: #dcfce7; 
            color: #166534; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #22c55e;
          }
          .success { 
            background: #dbeafe; 
            color: #1e40af; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .next-steps { 
            background: #fef3c7; 
            color: #92400e; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .link { 
            color: #6366f1; 
            text-decoration: none; 
            font-weight: bold;
          }
          .link:hover { 
            text-decoration: underline; 
          }
          .tech-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
          }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 AI ProjectHub</h1>
          
          <div class="status">
            <strong>🎉 SUCCESS!</strong> BULLETPROOF server is running!
          </div>
          
          <div class="success">
            <strong>✅ Railway Deployment Working!</strong><br>
            The server is responding to requests and health checks are passing.
          </div>
          
          <div class="next-steps">
            <strong>🔧 Next Steps to Enable Full Features:</strong>
            <ol>
              <li><strong>Add Environment Variables in Railway Dashboard:</strong>
                <ul>
                  <li>DATABASE_URL (Railway PostgreSQL)</li>
                  <li>SESSION_SECRET (any random string)</li>
                  <li>ASSEMBLYAI_API_KEY</li>
                  <li>OPENAI_API_KEY</li>
                  <li>GROQ_API_KEY</li>
                  <li>RESEND_API_KEY</li>
                  <li>FROM_EMAIL</li>
                  <li>BASE_URL</li>
                </ul>
              </li>
              <li><strong>Redeploy</strong> after adding variables</li>
              <li><strong>Full AI ProjectHub</strong> with login page will be enabled</li>
            </ol>
          </div>
          
          <div class="tech-info">
            <strong>Technical Details:</strong><br>
            Port: ${port}<br>
            Node Version: ${process.version}<br>
            Mode: BULLETPROOF<br>
            Status: ✅ Working
          </div>
          
          <p><strong>🔗 Health Check:</strong> <a href="/api/health" class="link">/api/health</a></p>
          <p><strong>📋 Environment Template:</strong> Check railway-env-template.txt in your repo</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>404 - Not Found</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h1>404 - Page Not Found</h1>
        <p><a href="/">← Back to Home</a></p>
      </body>
    </html>
  `);
});

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ BULLETPROOF server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`🌐 Homepage: http://localhost:${port}/`);
  console.log('🎉 Ready for Railway deployment!');
});

// Handle errors gracefully
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});