import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import envConfig from "./config/env.config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";
import ApiResponse from "./utils/ApiResponse.js";

// Route imports
import authRouter from "./routes/auth.routes.js";
import passengerRouter from "./routes/passenger.routes.js";
import driverRouter from "./routes/driver.routes.js";

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // In development or if CORS_ORIGIN is '*', allow all
      if (envConfig.CORS_ORIGIN === "*" || envConfig.NODE_ENV === "development") {
        return callback(null, true);
      }
      if (envConfig.CORS_ORIGIN.split(",").includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Health Check API
app.get("/health", (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      "Dhaka Tesla Pool Backend API is running smoothly"
    )
  );
});

app.get("/api/health", (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      "Dhaka Tesla Pool Backend API is running smoothly"
    )
  );
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/passenger", passengerRouter);
app.use("/api/driver", driverRouter);

// Handle 404 for unmapped endpoints
app.use((req, res, next) => {
  next(new ApiError(404, `Endpoint ${req.originalUrl} not found on this server`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
