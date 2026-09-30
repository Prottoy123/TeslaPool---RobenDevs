import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";
import { calculateFare } from "../src/utils/fareCalculator.js";

async function seed() {
  console.log("🌱 Starting Dhaka Tesla Pool database seeding...");

  // Clean existing tables in proper relational order
  await prisma.rideRequest.deleteMany({});
  await prisma.pool.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Driver: Jashim with Tesla vehicle "Bullet"
  console.log("🚗 Seeding Driver: Jashim and Tesla: Bullet...");
  const jashim = await prisma.user.create({
    data: {
      fullName: "Jashim Uddin",
      email: "jashim@teslapool.com",
      phone: "+8801711000001",
      password: defaultPasswordHash,
      role: "DRIVER",
      status: "ACTIVE",
      vehicle: {
        create: {
          licensePlate: "DHAKA-METRO-TE-1101", // Bullet
          capacity: 3, // Strict Tesla 3-seat capacity
          isOnline: true,
        },
      },
    },
    include: {
      vehicle: true,
    },
  });

  // 2. Seed Passengers: Nusrat, Rafiq, Shirin
  console.log("👥 Seeding Passengers: Nusrat, Rafiq, Shirin...");
  const nusrat = await prisma.user.create({
    data: {
      fullName: "Nusrat Jahan",
      email: "nusrat@teslapool.com",
      phone: "+8801711000002",
      password: defaultPasswordHash,
      role: "PASSENGER",
      status: "ACTIVE",
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      fullName: "Rafiqul Islam",
      email: "rafiq@teslapool.com",
      phone: "+8801711000003",
      password: defaultPasswordHash,
      role: "PASSENGER",
      status: "ACTIVE",
    },
  });

  const shirin = await prisma.user.create({
    data: {
      fullName: "Shirin Akter",
      email: "shirin@teslapool.com",
      phone: "+8801711000004",
      password: defaultPasswordHash,
      role: "PASSENGER",
      status: "ACTIVE",
    },
  });

  // 3. Seed Rush-Hour Waiting Ride Requests:
  // - Nusrat: Banani -> Mohakhali (1 seat)
  // - Rafiq: Banani -> Gulshan (1 seat)
  // - Shirin: Banani -> Mohakhali (1 seat)
  console.log("📍 Seeding rush-hour ride requests at Banani Road 11...");

  const nusratFare = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Mohakhali",
    seatsRequested: 1,
    isPooled: true,
  });

  const rafiqFare = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Gulshan",
    seatsRequested: 1,
    isPooled: true,
  });

  const shirinFare = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Mohakhali",
    seatsRequested: 1,
    isPooled: true,
  });

  const nusratRequest = await prisma.rideRequest.create({
    data: {
      passengerId: nusrat.id,
      pickupZone: "Banani",
      dropoffZone: "Mohakhali",
      seatsRequested: 1,
      fare: nusratFare.fareInPoysha,
      status: "WAITING",
    },
  });

  const rafiqRequest = await prisma.rideRequest.create({
    data: {
      passengerId: rafiq.id,
      pickupZone: "Banani",
      dropoffZone: "Gulshan",
      seatsRequested: 1,
      fare: rafiqFare.fareInPoysha,
      status: "WAITING",
    },
  });

  const shirinRequest = await prisma.rideRequest.create({
    data: {
      passengerId: shirin.id,
      pickupZone: "Banani",
      dropoffZone: "Mohakhali",
      seatsRequested: 1,
      fare: shirinFare.fareInPoysha,
      status: "WAITING",
    },
  });

  console.log("\n✅ Database Seeding Completed Successfully!");
  console.log("-------------------------------------------------------");
  console.log("🚕 Driver:");
  console.log(`   - Jashim (${jashim.email}) | Vehicle: Bullet (${jashim.vehicle.licensePlate}) | Capacity: ${jashim.vehicle.capacity}`);
  console.log("👥 Passengers:");
  console.log(`   - Nusrat (${nusrat.email}) | Banani -> Mohakhali | Fare: ${nusratFare.fareInBDT} BDT (${nusratFare.fareInPoysha} poysha)`);
  console.log(`   - Rafiq  (${rafiq.email})  | Banani -> Gulshan   | Fare: ${rafiqFare.fareInBDT} BDT (${rafiqFare.fareInPoysha} poysha)`);
  console.log(`   - Shirin (${shirin.email}) | Banani -> Mohakhali | Fare: ${shirinFare.fareInBDT} BDT (${shirinFare.fareInPoysha} poysha)`);
  console.log("🔑 Default Demo Password for All Accounts: 'password123'");
  console.log("-------------------------------------------------------\n");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
