// Vercel serverless function for Express app
export default async function handler(req, res) {
  // Dynamically import the built server
  const { createServer } = await import('../dist/index.js');
  
  // Create app instance
  const app = await createServer();
  
  // Handle the request
  return app(req, res);
}