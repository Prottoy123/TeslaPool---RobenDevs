import app from "./app.js";
import envConfig from "./config/env.config.js";

const server = app.listen(envConfig.PORT, () => {
  console.log(`⚡ Dhaka Tesla Pool API server running on port ${envConfig.PORT}`);
  console.log(`🚗 Mode: ${envConfig.NODE_ENV}`);
  console.log(`📍 Health Check: http://localhost:${envConfig.PORT}/health`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

export default server;
