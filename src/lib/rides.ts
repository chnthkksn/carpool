import { Collection, ObjectId } from "mongodb";

import { resolveCityByName, type GeoLocation } from "@/lib/geocoding";
import { haversineDistanceKm, interpolatePath, projectPointOnPolyline, type LatLng } from "@/lib/geo";
import { getDb } from "@/lib/mongodb";
import {
  computeRouteBounds,
  corridorKmToDegreeBuffers,
  decodePolyline,
  encodePolyline,
  simplifyPolyline,
  type RouteBounds,
} from "@/lib/route-compression";
import { buildRoutePolyline } from "@/lib/routing";

export type Ride = {
  id: string;
  from: string;
  to: string;
  dateLabel: string;
  timeLabel: string;
  departureAtIso: string;
  priceLkr: number;
  seatsLeft: number;
  driverName: string;
  driverRating: number;
  routeDistanceKm: number;
  match?: {
    pickupDistanceKm: number;
    dropDistanceKm: number;
  };
};

type RideDocument = {
  _id?: ObjectId;
  from?: string;
  to?: string;
  fromPoint?: LatLng;
  toPoint?: LatLng;
  departureAtIso?: string;
  priceLkr?: number;
  seatsLeft?: number;
  driverName?: string;
  driverRating?: number;
  routeDistanceKm?: number;
  routeMinLat?: number;
  routeMaxLat?: number;
  routeMinLng?: number;
  routeMaxLng?: number;
  routePoints?: LatLng[];
};

type RideRouteDocument = {
  _id?: ObjectId;
  rideId: ObjectId;
  routePolyline?: string;
  routePoints?: LatLng[];
  routeDistanceKm: number;
  pointCount?: number;
  updatedAt: string;
};

export type CreateRideInput = {
  from: string;
  to: string;
  fromLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  toLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  departureAtIso: string;
  priceLkr: number;
  seatsLeft: number;
  driverName: string;
  driverRating?: number;
  waypoints?: string[];
};

type BuiltRoutePayload = {
  ride: RideDocument;
  compressedPoints: LatLng[];
  encodedPolyline: string;
  routeDistanceKm: number;
  bounds: RouteBounds;
};

const seedInput: CreateRideInput[] = [
  {
    from: "Colombo",
    to: "Kandy",
    departureAtIso: "2026-03-01T06:30:00.000Z",
    priceLkr: 1800,
    seatsLeft: 2,
    driverName: "Kasun Perera",
    driverRating: 4.8,
  },
  {
    from: "Galle",
    to: "Colombo",
    departureAtIso: "2026-03-01T07:15:00.000Z",
    priceLkr: 1500,
    seatsLeft: 1,
    driverName: "Nadeesha Silva",
    driverRating: 4.9,
  },
  {
    from: "Negombo",
    to: "Ella",
    departureAtIso: "2026-03-02T05:50:00.000Z",
    priceLkr: 3400,
    seatsLeft: 3,
    driverName: "Tharindu Jayasekara",
    driverRating: 4.7,
    waypoints: ["Kandy"],
  },
  {
    from: "Kurunegala",
    to: "Jaffna",
    departureAtIso: "2026-03-02T09:00:00.000Z",
    priceLkr: 3900,
    seatsLeft: 2,
    driverName: "Iresha Fernando",
    driverRating: 4.6,
    waypoints: ["Anuradhapura"],
  },
];

function routeDistance(points: LatLng[]): number {
  if (points.length < 2) {
    return 0;
  }

  let sum = 0;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];

    if (!prev || !curr) {
      continue;
    }

    sum += haversineDistanceKm(prev, curr);
  }

  return sum;
}

function boundsFromPoints(points: LatLng[]): RouteBounds {
  if (points.length < 2) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  return computeRouteBounds(points);
}

function normalizeRideDocument(document: RideDocument): Required<Omit<RideDocument, "_id" | "routePoints">> {
  const from = document.from ?? "Unknown";
  const to = document.to ?? "Unknown";
  const fromPoint = document.fromPoint ?? { lat: 0, lng: 0 };
  const toPoint = document.toPoint ?? { lat: 0, lng: 0 };
  const departureAtIso =
    document.departureAtIso && !Number.isNaN(new Date(document.departureAtIso).getTime())
      ? document.departureAtIso
      : new Date().toISOString();

  return {
    from,
    to,
    fromPoint,
    toPoint,
    departureAtIso,
    priceLkr: document.priceLkr ?? 0,
    seatsLeft: document.seatsLeft ?? 1,
    driverName: document.driverName ?? "Driver",
    driverRating: document.driverRating ?? 4.5,
    routeDistanceKm: typeof document.routeDistanceKm === "number" ? document.routeDistanceKm : 0,
    routeMinLat: typeof document.routeMinLat === "number" ? document.routeMinLat : Math.min(fromPoint.lat, toPoint.lat),
    routeMaxLat: typeof document.routeMaxLat === "number" ? document.routeMaxLat : Math.max(fromPoint.lat, toPoint.lat),
    routeMinLng: typeof document.routeMinLng === "number" ? document.routeMinLng : Math.min(fromPoint.lng, toPoint.lng),
    routeMaxLng: typeof document.routeMaxLng === "number" ? document.routeMaxLng : Math.max(fromPoint.lng, toPoint.lng),
  };
}

function toRide(document: RideDocument, match?: Ride["match"]): Ride {
  const normalized = normalizeRideDocument(document);
  const departure = new Date(normalized.departureAtIso);

  return {
    id: String(document._id ?? `${normalized.from}-${normalized.to}-${normalized.departureAtIso}`),
    from: normalized.from,
    to: normalized.to,
    dateLabel: departure.toLocaleDateString("en-LK", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    timeLabel: departure.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    departureAtIso: normalized.departureAtIso,
    priceLkr: normalized.priceLkr,
    seatsLeft: normalized.seatsLeft,
    driverName: normalized.driverName,
    driverRating: normalized.driverRating,
    routeDistanceKm: Number(normalized.routeDistanceKm.toFixed(1)),
    match,
  };
}

async function ensureCollections() {
  const db = await getDb();
  const ridesCollection = db.collection<RideDocument>("rides");
  const routesCollection = db.collection<RideRouteDocument>("ride_routes");

  await Promise.all([
    ridesCollection.createIndex({ departureAtIso: 1 }),
    ridesCollection.createIndex({ seatsLeft: 1 }),
    ridesCollection.createIndex({ routeMinLat: 1, routeMaxLat: 1, routeMinLng: 1, routeMaxLng: 1 }),
    routesCollection.createIndex({ rideId: 1 }, { unique: true }),
  ]);

  return { ridesCollection, routesCollection };
}

async function buildRidePayload(input: CreateRideInput): Promise<BuiltRoutePayload> {
  const [resolvedFrom, resolvedTo] = await Promise.all([
    input.fromLocation
      ? Promise.resolve<GeoLocation>({
          name: input.fromLocation.name,
          address: input.fromLocation.name,
          lat: input.fromLocation.lat,
          lng: input.fromLocation.lng,
        })
      : resolveCityByName(input.from),
    input.toLocation
      ? Promise.resolve<GeoLocation>({
          name: input.toLocation.name,
          address: input.toLocation.name,
          lat: input.toLocation.lat,
          lng: input.toLocation.lng,
        })
      : resolveCityByName(input.to),
  ]);

  if (!resolvedFrom || !resolvedTo) {
    throw new Error("Could not resolve departure or destination city.");
  }

  const waypointLocations = await Promise.all((input.waypoints ?? []).map((name) => resolveCityByName(name)));
  const waypointPoints = waypointLocations
    .filter((location): location is NonNullable<typeof location> => location !== null)
    .map((location) => ({ lat: location.lat, lng: location.lng }));

  const pathPoints: LatLng[] = [
    { lat: resolvedFrom.lat, lng: resolvedFrom.lng },
    ...waypointPoints,
    { lat: resolvedTo.lat, lng: resolvedTo.lng },
  ];

  const rawRoutePoints = await buildRoutePolyline(pathPoints);
  const compressedPoints = simplifyPolyline(rawRoutePoints, 0.1, 220);
  const encodedPolyline = encodePolyline(compressedPoints);
  const distanceKm = routeDistance(compressedPoints);
  const bounds = boundsFromPoints(compressedPoints);

  return {
    ride: {
      from: resolvedFrom.name,
      to: resolvedTo.name,
      fromPoint: { lat: resolvedFrom.lat, lng: resolvedFrom.lng },
      toPoint: { lat: resolvedTo.lat, lng: resolvedTo.lng },
      departureAtIso: input.departureAtIso,
      priceLkr: input.priceLkr,
      seatsLeft: input.seatsLeft,
      driverName: input.driverName,
      driverRating: input.driverRating ?? 4.6,
      routeDistanceKm: distanceKm,
      routeMinLat: bounds.minLat,
      routeMaxLat: bounds.maxLat,
      routeMinLng: bounds.minLng,
      routeMaxLng: bounds.maxLng,
    },
    compressedPoints,
    encodedPolyline,
    routeDistanceKm: distanceKm,
    bounds,
  };
}

async function upsertRouteForRide(
  routesCollection: Collection<RideRouteDocument>,
  rideId: ObjectId,
  routePolyline: string,
  routeDistanceKm: number,
  pointCount: number
) {
  await routesCollection.updateOne(
    { rideId },
    {
      $set: {
        rideId,
        routePolyline,
        routeDistanceKm,
        pointCount,
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        routePoints: "",
      },
    },
    { upsert: true }
  );
}

function toFallbackRoutePoints(ride: RideDocument): LatLng[] {
  if (ride.routePoints && ride.routePoints.length > 1) {
    return ride.routePoints;
  }

  const normalized = normalizeRideDocument(ride);
  return interpolatePath(normalized.fromPoint, normalized.toPoint, 18);
}

async function resolveRoutePointsForRide(
  ridesCollection: Collection<RideDocument>,
  routesCollection: Collection<RideRouteDocument>,
  ride: RideDocument
): Promise<LatLng[]> {
  const rideId = ride._id;

  if (!rideId) {
    return toFallbackRoutePoints(ride);
  }

  const routeDoc = await routesCollection.findOne({ rideId });

  if (routeDoc?.routePolyline) {
    const decoded = decodePolyline(routeDoc.routePolyline);
    if (decoded.length > 1) {
      return decoded;
    }
  }

  const legacyRoutePoints =
    routeDoc?.routePoints && routeDoc.routePoints.length > 1 ? routeDoc.routePoints : toFallbackRoutePoints(ride);

  const compressedPoints = simplifyPolyline(legacyRoutePoints, 0.1, 220);
  const routePolyline = encodePolyline(compressedPoints);
  const distanceKm = routeDistance(compressedPoints);
  const bounds = boundsFromPoints(compressedPoints);

  await Promise.all([
    upsertRouteForRide(routesCollection, rideId, routePolyline, distanceKm, compressedPoints.length),
    ridesCollection.updateOne(
      { _id: rideId },
      {
        $set: {
          ...normalizeRideDocument(ride),
          routeDistanceKm: distanceKm,
          routeMinLat: bounds.minLat,
          routeMaxLat: bounds.maxLat,
          routeMinLng: bounds.minLng,
          routeMaxLng: bounds.maxLng,
        },
        $unset: {
          routePoints: "",
        },
      }
    ),
  ]);

  return compressedPoints;
}

async function ensureSeedRides(): Promise<void> {
  const { ridesCollection, routesCollection } = await ensureCollections();
  const count = await ridesCollection.countDocuments();

  if (count > 0) {
    return;
  }

  for (const input of seedInput) {
    const payload = await buildRidePayload(input);
    const insertResult = await ridesCollection.insertOne(payload.ride);

    await upsertRouteForRide(
      routesCollection,
      insertResult.insertedId,
      payload.encodedPolyline,
      payload.routeDistanceKm,
      payload.compressedPoints.length
    );
  }
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const { ridesCollection, routesCollection } = await ensureCollections();
  const payload = await buildRidePayload(input);
  const insertResult = await ridesCollection.insertOne(payload.ride);

  await upsertRouteForRide(
    routesCollection,
    insertResult.insertedId,
    payload.encodedPolyline,
    payload.routeDistanceKm,
    payload.compressedPoints.length
  );

  return toRide({
    ...payload.ride,
    _id: insertResult.insertedId,
  });
}

export async function listRides(limit = 12): Promise<Ride[]> {
  await ensureSeedRides();

  const { ridesCollection } = await ensureCollections();

  const rides = await ridesCollection
    .find(
      {},
      {
        projection: {
          routePoints: 0,
        },
      }
    )
    .sort({ departureAtIso: 1 })
    .limit(limit)
    .toArray();

  return rides.map((ride) => toRide(ride));
}

export async function findRidesByRoute(
  pickup: LatLng,
  drop: LatLng,
  corridorKm = 5,
  limit = 20
): Promise<Ride[]> {
  await ensureSeedRides();

  const { ridesCollection, routesCollection } = await ensureCollections();

  const minLat = Math.min(pickup.lat, drop.lat);
  const maxLat = Math.max(pickup.lat, drop.lat);
  const minLng = Math.min(pickup.lng, drop.lng);
  const maxLng = Math.max(pickup.lng, drop.lng);

  const refLat = (pickup.lat + drop.lat) / 2;
  const { latBuffer, lngBuffer } = corridorKmToDegreeBuffers(corridorKm, refLat);

  const candidateRides = await ridesCollection
    .find(
      {
        seatsLeft: { $gt: 0 },
        $or: [
          {
            routeMinLat: { $lte: minLat + latBuffer },
            routeMaxLat: { $gte: maxLat - latBuffer },
            routeMinLng: { $lte: minLng + lngBuffer },
            routeMaxLng: { $gte: maxLng - lngBuffer },
          },
          {
            routeMinLat: { $exists: false },
          },
        ],
      },
      {
        projection: {
          routePoints: 0,
        },
      }
    )
    .sort({ departureAtIso: 1 })
    .limit(Math.max(limit * 4, limit))
    .toArray();

  const matches: Ride[] = [];

  for (const ride of candidateRides) {
    const normalized = normalizeRideDocument(ride);

    if (normalized.seatsLeft <= 0) {
      continue;
    }

    const routePoints = await resolveRoutePointsForRide(ridesCollection, routesCollection, ride);

    if (routePoints.length < 2) {
      continue;
    }

    const pickupProjection = projectPointOnPolyline(pickup, routePoints);
    const dropProjection = projectPointOnPolyline(drop, routePoints);

    const isWithinCorridor =
      pickupProjection.closestDistanceKm <= corridorKm && dropProjection.closestDistanceKm <= corridorKm;
    const inOrder = pickupProjection.alongDistanceKm < dropProjection.alongDistanceKm;

    if (!isWithinCorridor || !inOrder) {
      continue;
    }

    matches.push(
      toRide(
        {
          ...ride,
          ...normalized,
        },
        {
          pickupDistanceKm: Number(pickupProjection.closestDistanceKm.toFixed(2)),
          dropDistanceKm: Number(dropProjection.closestDistanceKm.toFixed(2)),
        }
      )
    );

    if (matches.length >= limit) {
      break;
    }
  }

  return matches;
}

export async function getFeaturedRides(limit = 4): Promise<Ride[]> {
  try {
    return await listRides(limit);
  } catch {
    return [];
  }
}
