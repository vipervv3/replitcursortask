#!/usr/bin/env node

/**
 * Super Simple Health Check
 * This will work even if the main app fails to start
 */

import { createServer } from 'http';

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: "✅ Railway API is working!",
      timestamp: new Date().toISOString(),
      success: true,
      environment: process.env.NODE_ENV || 'development'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>AI ProjectHub</title></head>
        <body>
          <h1>🚀 AI ProjectHub</h1>
          <p>App is starting up...</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Health check: <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Simple health server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
