import "dotenv/config";

const envConfig = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dhaka-tesla-pool-super-secret-jwt-key-2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};

// Startup validation warning
if (!envConfig.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables!");
}

export default envConfig;
