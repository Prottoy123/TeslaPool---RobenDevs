import ApiError from "../utils/ApiError.js";
import envConfig from "../config/env.config.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.code) {
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.target || "Field";
        const targetStr = Array.isArray(target) ? target.join(", ") : target;
        error = new ApiError(
          409,
          `Unique constraint violation: An account or record with this ${targetStr} already exists.`,
          err.meta
        );
        break;
      }
      case "P2025": {
        error = new ApiError(
          404,
          err.meta?.cause || "The requested record was not found.",
          err.meta
        );
        break;
      }
      case "P2003": {
        error = new ApiError(
          400,
          `Foreign key constraint failed on field: ${err.meta?.field_name || "unknown"}`,
          err.meta
        );
        break;
      }
      default:
        if (err.code.startsWith("P")) {
          error = new ApiError(
            400,
            `Database error (${err.code}): ${err.message || "An unexpected database operation occurred."}`
          );
        }
        break;
    }
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid access token. Please log in again.");
  } else if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Access token has expired. Please log in again.");
  }

  // Fallback to standard ApiError if not already an instance
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    data: null,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(envConfig.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
