import test from "node:test";
import assert from "node:assert";
import {
  findShortestPath,
  calculateHops,
  areRoutesCompatible,
  isValidZone,
  getAllZones,
} from "../src/utils/geoMatcher.js";

test("GeoMatcher - Validates pre-defined Dhaka zones without external Maps API", () => {
  assert.strictEqual(isValidZone("Banani"), true);
  assert.strictEqual(isValidZone("Gulshan"), true);
  assert.strictEqual(isValidZone("Mohakhali"), true);
  assert.strictEqual(isValidZone("Sylhet"), false);
  assert.ok(getAllZones().length >= 8);
});

test("GeoMatcher - Calculates path and hops correctly", () => {
  const path = findShortestPath("Banani", "Mohakhali");
  assert.deepStrictEqual(path, ["Banani", "Mohakhali"]);
  assert.strictEqual(calculateHops("Banani", "Mohakhali"), 1);

  const farmgatePath = findShortestPath("Banani", "Farmgate");
  assert.deepStrictEqual(farmgatePath, ["Banani", "Mohakhali", "Farmgate"]);
  assert.strictEqual(calculateHops("Banani", "Farmgate"), 2);
});

test("GeoMatcher - Nusrat and Rafiq overlapping trips are route-compatible", () => {
  const nusratTrip = { pickupZone: "Banani", dropoffZone: "Mohakhali" };
  const rafiqTrip = { pickupZone: "Banani", dropoffZone: "Gulshan" };

  const match = areRoutesCompatible(nusratTrip, rafiqTrip);
  assert.strictEqual(match.compatible, true);
  assert.strictEqual(match.sharedPickup, true);
});

test("GeoMatcher - Diametrically opposed routes are flagged as incompatible", () => {
  const tripA = { pickupZone: "Uttara", dropoffZone: "Bashundhara" };
  const tripB = { pickupZone: "Dhanmondi", dropoffZone: "Mirpur" };

  const match = areRoutesCompatible(tripA, tripB);
  assert.strictEqual(match.compatible, false);
});
