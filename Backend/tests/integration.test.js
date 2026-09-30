import test from "node:test";
import assert from "node:assert";
import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/db.js";

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

// Helper for making JSON HTTP requests
const request = async (method, path, body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
};

test("1. Auth - Zero-Trust Security Lock rejects unauthorized roles", async () => {
  const res = await request("POST", "/api/auth/register", {
    fullName: "Hacker X",
    email: "hacker@test.com",
    phone: "01700000000",
    password: "password123",
    role: "ADMIN", // Zero-Trust Lock must reject anything except PASSENGER or DRIVER
  });

  assert.strictEqual(res.status, 400);
  assert.ok(res.body.message.includes("Zero-Trust Security Lock"));
});

test("2. Auth & Isolation - Login with seeded demo credentials", async () => {
  // Login as Nusrat (Passenger)
  const nusratRes = await request("POST", "/api/auth/login", {
    email: "nusrat@teslapool.com",
    password: "password123",
  });
  assert.strictEqual(nusratRes.status, 200);
  assert.ok(nusratRes.body.data.token);
  assert.strictEqual(nusratRes.body.data.user.role, "PASSENGER");

  // Login as Jashim (Driver)
  const jashimRes = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  assert.strictEqual(jashimRes.status, 200);
  assert.ok(jashimRes.body.data.token);
  assert.strictEqual(jashimRes.body.data.user.role, "DRIVER");
});

test("3. Security Gate - Drivers cannot access passenger endpoints (403 Forbidden)", async () => {
  const driverLogin = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  const driverToken = driverLogin.body.data.token;

  // Jashim trying to request a ride as a passenger
  const res = await request(
    "POST",
    "/api/passenger/ride/request",
    {
      pickupZone: "Banani",
      dropoffZone: "Mohakhali",
      seatsRequested: 1,
    },
    driverToken
  );

  assert.strictEqual(res.status, 403);
  assert.ok(res.body.message.includes("Forbidden"));
});

test("4. Passenger Identity Isolation & Data Minimization", async () => {
  const nusratLogin = await request("POST", "/api/auth/login", {
    email: "nusrat@teslapool.com",
    password: "password123",
  });
  const nusratToken = nusratLogin.body.data.token;

  // Fetch Nusrat's status
  const statusRes = await request("GET", "/api/passenger/ride/status", null, nusratToken);
  assert.strictEqual(statusRes.status, 200);

  // Status must only show Nusrat's ride, no other passengers' identities or fares
  if (statusRes.body.data) {
    assert.strictEqual(statusRes.body.data.fareInBDT, 60.0);
    assert.strictEqual(statusRes.body.data.passengers, undefined);
  }
});

test("5. Users cannot tamper with or cancel another user's ride", async () => {
  // Login as Rafiq
  const rafiqLogin = await request("POST", "/api/auth/login", {
    email: "rafiq@teslapool.com",
    password: "password123",
  });
  const rafiqToken = rafiqLogin.body.data.token;

  // Find Nusrat's waiting ride
  const nusratRide = await prisma.rideRequest.findFirst({
    where: {
      passenger: { email: "nusrat@teslapool.com" },
    },
  });
  assert.ok(nusratRide);

  // Rafiq tries to cancel Nusrat's ride
  const tamperRes = await request(
    "PATCH",
    "/api/passenger/ride/cancel",
    { requestId: nusratRide.id },
    rafiqToken
  );

  assert.strictEqual(tamperRes.status, 403);
  assert.ok(tamperRes.body.message.includes("cannot modify another user's ride"));
});

test("6. Invalid Pool state machine transitions are strictly rejected", async () => {
  const driverLogin = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  const driverToken = driverLogin.body.data.token;

  // Accept Nusrat into pool first
  const nusratRide = await prisma.rideRequest.findFirst({
    where: { passenger: { email: "nusrat@teslapool.com" }, status: "WAITING" },
  });

  if (nusratRide) {
    await request("POST", "/api/driver/pool/accept", { rideRequestId: nusratRide.id }, driverToken);
  }

  // Attempt invalid transition: directly from MATCHED to COMPLETED (skipping DRIVER_ARRIVED and STARTED)
  const invalidTransitionRes = await request(
    "PATCH",
    "/api/driver/pool/status",
    { newStatus: "COMPLETED" },
    driverToken
  );

  assert.strictEqual(invalidTransitionRes.status, 400);
  assert.ok(invalidTransitionRes.body.message.includes("Invalid state transition"));
});

test("7. Concurrency & Mutex Lock - Two concurrent requests cannot overbook capacity", async () => {
  const driverLogin = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  const driverToken = driverLogin.body.data.token;

  // Create a dedicated test pool with exactly 1 available seat
  const vehicle = await prisma.vehicle.findFirst({
    where: { driver: { email: "jashim@teslapool.com" } },
  });

  const testPool = await prisma.pool.create({
    data: {
      vehicleId: vehicle.id,
      availableSeats: 1, // Only 1 seat remains!
      currentZone: "Banani",
      status: "MATCHED",
    },
  });

  // Create two distinct passengers competing for that 1 seat (like Nusrat & Shirin)
  const passengerA = await prisma.user.create({
    data: {
      fullName: "Competitor A",
      email: `compA_${Date.now()}@test.com`,
      phone: "01799999991",
      password: "pass",
      role: "PASSENGER",
    },
  });

  const passengerB = await prisma.user.create({
    data: {
      fullName: "Competitor B",
      email: `compB_${Date.now()}@test.com`,
      phone: "01799999992",
      password: "pass",
      role: "PASSENGER",
    },
  });

  const rideA = await prisma.rideRequest.create({
    data: {
      passengerId: passengerA.id,
      pickupZone: "Banani",
      dropoffZone: "Mohakhali",
      seatsRequested: 1,
      fare: 6000,
      status: "WAITING",
    },
  });

  const rideB = await prisma.rideRequest.create({
    data: {
      passengerId: passengerB.id,
      pickupZone: "Banani",
      dropoffZone: "Mohakhali",
      seatsRequested: 1,
      fare: 6000,
      status: "WAITING",
    },
  });

  // Dispatch both accept requests concurrently at the exact same instant for the SAME pool
  const [resA, resB] = await Promise.all([
    request(
      "POST",
      "/api/driver/pool/accept",
      { rideRequestId: rideA.id, poolId: testPool.id },
      driverToken
    ),
    request(
      "POST",
      "/api/driver/pool/accept",
      { rideRequestId: rideB.id, poolId: testPool.id },
      driverToken
    ),
  ]);

  const statuses = [resA.status, resB.status];

  // Due to PostgreSQL SELECT ... FOR UPDATE Row Lock:
  // Exactly ONE request must succeed (200), and the other must be rejected with 409 Conflict (Seat unavailable)
  assert.ok(
    statuses.includes(200) && statuses.includes(409),
    `Expected one 200 and one 409, got ${JSON.stringify(statuses)}`
  );

  // Check the pool in DB: availableSeats must be 0 (NEVER negative / overbooked)
  const finalPool = await prisma.pool.findUnique({ where: { id: testPool.id } });
  assert.strictEqual(finalPool.availableSeats, 0);

  // Clean up test entities
  await prisma.rideRequest.deleteMany({ where: { id: { in: [rideA.id, rideB.id] } } });
  await prisma.pool.delete({ where: { id: testPool.id } });
  await prisma.user.deleteMany({ where: { id: { in: [passengerA.id, passengerB.id] } } });
});

test("8. Driver & Vehicle - Online/Offline toggle blocks accepting rides when offline", async () => {
  const driverLogin = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  const driverToken = driverLogin.body.data.token;

  // 1. Fetch vehicle info
  const vehicleRes = await request("GET", "/api/driver/vehicle", null, driverToken);
  assert.strictEqual(vehicleRes.status, 200);
  assert.strictEqual(vehicleRes.body.data.capacity, 3);
  assert.strictEqual(vehicleRes.body.data.licensePlate, "DHAKA-METRO-TE-1101");

  // 2. Set driver vehicle offline
  const offlineRes = await request(
    "PATCH",
    "/api/driver/vehicle/status",
    { isOnline: false },
    driverToken
  );
  assert.strictEqual(offlineRes.status, 200);
  assert.strictEqual(offlineRes.body.data.isOnline, false);

  // 3. Attempting to accept a ride while offline must fail (400)
  const failAccept = await request(
    "POST",
    "/api/driver/pool/accept",
    { rideRequestId: "dummy-id" },
    driverToken
  );
  assert.strictEqual(failAccept.status, 400);
  assert.ok(failAccept.body.message.includes("offline"));

  // 4. Restore driver vehicle online
  const onlineRes = await request(
    "PATCH",
    "/api/driver/vehicle/status",
    { isOnline: true },
    driverToken
  );
  assert.strictEqual(onlineRes.status, 200);
  assert.strictEqual(onlineRes.body.data.isOnline, true);
});

test("9. Driver History - View pool history and aggregated earnings", async () => {
  const driverLogin = await request("POST", "/api/auth/login", {
    email: "jashim@teslapool.com",
    password: "password123",
  });
  const driverToken = driverLogin.body.data.token;

  const historyRes = await request("GET", "/api/driver/history", null, driverToken);
  assert.strictEqual(historyRes.status, 200);
  assert.ok(historyRes.body.data.vehicle);
  assert.ok(Array.isArray(historyRes.body.data.history));
  assert.strictEqual(typeof historyRes.body.data.totalEarningsInBDT, "number");
});

test("10. Passenger - Status endpoint exposes human-readable lifecycleStatus", async () => {
  const passengerLogin = await request("POST", "/api/auth/login", {
    email: "nusrat@teslapool.com",
    password: "password123",
  });
  const passengerToken = passengerLogin.body.data.token;

  const statusRes = await request("GET", "/api/passenger/ride/status", null, passengerToken);
  assert.strictEqual(statusRes.status, 200);
  assert.ok(statusRes.body.data.lifecycleStatus);
});
