
const DHAKA_GRAPH = {
  Banani: ["Gulshan", "Mohakhali", "Uttara"],
  Gulshan: ["Banani", "Mohakhali", "Bashundhara"],
  Mohakhali: ["Banani", "Gulshan", "Farmgate"],
  Farmgate: ["Mohakhali", "Dhanmondi"],
  Dhanmondi: ["Farmgate", "Mirpur"],
  Mirpur: ["Dhanmondi", "Uttara"],
  Uttara: ["Banani", "Mirpur", "Bashundhara"],
  Bashundhara: ["Gulshan", "Uttara"],
};

// Normalize zone names for flexible matching (e.g. "Gulshan 1" -> "Gulshan")
const normalizeZone = (zoneStr) => {
  if (!zoneStr || typeof zoneStr !== "string") return "";
  const cleaned = zoneStr.trim().toLowerCase();
  for (const zone of Object.keys(DHAKA_GRAPH)) {
    if (cleaned.startsWith(zone.toLowerCase()) || zone.toLowerCase().startsWith(cleaned)) {
      return zone;
    }
  }
  return zoneStr.trim();
};

const isValidZone = (zone) => {
  const normalized = normalizeZone(zone);
  return Boolean(DHAKA_GRAPH[normalized]);
};

const getAllZones = () => {
  return Object.keys(DHAKA_GRAPH);
};

/**
 * Breadth-First Search (BFS) for shortest path between two zones
 */
const findShortestPath = (fromZone, toZone) => {
  const start = normalizeZone(fromZone);
  const target = normalizeZone(toZone);

  if (!isValidZone(start) || !isValidZone(target)) {
    return null;
  }

  if (start === target) {
    return [start];
  }

  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    const neighbors = DHAKA_GRAPH[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const newPath = [...path, neighbor];
        if (neighbor === target) {
          return newPath;
        }
        queue.push(newPath);
      }
    }
  }

  return null;
};

/**
 * Calculates hop distance (number of zone hops) between two zones
 */
const calculateHops = (fromZone, toZone) => {
  const path = findShortestPath(fromZone, toZone);
  if (!path) return 1; // Default to 1 hop minimum if not found
  return Math.max(1, path.length - 1);
};

/**
 * Route Compatibility Engine:
 * Evaluates whether two trips can be pooled together in the same Tesla.
 * Trip A: { pickupZone, dropoffZone }
 * Trip B: { pickupZone, dropoffZone }
 */
const areRoutesCompatible = (tripA, tripB) => {
  const startA = normalizeZone(tripA.pickupZone);
  const endA = normalizeZone(tripA.dropoffZone);
  const startB = normalizeZone(tripB.pickupZone);
  const endB = normalizeZone(tripB.dropoffZone);

  // If both start at the same pickup zone, they are prime candidates for pooling
  if (startA === startB) {
    const distanceBetweenDropoffs = calculateHops(endA, endB);
    if (distanceBetweenDropoffs <= 2) {
      return {
        compatible: true,
        reason: `Shared pickup hub (${startA}) with close destinations (${endA} & ${endB})`,
        sharedPickup: true,
      };
    }
  }

  // Path analysis
  const pathA = findShortestPath(startA, endA) || [];
  const pathB = findShortestPath(startB, endB) || [];

  const pathASet = new Set(pathA);
  const sharesPickup = pathASet.has(startB);
  const sharesDropoff = pathASet.has(endB);

  if (sharesPickup || sharesDropoff) {
    return {
      compatible: true,
      reason: `Route corridor overlaps along Dhaka arterial road (${startA} -> ${endA})`,
      sharedPickup: sharesPickup,
    };
  }

  // If starting zones are adjacent and ending zones are adjacent
  const pickupHops = calculateHops(startA, startB);
  const dropoffHops = calculateHops(endA, endB);

  if (pickupHops <= 1 && dropoffHops <= 1) {
    return {
      compatible: true,
      reason: `Adjacent pickup (${startA}/${startB}) and dropoff clusters (${endA}/${endB})`,
      sharedPickup: false,
    };
  }

  return {
    compatible: false,
    reason: "Routes diverge significantly across Dhaka quadrants",
  };
};

export {
  DHAKA_GRAPH,
  normalizeZone,
  isValidZone,
  getAllZones,
  findShortestPath,
  calculateHops,
  areRoutesCompatible,
};
