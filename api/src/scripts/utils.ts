export const POINT_DISTANCE_METERS = Number(
  process.env.POINT_DISTANCE_METERS ?? "0.6"
);

export const intervalForSpeed = (speedKmh: number, fallbackMs: number) => {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) {
    return fallbackMs;
  }

  const distanceKm = POINT_DISTANCE_METERS / 1000;
  const hoursPerSegment = distanceKm / speedKmh;
  const intervalMs = hoursPerSegment * 3600 * 1000;

  return Math.max(10, intervalMs);
};


