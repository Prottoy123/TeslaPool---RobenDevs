import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { areRoutesCompatible, isValidZone } from "../utils/geoMatcher.js";


const getDriverVehicle = async (user) => {
  if (user && user.vehicle) {
    return user.vehicle;
  }
  const driverId = typeof user === "string" ? user : user.id;
  const vehicle = await prisma.vehicle.findUnique({
    where: { driverId },
  });
  if (!vehicle) {
    throw new ApiError(404, "No registered vehicle found for this driver");
  }
  return vehicle;
};


const getPendingRequests = asyncHandler(async (req, res) => {
  const vehicle = await getDriverVehicle(req.user);

  // Find driver's current active pool to check current zone & remaining capacity
  const activePool = await prisma.pool.findFirst({
    where: {
      vehicleId: vehicle.id,
      status: { in: ["MATCHED", "DRIVER_ARRIVED"] },
    },
    include: {
      requests: {
        where: { status: "IN_POOL" },
      },
    },
  });

  const availableCapacity = activePool ? activePool.availableSeats : vehicle.capacity;
  const currentZone = activePool ? activePool.currentZone : (req.query.zone || "Banani");

  // Fetch waiting requests from the database using indexed query
  const pendingRequests = await prisma.rideRequest.findMany({
    where: {
      status: "WAITING",
      seatsRequested: { lte: availableCapacity },
    },
    include: {
      passenger: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Evaluate route compatibility if an active pool already has passengers
  const formattedRequests = pendingRequests.map((reqItem) => {
    let compatibility = { compatible: true, reason: "Direct route pickup" };

    if (activePool && activePool.requests.length > 0) {
      const existingTrip = activePool.requests[0];
      compatibility = areRoutesCompatible(
        { pickupZone: existingTrip.pickupZone, dropoffZone: existingTrip.dropoffZone },
        { pickupZone: reqItem.pickupZone, dropoffZone: reqItem.dropoffZone }
      );
    }

    return {
      id: reqItem.id,
      passenger: reqItem.passenger,
      pickupZone: reqItem.pickupZone,
      dropoffZone: reqItem.dropoffZone,
      seatsRequested: reqItem.seatsRequested,
      fareInPoysha: reqItem.fare,
      fareInBDT: Number((reqItem.fare / 100).toFixed(2)),
      createdAt: reqItem.createdAt,
      compatibility,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicle: {
          licensePlate: vehicle.licensePlate,
          capacity: vehicle.capacity,
          availableSeats: availableCapacity,
          currentZone,
        },
        activePoolId: activePool ? activePool.id : null,
        pendingRequests: formattedRequests,
      },
      "Pending requests retrieved successfully"
    )
  );
});

const acceptRequest = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const { rideRequestId, poolId: requestedPoolId } = req.body;

  if (!rideRequestId) {
    throw new ApiError(400, "rideRequestId is required");
  }

  const vehicle = await getDriverVehicle(req.user);

  if (vehicle.isOnline === false) {
    throw new ApiError(400, "Driver is currently offline. Please set your vehicle online to accept rides.");
  }

  // Execute inside an isolated transaction with Row-Level Lock
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify the ride request exists and is still WAITING
    const targetRide = await tx.rideRequest.findUnique({
      where: { id: rideRequestId },
    });

    if (!targetRide) {
      throw new ApiError(404, "Ride request not found");
    }

    if (targetRide.status !== "WAITING") {
      throw new ApiError(
        409,
        `Ride request is no longer waiting (Current status: ${targetRide.status})`
      );
    }

    // 2. Find or initialize active pool for driver's vehicle
    let currentPool;
    if (requestedPoolId) {
      currentPool = await tx.pool.findUnique({
        where: { id: requestedPoolId },
      });
    } else {
      currentPool = await tx.pool.findFirst({
        where: {
          vehicleId: vehicle.id,
          status: { in: ["MATCHED", "DRIVER_ARRIVED"] },
        },
      });
    }

    if (!currentPool) {
      // Create new pool if no active one exists
      currentPool = await tx.pool.create({
        data: {
          vehicleId: vehicle.id,
          currentZone: targetRide.pickupZone,
          availableSeats: vehicle.capacity, // 3
          status: "MATCHED",
        },
      });
    }

    // 3. PostgreSQL Native Mutex Lock: SELECT * FROM "Pool" WHERE id = $1 FOR UPDATE
    const targetPoolId = currentPool.id;
    const lockedRows = await tx.$queryRaw`SELECT id, "availableSeats", status FROM "Pool" WHERE id = ${targetPoolId} FOR UPDATE`;

    if (!lockedRows || lockedRows.length === 0) {
      throw new ApiError(500, "Failed to acquire lock on pool transaction");
    }

    const lockedPool = lockedRows[0];

    // Verify trip is not already started
    if (lockedPool.status !== "MATCHED" && lockedPool.status !== "DRIVER_ARRIVED") {
      throw new ApiError(
        400,
        `Cannot add passengers to a pool with status '${lockedPool.status}'`
      );
    }

    // 4. Capacity Enforcement: Strict check against locked state
    if (lockedPool.availableSeats < targetRide.seatsRequested) {
      throw new ApiError(
        409,
        `Seat unavailable: Pool capacity exceeded! Available seats: ${lockedPool.availableSeats}, Requested: ${targetRide.seatsRequested}`
      );
    }

    // 5. Deduct seats and update Pool state
    const newAvailableSeats = lockedPool.availableSeats - targetRide.seatsRequested;

    const updatedPool = await tx.pool.update({
      where: { id: currentPool.id },
      data: {
        availableSeats: newAvailableSeats,
        currentZone: targetRide.pickupZone,
        status: "MATCHED",
      },
    });

    // 6. Link ride request to pool and transition status
    const updatedRide = await tx.rideRequest.update({
      where: { id: targetRide.id },
      data: {
        poolId: currentPool.id,
        status: "IN_POOL",
      },
      include: {
        passenger: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return { pool: updatedPool, ride: updatedRide };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        poolId: result.pool.id,
        availableSeats: result.pool.availableSeats,
        status: result.pool.status,
        acceptedRide: {
          id: result.ride.id,
          passengerName: result.ride.passenger.fullName,
          passengerPhone: result.ride.passenger.phone,
          pickupZone: result.ride.pickupZone,
          dropoffZone: result.ride.dropoffZone,
          seats: result.ride.seatsRequested,
          fareInBDT: Number((result.ride.fare / 100).toFixed(2)),
        },
      },
      "Ride request accepted into the pool successfully"
    )
  );
});


const updatePoolStatus = asyncHandler(async (req, res) => {
  const newStatus = req.body.newStatus || req.body.status;
  const poolId = req.body.poolId;

  if (!newStatus) {
    throw new ApiError(400, "newStatus is required (e.g. DRIVER_ARRIVED, STARTED, COMPLETED)");
  }

  const vehicle = await getDriverVehicle(req.user);

  // Find active pool
  const whereClause = poolId
    ? { id: poolId, vehicleId: vehicle.id }
    : { vehicleId: vehicle.id, status: { in: ["MATCHED", "DRIVER_ARRIVED", "STARTED"] } };

  const pool = await prisma.pool.findFirst({
    where: whereClause,
    include: { requests: true },
  });

  if (!pool) {
    throw new ApiError(404, "No active pool found for this driver");
  }

  const validTransitions = {
    MATCHED: ["DRIVER_ARRIVED", "CANCELLED"],
    DRIVER_ARRIVED: ["STARTED", "CANCELLED"],
    STARTED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowedNextStates = validTransitions[pool.status] || [];
  if (!allowedNextStates.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid state transition: Cannot transition pool from '${pool.status}' to '${newStatus}'. Allowed transitions: [${allowedNextStates.join(", ")}]`
    );
  }

  // Atomically update pool and, if COMPLETED, update all connected ride requests
  const updatedResult = await prisma.$transaction(async (tx) => {
    const updatedPool = await tx.pool.update({
      where: { id: pool.id },
      data: {
        status: newStatus,
        ...(newStatus === "COMPLETED" || newStatus === "CANCELLED"
          ? { availableSeats: vehicle.capacity }
          : {}),
      },
    });

    if (newStatus === "COMPLETED") {
      // Batch update all connected Ride_Requests to COMPLETED
      await tx.rideRequest.updateMany({
        where: { poolId: pool.id, status: "IN_POOL" },
        data: { status: "COMPLETED" },
      });
    } else if (newStatus === "CANCELLED") {
      // If pool cancelled by driver, return rides to WAITING
      await tx.rideRequest.updateMany({
        where: { poolId: pool.id, status: "IN_POOL" },
        data: { status: "WAITING", poolId: null },
      });
    }

    return updatedPool;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedResult,
      `Pool status transitioned to '${newStatus}' successfully`
    )
  );
});

const getActivePool = asyncHandler(async (req, res) => {
  const vehicle = await getDriverVehicle(req.user);

  const activePool = await prisma.pool.findFirst({
    where: {
      vehicleId: vehicle.id,
      status: { in: ["MATCHED", "DRIVER_ARRIVED", "STARTED"] },
    },
    include: {
      vehicle: true,
      requests: {
        where: { status: "IN_POOL" },
        include: {
          passenger: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!activePool) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          vehicle: {
            licensePlate: vehicle.licensePlate,
            capacity: vehicle.capacity,
            isOnline: vehicle.isOnline,
          },
          activePool: null,
        },
        "No active pool currently in progress"
      )
    );
  }

  const formattedPassengers = activePool.requests.map((r) => ({
    rideId: r.id,
    passengerId: r.passenger.id,
    name: r.passenger.fullName,
    phone: r.passenger.phone,
    pickupZone: r.pickupZone,
    dropoffZone: r.dropoffZone,
    seats: r.seatsRequested,
    fareInBDT: Number((r.fare / 100).toFixed(2)),
    fareInPoysha: r.fare,
  }));

  const totalFareCollectedInPoysha = activePool.requests.reduce(
    (sum, r) => sum + r.fare,
    0
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        poolId: activePool.id,
        status: activePool.status,
        currentZone: activePool.currentZone,
        capacity: vehicle.capacity,
        availableSeats: activePool.availableSeats,
        occupiedSeats: vehicle.capacity - activePool.availableSeats,
        vehicle: {
          licensePlate: vehicle.licensePlate,
          capacity: vehicle.capacity,
        },
        passengers: formattedPassengers,
        totalFareInBDT: Number((totalFareCollectedInPoysha / 100).toFixed(2)),
      },
      "Active pool details retrieved successfully"
    )
  );
});


const updateVehicleStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;

  const vehicle = await getDriverVehicle(req.user);

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      ...(typeof isOnline === "boolean" ? { isOnline } : {}),
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedVehicle,
      "Vehicle status updated successfully"
    )
  );
});

const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await getDriverVehicle(req.user);
  return res.status(200).json(
    new ApiResponse(200, vehicle, "Driver vehicle retrieved successfully")
  );
});

const getDriverRideHistory = asyncHandler(async (req, res) => {
  const vehicle = await getDriverVehicle(req.user);

  const pools = await prisma.pool.findMany({
    where: {
      vehicleId: vehicle.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requests: {
        include: {
          passenger: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  let totalEarningsInPoysha = 0;
  let totalCompletedRides = 0;

  const formattedHistory = pools.map((pool) => {
    const poolEarningsInPoysha = pool.requests.reduce((sum, reqItem) => {
      return reqItem.status === "COMPLETED" || reqItem.status === "IN_POOL" ? sum + reqItem.fare : sum;
    }, 0);

    if (pool.status === "COMPLETED") {
      totalEarningsInPoysha += poolEarningsInPoysha;
      totalCompletedRides += pool.requests.filter((r) => r.status === "COMPLETED").length;
    }

    return {
      poolId: pool.id,
      status: pool.status,
      currentZone: pool.currentZone,
      availableSeats: pool.availableSeats,
      capacity: vehicle.capacity,
      occupiedSeats: vehicle.capacity - pool.availableSeats,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
      passengers: pool.requests.map((r) => ({
        rideId: r.id,
        passengerName: r.passenger?.fullName,
        passengerPhone: r.passenger?.phone,
        pickupZone: r.pickupZone,
        dropoffZone: r.dropoffZone,
        seatsRequested: r.seatsRequested,
        fareInPoysha: r.fare,
        fareInBDT: Number((r.fare / 100).toFixed(2)),
        status: r.status,
      })),
      poolEarningsInBDT: Number((poolEarningsInPoysha / 100).toFixed(2)),
      poolEarningsInPoysha,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicle: {
          licensePlate: vehicle.licensePlate,
          capacity: vehicle.capacity,
          isOnline: vehicle.isOnline,
        },
        totalCompletedPools: pools.filter((p) => p.status === "COMPLETED").length,
        totalCompletedRides,
        totalEarningsInBDT: Number((totalEarningsInPoysha / 100).toFixed(2)),
        totalEarningsInPoysha,
        history: formattedHistory,
      },
      "Driver ride and pool history retrieved successfully"
    )
  );
});

export {
  getPendingRequests,
  acceptRequest,
  updatePoolStatus,
  getActivePool,
  updateVehicleStatus,
  getVehicle,
  getDriverRideHistory,
};
