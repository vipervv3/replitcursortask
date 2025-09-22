# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at railway.app)
- GitHub repository connected to Railway
- All API keys ready (AssemblyAI, Groq, Resend, etc.)

## Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

## Step 2: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the connection details (you'll need the DATABASE_URL)

## Step 3: Configure Environment Variables
In your Railway project settings, add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secure-session-secret-here
ASSEMBLYAI_API_KEY=your-assemblyai-api-key
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=AI ProjectHub <noreply@yourdomain.com>
BASE_URL=https://your-app-name.railway.app
```

### Optional Variables:
```
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_TENANT_ID=your-outlook-tenant-id
```

## Step 4: Deploy Your Application
1. Railway will automatically detect your Node.js app
2. It will run `npm install` and `npm run build`
3. Then start your app with `npm start`
4. Your app will be available at the provided Railway URL

## Step 5: Database Migration
1. Connect to your Railway PostgreSQL database
2. Import your existing data from `production_backup.sql`
3. Run any necessary migrations with `npm run db:push`

## Step 6: Test Your Deployment
1. Visit your Railway app URL
2. Test user registration/login
3. Test voice recording functionality
4. Test AI features
5. Verify email notifications work

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check that all dependencies are in package.json
2. **Database Connection**: Verify DATABASE_URL is correct
3. **API Keys**: Ensure all required API keys are set
4. **Port Issues**: Railway sets PORT automatically, don't override it

### Logs:
- View logs in Railway dashboard under "Deployments"
- Check for any error messages during build or runtime

## Custom Domain (Optional)
1. In Railway dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update BASE_URL environment variable

## Monitoring
- Railway provides built-in monitoring
- Check the "Metrics" tab for performance data
- Set up alerts for downtime or errors
