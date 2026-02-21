import { haversineDistanceKm, type LatLng } from "@/lib/geo";

export type RouteBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

function encodeSigned(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let output = "";

  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }

  output += String.fromCharCode(v + 63);
  return output;
}

export function encodePolyline(points: LatLng[]): string {
  if (points.length === 0) {
    return "";
  }

  let result = "";
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    result += encodeSigned(lat - prevLat);
    result += encodeSigned(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return result;
}

function decodeNextValue(polyline: string, startIndex: number): { value: number; nextIndex: number } {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = polyline.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && index < polyline.length + 1);

  const value = result & 1 ? ~(result >> 1) : result >> 1;

  return {
    value,
    nextIndex: index,
  };
}

export function decodePolyline(polyline: string): LatLng[] {
  if (!polyline) {
    return [];
  }

  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    const latStep = decodeNextValue(polyline, index);
    index = latStep.nextIndex;
    lat += latStep.value;

    const lngStep = decodeNextValue(polyline, index);
    index = lngStep.nextIndex;
    lng += lngStep.value;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

function distanceFromSegmentKm(point: LatLng, start: LatLng, end: LatLng): number {
  const segmentDistance = haversineDistanceKm(start, end);

  if (segmentDistance === 0) {
    return haversineDistanceKm(point, start);
  }

  const steps = 8;
  let best = Number.POSITIVE_INFINITY;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sample: LatLng = {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    };

    const distance = haversineDistanceKm(point, sample);
    if (distance < best) {
      best = distance;
    }
  }

  return best;
}

function simplifyRdp(points: LatLng[], toleranceKm: number): LatLng[] {
  if (points.length <= 2) {
    return points;
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;

  let maxDistance = 0;
  let index = -1;

  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i]!;
    const distance = distanceFromSegmentKm(point, first, last);

    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > toleranceKm && index !== -1) {
    const left = simplifyRdp(points.slice(0, index + 1), toleranceKm);
    const right = simplifyRdp(points.slice(index), toleranceKm);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

export function simplifyPolyline(points: LatLng[], toleranceKm = 0.15, maxPoints = 240): LatLng[] {
  if (points.length <= 2) {
    return points;
  }

  const simplified = simplifyRdp(points, toleranceKm);

  if (simplified.length <= maxPoints) {
    return simplified;
  }

  const stride = Math.ceil(simplified.length / maxPoints);
  const reduced: LatLng[] = [];

  for (let i = 0; i < simplified.length; i += stride) {
    const point = simplified[i];
    if (point) {
      reduced.push(point);
    }
  }

  const last = simplified[simplified.length - 1];
  if (last && reduced[reduced.length - 1] !== last) {
    reduced.push(last);
  }

  return reduced;
}

export function computeRouteBounds(points: LatLng[]): RouteBounds {
  if (points.length === 0) {
    return {
      minLat: 0,
      maxLat: 0,
      minLng: 0,
      maxLng: 0,
    };
  }

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lng < minLng) minLng = point.lng;
    if (point.lng > maxLng) maxLng = point.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function corridorKmToDegreeBuffers(corridorKm: number, referenceLat: number): { latBuffer: number; lngBuffer: number } {
  const latBuffer = corridorKm / 110.574;
  const lngBase = 111.32 * Math.cos((referenceLat * Math.PI) / 180);
  const safeLngBase = Math.abs(lngBase) < 1e-6 ? 1e-6 : Math.abs(lngBase);

  return {
    latBuffer,
    lngBuffer: corridorKm / safeLngBase,
  };
}
