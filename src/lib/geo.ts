export type LatLng = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function interpolatePath(a: LatLng, b: LatLng, steps = 16): LatLng[] {
  const count = Math.max(2, steps);
  const points: LatLng[] = [];

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    points.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }

  return points;
}

function toLocalXY(point: LatLng, anchorLat: number): { x: number; y: number } {
  const kx = 111.32 * Math.cos(toRadians(anchorLat));
  const ky = 110.574;

  return {
    x: point.lng * kx,
    y: point.lat * ky,
  };
}

export function projectPointToSegment(point: LatLng, a: LatLng, b: LatLng): {
  point: LatLng;
  distanceKm: number;
  segmentProgress: number;
} {
  const anchorLat = (a.lat + b.lat + point.lat) / 3;
  const p = toLocalXY(point, anchorLat);
  const p1 = toLocalXY(a, anchorLat);
  const p2 = toLocalXY(b, anchorLat);

  const vx = p2.x - p1.x;
  const vy = p2.y - p1.y;
  const wx = p.x - p1.x;
  const wy = p.y - p1.y;
  const lensq = vx * vx + vy * vy;

  const rawT = lensq === 0 ? 0 : (wx * vx + wy * vy) / lensq;
  const t = Math.max(0, Math.min(1, rawT));

  const projX = p1.x + t * vx;
  const projY = p1.y + t * vy;

  const kx = 111.32 * Math.cos(toRadians(anchorLat));
  const ky = 110.574;

  const projected: LatLng = {
    lat: projY / ky,
    lng: kx === 0 ? a.lng : projX / kx,
  };

  return {
    point: projected,
    distanceKm: haversineDistanceKm(point, projected),
    segmentProgress: t,
  };
}

export function distanceAlongPolyline(points: LatLng[]): number[] {
  if (points.length === 0) {
    return [];
  }

  const cumulative = [0];

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];

    if (!prev || !current) {
      continue;
    }

    cumulative.push(cumulative[i - 1]! + haversineDistanceKm(prev, current));
  }

  return cumulative;
}

export function projectPointOnPolyline(point: LatLng, polyline: LatLng[]): {
  closestDistanceKm: number;
  alongDistanceKm: number;
} {
  if (polyline.length < 2) {
    return {
      closestDistanceKm: Number.POSITIVE_INFINITY,
      alongDistanceKm: 0,
    };
  }

  const cumulative = distanceAlongPolyline(polyline);
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestAlong = 0;

  for (let i = 0; i < polyline.length - 1; i += 1) {
    const start = polyline[i];
    const end = polyline[i + 1];

    if (!start || !end) {
      continue;
    }

    const projection = projectPointToSegment(point, start, end);

    if (projection.distanceKm < bestDistance) {
      bestDistance = projection.distanceKm;
      const segmentDistance = haversineDistanceKm(start, end);
      const segmentStartDistance = cumulative[i] ?? 0;
      bestAlong = segmentStartDistance + segmentDistance * projection.segmentProgress;
    }
  }

  return {
    closestDistanceKm: bestDistance,
    alongDistanceKm: bestAlong,
  };
}
