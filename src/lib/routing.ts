import type { LatLng } from "@/lib/geo";
import { interpolatePath } from "@/lib/geo";

type OsrmRoute = {
  routes?: Array<{
    geometry?: {
      coordinates?: number[][];
    };
  }>;
};

function toCoordinateString(points: LatLng[]): string {
  return points.map((point) => `${point.lng},${point.lat}`).join(";");
}

async function getRouteFromOsrm(points: LatLng[]): Promise<LatLng[] | null> {
  const coordinateString = toCoordinateString(points);
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OsrmRoute;
    const coords = data.routes?.[0]?.geometry?.coordinates;

    if (!coords || coords.length < 2) {
      return null;
    }

    return coords
      .filter((coord) => coord.length >= 2)
      .map((coord) => ({ lat: coord[1]!, lng: coord[0]! }));
  } catch {
    return null;
  }
}

function fallbackRoute(points: LatLng[]): LatLng[] {
  if (points.length <= 1) {
    return points;
  }

  const route: LatLng[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];

    if (!start || !end) {
      continue;
    }

    const segment = interpolatePath(start, end, 18);

    if (i === 0) {
      route.push(...segment);
    } else {
      route.push(...segment.slice(1));
    }
  }

  return route;
}

export async function buildRoutePolyline(points: LatLng[]): Promise<LatLng[]> {
  if (points.length < 2) {
    return points;
  }

  const osrmRoute = await getRouteFromOsrm(points);

  if (osrmRoute && osrmRoute.length > 1) {
    return osrmRoute;
  }

  return fallbackRoute(points);
}
