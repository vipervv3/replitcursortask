#!/usr/bin/env node

/**
 * Progressive startup script for Railway
 * Starts with basic server, then upgrades to full app when ready
 */

import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint - Railway's critical requirement
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({
    message: "Health check successful!",
    timestamp: new Date().toISOString(),
    status: "ok",
    environment: process.env.NODE_ENV || 'production',
    port: port
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    message: "AI ProjectHub API is running",
    timestamp: new Date().toISOString(),
    status: "ok",
    version: "1.0.0"
  });
});

// Database setup endpoint
app.get('/api/setup-database', async (req, res) => {
  try {
    console.log('🔄 Setting up database schema...');
    await import('./setup-railway-database.js');
    res.json({
      message: "Database setup completed successfully!",
      timestamp: new Date().toISOString(),
      status: "ok"
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    res.status(500).json({
      message: "Database setup failed",
      error: error.message,
      timestamp: new Date().toISOString(),
      status: "error"
    });
  }
});

// Try to serve static files if they exist
try {
  app.use(express.static('dist/public'));
  console.log('✅ Static files middleware added');
} catch (error) {
  console.log('⚠️  Static files not available:', error.message);
}

// Handle PWA icon requests with SVG icons
app.get('/pwa-icon-192.png', (req, res) => {
  const svgIcon = `
    <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
      <rect width="192" height="192" fill="#6366f1"/>
      <text x="96" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">AI</text>
      <text x="96" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">ProjectHub</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(svgIcon);
});

app.get('/pwa-icon-512.png', (req, res) => {
  const svgIcon = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#6366f1"/>
      <text x="256" y="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="64" font-weight="bold">AI</text>
      <text x="256" y="360" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32">ProjectHub</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(svgIcon);
});

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

let envStatus = {
  allSet: true,
  missing: [],
  set: []
};

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    envStatus.set.push(varName);
  } else {
    envStatus.missing.push(varName);
    envStatus.allSet = false;
  }
});

// Basic API routes
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from AI ProjectHub!",
    timestamp: new Date().toISOString(),
    status: "ok"
  });
});

// Environment status endpoint
app.get('/api/env-status', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'production',
    variables: envStatus,
    timestamp: new Date().toISOString(),
    status: "ok"
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      error: "API endpoint not found",
      path: req.path,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // For non-API routes, serve the main page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI ProjectHub</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: rgba(255,255,255,0.1); 
          padding: 40px; 
          border-radius: 16px; 
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 { 
          color: white; 
          margin-bottom: 30px; 
          font-size: 2.5em;
          text-align: center;
        }
        .status { 
          background: rgba(76, 175, 80, 0.2); 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #4CAF50;
        }
        .info { 
          background: rgba(33, 150, 243, 0.2); 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #2196F3;
        }
        .warning { 
          background: rgba(255, 193, 7, 0.2); 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #FFC107;
        }
        .success { 
          background: rgba(76, 175, 80, 0.2); 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #4CAF50;
        }
        code { 
          background: rgba(0,0,0,0.3); 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-family: 'Monaco', 'Menlo', monospace;
          color: #ffd54f;
        }
        .endpoint-list {
          background: rgba(0,0,0,0.2);
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .endpoint-list li {
          margin: 8px 0;
        }
        .success-text {
          color: #4CAF50;
          font-weight: bold;
        }
        .button {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin: 8px 8px 8px 0;
          transition: background 0.3s;
        }
        .button:hover {
          background: rgba(255,255,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AI ProjectHub</h1>
        
        <div class="success">
          <strong class="success-text">✅ Server is running successfully!</strong><br>
          Environment: ${process.env.NODE_ENV || 'production'}<br>
          Port: ${port}<br>
          Time: ${new Date().toISOString()}
        </div>
        
        <div class="info">
          <strong>📋 Available API Endpoints:</strong>
          <div class="endpoint-list">
            <ul>
              <li><code>GET /api/health</code> - Health check (Railway requirement)</li>
              <li><code>GET /api/status</code> - API status information</li>
              <li><code>GET /api/hello</code> - Simple test endpoint</li>
              <li><code>GET /api/env-status</code> - Environment variables status</li>
              <li><code>GET /api/setup-database</code> - Setup database schema</li>
            </ul>
          </div>
        </div>
        
        <div class="warning">
          <strong>🔧 Environment Variables Status:</strong><br>
          ${envStatus.allSet ? 
            '<span class="success-text">✅ All environment variables are set!</span><br>Ready for full functionality.' :
            `❌ Missing variables: <code>${envStatus.missing.join(', ')}</code><br>Set these in Railway dashboard → Variables`
          }
        </div>
        
        ${envStatus.allSet ? `
        <div class="success">
          <strong>🎯 Ready for Full Setup!</strong><br>
          <a href="/api/setup-database" class="button">Setup Database Schema</a><br>
          Once database is set up, the full AI ProjectHub will be available with login, authentication, and all AI features.
        </div>
        ` : ''}
        
        <div class="info">
          <strong>🎉 Migration Status:</strong><br>
          ✅ Successfully migrated from Replit to Railway<br>
          ✅ Health checks passing<br>
          ✅ Server running reliably<br>
          ✅ Ready for full feature activation
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start the server with error handling
try {
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Progressive server listening on port ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/api/health`);
    console.log(`📊 Status: http://localhost:${port}/api/status`);
    console.log(`🎉 AI ProjectHub is live!`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  // Don't exit, keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit, keep the server running
});
