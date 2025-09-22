// Simple health check endpoint
export default function handler(request, response) {
  response.status(200).json({
    message: "✅ Railway API is working!",
    timestamp: new Date().toISOString(),
    success: true,
    environment: process.env.NODE_ENV || 'development'
  });
}
