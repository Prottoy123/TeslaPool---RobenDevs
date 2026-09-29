import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import envConfig from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.cookies?.token ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No access token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, envConfig.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid or expired access token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          capacity: true,
          isOnline: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid access token: User not found");
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "Access forbidden: Your account has been suspended");
  }

  req.user = user;
  next();
});

export { verifyJWT };
