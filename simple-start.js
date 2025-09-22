#!/usr/bin/env node

/**
 * Simple startup script that starts the server with minimal dependencies
 * This will help us get the health check working first
 */

console.log('🚀 Starting AI ProjectHub (Simple Mode)...');

// Check if we have the essential environment variables
const essentialVars = ['DATABASE_URL', 'SESSION_SECRET'];
const missing = essentialVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.log(`❌ Missing essential environment variables: ${missing.join(', ')}`);
  console.log('Setting up basic server without database...');
} else {
  console.log('✅ Essential environment variables are set!');
}

// Create a simple Express server
import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint - this is what Railway needs
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({
    message: "Health check successful!",
    timestamp: new Date().toISOString(),
    status: "ok",
    environment: process.env.NODE_ENV || 'production'
  });
});

// Basic API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    message: "AI ProjectHub API is running",
    timestamp: new Date().toISOString(),
    status: "ok"
  });
});

// Serve static files from dist/public if they exist
app.use(express.static('dist/public'));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI ProjectHub</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .error { background: #ffe8e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info { background: #e8f4fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AI ProjectHub</h1>
        <div class="status">
          <strong>✅ Server is running!</strong><br>
          Environment: ${process.env.NODE_ENV || 'production'}<br>
          Port: ${port}<br>
          Time: ${new Date().toISOString()}
        </div>
        
        ${missing.length > 0 ? `
        <div class="error">
          <strong>⚠️ Configuration Needed:</strong><br>
          Missing environment variables: ${missing.join(', ')}<br>
          Please set these in Railway dashboard → Variables
        </div>
        ` : ''}
        
        <div class="info">
          <strong>📋 Available Endpoints:</strong><br>
          • <code>GET /api/health</code> - Health check<br>
          • <code>GET /api/status</code> - API status<br>
          ${missing.length === 0 ? '• Full app will be available once database is connected' : ''}
        </div>
        
        <p>If you're seeing this page, the basic server is working! The health check should now pass.</p>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server listening on port ${port}`);
  console.log(`🌐 Health check available at: http://localhost:${port}/api/health`);
  console.log(`📊 Status available at: http://localhost:${port}/api/status`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});
