/**
 * Ultra-Simple ProspectPro Test Server
 * Minimal version to test Cloud Run deployment
 */

console.log("🚀 Container starting...");
console.log("📦 Node version:", process.version);
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🔌 Port:", process.env.PORT);

const express = require("express");
const app = express();

console.log("📦 Express loaded successfully");

// Ultra-simple middleware
app.use(express.json());

console.log("⚙️ Middleware configured");

// Simple health check
app.get("/health", (req, res) => {
  console.log("🏥 Health check requested");
  res.json({
    status: "WORKING!",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || "not-set",
    nodeVersion: process.version,
  });
});

// Simple root endpoint
app.get("/", (req, res) => {
  console.log("🏠 Root endpoint requested");
  res.send(`
    <h1>🎉 ProspectPro Test Deployment WORKING!</h1>
    <p><strong>Status:</strong> Container started successfully</p>
    <p><strong>Port:</strong> ${process.env.PORT || "not-set"}</p>
    <p><strong>Node Version:</strong> ${process.version}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><a href="/health">Health Check</a></p>
  `);
});

// Simple test endpoint
app.get("/test", (req, res) => {
  console.log("🧪 Test endpoint requested");
  res.json({
    message: "Test endpoint working!",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 8080;
console.log(`🔌 Attempting to bind to port: ${PORT}`);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running successfully on port ${PORT}`);
  console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/test`);
  console.log("🎉 STARTUP COMPLETE - Container ready to serve requests");
});

server.on("error", (err) => {
  console.error("❌ Server error:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

console.log("📋 Server configuration completed");
