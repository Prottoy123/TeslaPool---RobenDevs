import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import envConfig from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const generateTokens = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    envConfig.JWT_SECRET,
    {
      expiresIn: envConfig.JWT_EXPIRES_IN,
    }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: envConfig.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};


const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, role, licensePlate } = req.body;

  if (!fullName || !email || !phone || !password || !role) {
    throw new ApiError(400, "All fields (fullName, email, phone, password, role) are required");
  }

  // Zero-Trust Security Lock: Body role MUST be either PASSENGER or DRIVER
  if (role !== "PASSENGER" && role !== "DRIVER") {
    throw new ApiError(
      400,
      "Zero-Trust Security Lock: Invalid role. Allowed roles are strictly PASSENGER or DRIVER."
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new ApiError(409, "An account with this email address already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Use transaction to create user and, if driver, the initial Tesla vehicle
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (role === "DRIVER") {
      const generatedPlate =
        licensePlate || `DHAKA-METRO-TE-${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.vehicle.create({
        data: {
          driverId: user.id,
          licensePlate: generatedPlate,
          capacity: 3, // Fixed strict Tesla capacity rule
          isOnline: true,
        },
      });
    }

    return user;
  });

  // Fetch complete created profile
  const userProfile = await prisma.user.findUnique({
    where: { id: newUser.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      vehicle: true,
    },
  });

  const token = generateTokens(userProfile);

  res.cookie("accessToken", token, cookieOptions);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: userProfile, token },
        "User registered successfully"
      )
    );
});


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      vehicle: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  const token = generateTokens(user);

  const { password: _, ...userWithoutPassword } = user;

  res.cookie("accessToken", token, cookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userWithoutPassword,
        token,
      },
      "Logged in successfully"
    )
  );
});


const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", cookieOptions);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});


const getMe = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile retrieved successfully"));
});

export {
  register,
  login,
  logout,
  getMe,
};
