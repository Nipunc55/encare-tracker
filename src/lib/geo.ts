import { BAG_PRICES_LKR } from "./constants";
import { BagQuantities, Customer, TripStop } from "./types";

/**
 * Calculates straight-line Haversine distance in kilometers between two coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimates road driving distance & ETA in minutes tailored for Sri Lankan A-grade / hill routes.
 * Applies a 1.35x winding road factor + 4 mins handling time per intermediate stop.
 */
export function estimateStopEta(
  truckLat: number,
  truckLng: number,
  targetLat: number,
  targetLng: number,
  stopsBeforeTarget: number
): {
  roadDistanceKm: number;
  etaMinutes: number;
  isWithinPrivacyZone: boolean;
} {
  const directKm = haversineDistanceKm(truckLat, truckLng, targetLat, targetLng);
  const roadDistanceKm = Math.max(0.3, Number((directKm * 1.35).toFixed(1)));
  // Average 28 km/h on winding town/mountain roads + 4 mins per intermediate collection stop
  const driveMinutes = (roadDistanceKm / 28) * 60;
  const handlingMinutes = Math.max(0, stopsBeforeTarget) * 4;
  const etaMinutes = Math.max(2, Math.round(driveMinutes + handlingMinutes));

  // Privacy Geofence: Only show exact truck pin when within 35 km road distance
  const isWithinPrivacyZone = roadDistanceKm <= 35;

  return {
    roadDistanceKm,
    etaMinutes,
    isWithinPrivacyZone,
  };
}

/**
 * Nearest-Neighbor Route Optimizer ($0 client-side alternative to paid Google Routes API).
 * Orders pending stops starting from the vehicle's current coordinates.
 */
export function optimizeStopSequence(
  startLat: number,
  startLng: number,
  stops: TripStop[],
  customers: Customer[]
): TripStop[] {
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const completedOrDone = stops
    .filter((s) => s.status === "completed" || s.status === "unreachable")
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const remaining = stops.filter(
    (s) => s.status !== "completed" && s.status !== "unreachable"
  );

  const orderedRemaining: TripStop[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const cust = customerMap.get(remaining[i].customerId);
      if (!cust) continue;
      const d = haversineDistanceKm(curLat, curLng, cust.lat, cust.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const [chosen] = remaining.splice(bestIdx, 1);
    const chosenCust = customerMap.get(chosen.customerId);
    if (chosenCust) {
      curLat = chosenCust.lat;
      curLng = chosenCust.lng;
    }
    orderedRemaining.push(chosen);
  }

  const combined = [...completedOrDone, ...orderedRemaining];
  return combined.map((stop, idx) => ({
    ...stop,
    sequenceOrder: idx + 1,
    status:
      stop.status === "completed" || stop.status === "unreachable"
        ? stop.status
        : idx === completedOrDone.length
        ? "approaching"
        : stop.status === "approaching"
        ? "confirmed"
        : stop.status,
  }));
}

export function calculateBagOrderTotalLkr(bagOrder: BagQuantities): number {
  return (
    bagOrder.small * BAG_PRICES_LKR.small +
    bagOrder.medium * BAG_PRICES_LKR.medium +
    bagOrder.large * BAG_PRICES_LKR.large
  );
}

/**
 * Generates zero-cost mobile navigation deep links for Google Maps and Waze.
 */
export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function getWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
