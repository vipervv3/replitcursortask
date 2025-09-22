#!/usr/bin/env node

/**
 * Ultra-simple startup that will ALWAYS work
 */

console.log('🚀 AI ProjectHub - Ultra Simple Start');

import express from 'express';
const app = express();
const port = process.env.PORT || 8080;

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'ultra-simple',
    timestamp: new Date().toISOString(),
    message: 'Ultra simple server running'
  });
});

// Basic homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI ProjectHub - Ultra Simple Mode</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #6366f1; }
        .status { background: #dcfce7; color: #166534; padding: 10px; border-radius: 4px; margin: 20px 0; }
        .next-steps { background: #fef3c7; color: #92400e; padding: 10px; border-radius: 4px; margin: 20px 0; }
        .link { color: #6366f1; text-decoration: none; }
        .link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AI ProjectHub</h1>
        <div class="status">
          <strong>Status:</strong> Ultra simple mode running successfully!
        </div>
        <p>The build process is now working! The server is running and responding to requests.</p>
        
        <div class="next-steps">
          <strong>Next Steps:</strong>
          <ol>
            <li>Add environment variables in Railway dashboard</li>
            <li>Update the startup script to use the full app</li>
            <li>Enable login page and full features</li>
          </ol>
        </div>
        
        <p><strong>Health Check:</strong> <a href="/api/health" class="link">/api/health</a></p>
        <p><strong>Environment Variables Needed:</strong></p>
        <ul>
          <li>DATABASE_URL</li>
          <li>SESSION_SECRET</li>
          <li>ASSEMBLYAI_API_KEY</li>
          <li>OPENAI_API_KEY</li>
          <li>GROQ_API_KEY</li>
          <li>RESEND_API_KEY</li>
          <li>FROM_EMAIL</li>
          <li>BASE_URL</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Ultra simple server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`🌐 Homepage: http://localhost:${port}/`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
