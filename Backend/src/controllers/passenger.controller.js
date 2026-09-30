import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidZone, getAllZones } from "../utils/geoMatcher.js";
import { calculateFare } from "../utils/fareCalculator.js";

/**
 * @desc Get available zones
 * @route GET /api/passenger/zones
 * @access Private (PASSENGER)
 */
const getZones = asyncHandler(async (req, res) => {
  const zones = getAllZones();
  return res.status(200).json(new ApiResponse(200, { zones }, "Zones fetched successfully"));
});

/**
 * @desc Estimate fare before booking
 * @route GET /api/passenger/ride/estimate-fare
 * @access Private (PASSENGER)
 */
const estimateFare = asyncHandler(async (req, res) => {
  const { pickupZone, dropoffZone, seatsRequested } = req.query;

  if (!pickupZone || !dropoffZone) {
    throw new ApiError(400, "Both pickupZone and dropoffZone are required");
  }

  if (!isValidZone(pickupZone)) {
    throw new ApiError(400, `Invalid pickupZone '${pickupZone}'. Available zones: ${getAllZones().join(", ")}`);
  }

  if (!isValidZone(dropoffZone)) {
    throw new ApiError(400, `Invalid dropoffZone '${dropoffZone}'. Available zones: ${getAllZones().join(", ")}`);
  }

  const seats = parseInt(seatsRequested, 10) || 1;
  if (seats < 1 || seats > 3) {
    throw new ApiError(400, "seatsRequested must be between 1 and 3 (Tesla fixed capacity)");
  }

  const fareData = calculateFare({
    pickupZone,
    dropoffZone,
    seatsRequested: seats,
    isPooled: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, fareData, "Estimated fare calculated successfully"));
});

/**
 * @desc Request a ride
 * @route POST /api/passenger/ride/request
 * @access Private (PASSENGER)
 */
const requestRide = asyncHandler(async (req, res) => {
  const { pickupZone, dropoffZone, seatsRequested = 1 } = req.body;
  const passengerId = req.user.id;

  if (!pickupZone || !dropoffZone) {
    throw new ApiError(400, "pickupZone and dropoffZone are required");
  }

  if (!isValidZone(pickupZone)) {
    throw new ApiError(400, `Invalid pickupZone '${pickupZone}'. Available zones: ${getAllZones().join(", ")}`);
  }

  if (!isValidZone(dropoffZone)) {
    throw new ApiError(400, `Invalid dropoffZone '${dropoffZone}'. Available zones: ${getAllZones().join(", ")}`);
  }

  const seats = parseInt(seatsRequested, 10) || 1;
  if (seats < 1 || seats > 3) {
    throw new ApiError(400, "seatsRequested must be between 1 and 3 seats");
  }

  // Prevent duplicate active requests from same passenger
  const existingActiveRequest = await prisma.rideRequest.findFirst({
    where: {
      passengerId,
      status: { in: ["WAITING", "IN_POOL"] },
    },
  });

  if (existingActiveRequest) {
    throw new ApiError(
      400,
      "You already have an active ride request in progress. Cancel it or wait for completion."
    );
  }

  // Calculate fare in poysha
  const fareResult = calculateFare({
    pickupZone,
    dropoffZone,
    seatsRequested: seats,
    isPooled: true,
  });

  const rideRequest = await prisma.rideRequest.create({
    data: {
      passengerId,
      pickupZone,
      dropoffZone,
      seatsRequested: seats,
      fare: fareResult.fareInPoysha,
      status: "WAITING",
      poolId: null,
    },
    select: {
      id: true,
      passengerId: true,
      pickupZone: true,
      dropoffZone: true,
      seatsRequested: true,
      fare: true,
      status: true,
      createdAt: true,
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ...rideRequest,
        fareInBDT: fareResult.fareInBDT,
        breakdown: fareResult.breakdown,
      },
      "Ride requested successfully. Waiting for a driver to accept."
    )
  );
});

/**
 * @desc Get passenger's current ride status
 * [Identity Isolation Engine & Data Minimization Principle]
 * @route GET /api/passenger/ride/status
 * @access Private (PASSENGER)
 */
const getRideStatus = asyncHandler(async (req, res) => {
  const passengerId = req.user.id;
  const { rideId } = req.query;

  let currentRide;
  if (rideId) {
    currentRide = await prisma.rideRequest.findFirst({
      where: {
        id: rideId,
        passengerId,
      },
      include: {
        pool: {
          select: {
            id: true,
            status: true,
            currentZone: true,
            vehicle: {
              select: {
                licensePlate: true,
                capacity: true,
                driver: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  } else {
    // Check for active ride first
    currentRide = await prisma.rideRequest.findFirst({
      where: {
        passengerId,
        status: { in: ["WAITING", "IN_POOL"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        pool: {
          select: {
            id: true,
            status: true,
            currentZone: true,
            vehicle: {
              select: {
                licensePlate: true,
                capacity: true,
                driver: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // If no active ride, get the most recent ride (e.g., recently completed or cancelled)
    if (!currentRide) {
      currentRide = await prisma.rideRequest.findFirst({
        where: { passengerId },
        orderBy: { createdAt: "desc" },
        include: {
          pool: {
            select: {
              id: true,
              status: true,
              currentZone: true,
              vehicle: {
                select: {
                  licensePlate: true,
                  capacity: true,
                  driver: {
                    select: {
                      fullName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
  }

  if (!currentRide) {
    return res.status(200).json(
      new ApiResponse(200, null, "No rides found for this account")
    );
  }

  // Derive human-friendly lifecycle status: waiting -> matched -> in progress -> completed/cancelled
  let lifecycleStatus = currentRide.status;
  if (currentRide.status === "WAITING") {
    lifecycleStatus = "WAITING";
  } else if (currentRide.status === "IN_POOL") {
    if (currentRide.pool?.status === "MATCHED") {
      lifecycleStatus = "MATCHED";
    } else if (currentRide.pool?.status === "DRIVER_ARRIVED") {
      lifecycleStatus = "DRIVER_ARRIVED";
    } else if (currentRide.pool?.status === "STARTED") {
      lifecycleStatus = "IN_PROGRESS";
    } else if (currentRide.pool?.status === "COMPLETED") {
      lifecycleStatus = "COMPLETED";
    }
  } else if (currentRide.status === "COMPLETED") {
    lifecycleStatus = "COMPLETED";
  } else if (currentRide.status === "CANCELLED") {
    lifecycleStatus = "CANCELLED";
  }

  // Strict Identity Isolation: Exclude any other passengers' data or fares
  const isolatedRideResponse = {
    id: currentRide.id,
    pickupZone: currentRide.pickupZone,
    dropoffZone: currentRide.dropoffZone,
    seatsRequested: currentRide.seatsRequested,
    fareInPoysha: currentRide.fare,
    fareInBDT: Number((currentRide.fare / 100).toFixed(2)),
    status: currentRide.status,
    lifecycleStatus,
    createdAt: currentRide.createdAt,
    poolStatus: currentRide.pool ? currentRide.pool.status : "SEARCHING_FOR_TESLA",
    driver: currentRide.pool?.vehicle?.driver
      ? {
          name: currentRide.pool.vehicle.driver.fullName,
          phone: currentRide.pool.vehicle.driver.phone,
          licensePlate: currentRide.pool.vehicle.licensePlate,
          currentZone: currentRide.pool.currentZone,
        }
      : null,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, isolatedRideResponse, "Ride status retrieved successfully"));
});

/**
 * @desc Get passenger's ride history
 * @route GET /api/passenger/ride/history
 * @access Private (PASSENGER)
 */
const getRideHistory = asyncHandler(async (req, res) => {
  const passengerId = req.user.id;

  const history = await prisma.rideRequest.findMany({
    where: { passengerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pickupZone: true,
      dropoffZone: true,
      seatsRequested: true,
      fare: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const formattedHistory = history.map((item) => ({
    ...item,
    fareInBDT: Number((item.fare / 100).toFixed(2)),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formattedHistory, "Ride history retrieved successfully"));
});

/**
 * @desc Cancel a ride
 * @route PATCH /api/passenger/ride/cancel
 * @access Private (PASSENGER)
 */
const cancelRide = asyncHandler(async (req, res) => {
  const passengerId = req.user.id;
  const requestId = req.body.requestId;

  let ride;
  if (requestId) {
    ride = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { pool: true },
    });

    if (!ride) {
      throw new ApiError(404, "Ride request not found");
    }

    if (ride.passengerId !== passengerId) {
      throw new ApiError(403, "Forbidden: You cannot modify another user's ride request");
    }
  } else {
    // If no requestId provided, find active ride
    ride = await prisma.rideRequest.findFirst({
      where: {
        passengerId,
        status: { in: ["WAITING", "IN_POOL"] },
      },
      orderBy: { createdAt: "desc" },
      include: { pool: true },
    });

    if (!ride) {
      throw new ApiError(404, "No active ride found to cancel");
    }
  }

  // Check state machine: Can only cancel if WAITING or MATCHED/DRIVER_ARRIVED
  if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
    throw new ApiError(400, `Cannot cancel ride with status '${ride.status}'`);
  }

  if (ride.pool && (ride.pool.status === "STARTED" || ride.pool.status === "COMPLETED")) {
    throw new ApiError(
      400,
      `Cannot cancel: The Tesla trip has already '${ride.pool.status}'.`
    );
  }

  // Atomically update ride status and restore pool available seats if it was pooled
  const cancelledRide = await prisma.$transaction(async (tx) => {
    if (ride.poolId && ride.pool) {
      await tx.pool.update({
        where: { id: ride.poolId },
        data: {
          availableSeats: {
            increment: ride.seatsRequested,
          },
        },
      });
    }

    return await tx.rideRequest.update({
      where: { id: ride.id },
      data: {
        status: "CANCELLED",
      },
      select: {
        id: true,
        pickupZone: true,
        dropoffZone: true,
        seatsRequested: true,
        fare: true,
        status: true,
        updatedAt: true,
      },
    });
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...cancelledRide,
        fareInBDT: Number((cancelledRide.fare / 100).toFixed(2)),
      },
      "Ride request cancelled successfully"
    )
  );
});

export {
  getZones,
  estimateFare,
  requestRide,
  getRideStatus,
  getRideHistory,
  cancelRide,
};
