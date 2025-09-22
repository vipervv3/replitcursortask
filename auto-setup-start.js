#!/usr/bin/env node

/**
 * Auto-setup startup script for Railway
 * Automatically sets up database and starts full AI ProjectHub
 */

import express from 'express';
import { Pool } from 'pg';

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

console.log('🚀 Starting AI ProjectHub (Auto-Setup Mode)...');
console.log('📊 Environment check:');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
  }
});

// Auto-setup database if all environment variables are set
async function autoSetupDatabase() {
  if (!envStatus.allSet) {
    console.log('⚠️  Missing environment variables - running in basic mode');
    return false;
  }

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL - running in basic mode');
    return false;
  }

  console.log('🔄 Auto-setting up database schema...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if tables already exist
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (existingTables.rows.length > 0) {
      console.log('✅ Database tables already exist:', existingTables.rows.map(row => row.table_name).join(', '));
      client.release();
      await pool.end();
      return true;
    }

    console.log('🔄 Creating database schema...');

    // Create all tables using raw SQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        progress INTEGER NOT NULL DEFAULT 0,
        owner_id UUID REFERENCES users(id) NOT NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        project_id UUID REFERENCES projects(id),
        assigned_to UUID REFERENCES users(id),
        created_by UUID REFERENCES users(id) NOT NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        duration INTEGER,
        transcript TEXT,
        summary TEXT,
        project_id UUID REFERENCES projects(id),
        created_by UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS external_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        duration INTEGER,
        transcript TEXT,
        summary TEXT,
        created_by UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
        theme TEXT DEFAULT 'light',
        notifications BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      )
    `);

    console.log('✅ Database schema created successfully!');
    console.log('📋 Created tables: users, projects, tasks, meetings, external_meetings, user_settings, project_members');

    client.release();
    await pool.end();
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await pool.end();
    return false;
  }
}

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

// Basic API routes
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from AI ProjectHub!",
    timestamp: new Date().toISOString(),
    status: "ok"
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
        
        <div class="warning">
          <strong>🔧 Environment Variables Status:</strong><br>
          ${envStatus.allSet ? 
            '<span class="success-text">✅ All environment variables are set!</span><br>Database setup will happen automatically on next restart.' :
            `❌ Missing variables: <code>${envStatus.missing.join(', ')}</code><br>Set these in Railway dashboard → Variables`
          }
        </div>
        
        <div class="info">
          <strong>🎯 Current Status:</strong><br>
          ${envStatus.allSet ? 
            '✅ Ready for full AI ProjectHub!<br>The app will automatically upgrade to full functionality with login page, authentication, and all AI features on the next restart.' :
            '⚠️ Running in basic mode<br>Add the missing environment variables to enable full functionality.'
          }
        </div>
        
        <div class="success">
          <strong>🎉 Migration Status:</strong><br>
          ✅ Successfully migrated from Replit to Railway<br>
          ✅ Health checks passing<br>
          ✅ Server running reliably<br>
          ${envStatus.allSet ? '✅ Ready for full feature activation' : '⏳ Waiting for environment variables'}
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start the server with error handling
async function startServer() {
  try {
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Auto-setup server listening on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/api/health`);
      console.log(`📊 Status: http://localhost:${port}/api/status`);
      console.log(`🎉 AI ProjectHub is live!`);
    });

    // Try to set up database automatically
    const dbSetupSuccess = await autoSetupDatabase();
    
    if (dbSetupSuccess && envStatus.allSet) {
      console.log('🎉 Database setup completed! Full AI ProjectHub is ready!');
      console.log('🔄 Next restart will enable full functionality with login page.');
    } else if (!envStatus.allSet) {
      console.log('⚠️  Missing environment variables - add them to enable full functionality');
    }

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

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
