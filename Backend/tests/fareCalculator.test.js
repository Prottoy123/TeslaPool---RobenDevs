import test from "node:test";
import assert from "node:assert";
import { calculateFare, FARE_CONFIG } from "../src/utils/fareCalculator.js";

test("Fare Engine - Nusrat's trip (Banani to Mohakhali) calculates accurately", () => {
  const result = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Mohakhali",
    seatsRequested: 1,
    isPooled: true,
  });

  // Banani -> Mohakhali = 1 hop
  // Base Fare (5000) + 1 * Per Hop (3000) - Pool Discount (2000) = 6000 poysha = 60 BDT
  assert.strictEqual(result.fareInPoysha, 6000);
  assert.strictEqual(result.fareInBDT, 60.0);
  assert.strictEqual(result.breakdown.hops, 1);
  assert.strictEqual(result.breakdown.baseFarePoysha, 5000);
  assert.strictEqual(result.breakdown.distanceChargePoysha, 3000);
  assert.strictEqual(result.breakdown.poolDiscountPoysha, 2000);
});

test("Fare Engine - Rafiq's trip (Banani to Gulshan 1) calculates accurately", () => {
  const result = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Gulshan",
    seatsRequested: 1,
    isPooled: true,
  });

  // Banani -> Gulshan = 1 hop
  // (5000 + 3000) - 2000 = 6000 poysha = 60 BDT
  assert.strictEqual(result.fareInPoysha, 6000);
  assert.strictEqual(result.fareInBDT, 60.0);
  assert.strictEqual(result.breakdown.hops, 1);
});

test("Fare Engine - Non-pooled ride does not receive pool discount", () => {
  const result = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Mohakhali",
    seatsRequested: 1,
    isPooled: false,
  });

  // (5000 + 3000) - 0 = 8000 poysha = 80 BDT
  assert.strictEqual(result.fareInPoysha, 8000);
  assert.strictEqual(result.fareInBDT, 80.0);
  assert.strictEqual(result.breakdown.poolDiscountPoysha, 0);
});

test("Fare Engine - Multi-seat booking scales fare proportionally", () => {
  const result = calculateFare({
    pickupZone: "Banani",
    dropoffZone: "Mohakhali",
    seatsRequested: 2,
    isPooled: true,
  });

  // 2 seats * 6000 poysha = 12000 poysha = 120 BDT
  assert.strictEqual(result.fareInPoysha, 12000);
  assert.strictEqual(result.fareInBDT, 120.0);
  assert.strictEqual(result.breakdown.seats, 2);
});
