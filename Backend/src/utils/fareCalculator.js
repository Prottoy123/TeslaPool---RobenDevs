import { calculateHops } from "./geoMatcher.js";



const FARE_CONFIG = {
  BASE_FARE_POYSHA: 5000,       // 50 BDT
  PER_HOP_CHARGE_POYSHA: 3000,  // 30 BDT per zone transition
  POOL_DISCOUNT_POYSHA: 2000,   // 20 BDT discount for sharing the Tesla
  MINIMUM_FARE_POYSHA: 3000,    // 30 BDT minimum floor
};

const calculateFare = ({
  pickupZone,
  dropoffZone,
  seatsRequested = 1,
  isPooled = true,
}) => {
  const seats = Math.max(1, Math.min(3, parseInt(seatsRequested, 10) || 1));
  const hops = calculateHops(pickupZone, dropoffZone);

  const baseFare = FARE_CONFIG.BASE_FARE_POYSHA * seats;
  const distanceCharge = (hops * FARE_CONFIG.PER_HOP_CHARGE_POYSHA) * seats;
  const poolDiscount = isPooled ? (FARE_CONFIG.POOL_DISCOUNT_POYSHA * seats) : 0;

  let totalFare = (baseFare + distanceCharge) - poolDiscount;
  totalFare = Math.max(FARE_CONFIG.MINIMUM_FARE_POYSHA * seats, totalFare);

  return {
    fareInPoysha: Math.round(totalFare),
    fareInBDT: Number((totalFare / 100).toFixed(2)),
    breakdown: {
      seats,
      hops,
      baseFarePoysha: baseFare,
      distanceChargePoysha: distanceCharge,
      poolDiscountPoysha: poolDiscount,
      totalPoysha: Math.round(totalFare),
    },
  };
};

export { FARE_CONFIG, calculateFare };
