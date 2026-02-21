import { ObjectId } from "mongodb";

import { resolveCityByName, type GeoLocation } from "@/lib/geocoding";
import { haversineDistanceKm, interpolatePath, projectPointOnPolyline, type LatLng } from "@/lib/geo";
import { getDb } from "@/lib/mongodb";
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
  routePoints?: LatLng[];
  departureAtIso?: string;
  dateLabel?: string;
  timeLabel?: string;
  priceLkr?: number;
  seatsLeft?: number;
  driverName?: string;
  driverRating?: number;
  routeDistanceKm?: number;
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

function normalizeRideDocument(document: RideDocument): Required<Omit<RideDocument, "_id">> {
  const fromFallback = document.from ?? "Unknown";
  const toFallback = document.to ?? "Unknown";

  const fromPoint =
    document.fromPoint ??
    { lat: 0, lng: 0 };

  const toPoint =
    document.toPoint ??
    { lat: 0, lng: 0 };

  const routePoints =
    document.routePoints && document.routePoints.length > 1
      ? document.routePoints
      : interpolatePath(fromPoint, toPoint, 18);

  const routeDistanceKm =
    typeof document.routeDistanceKm === "number"
      ? document.routeDistanceKm
      : routeDistance(routePoints);

  const departureAtIso =
    document.departureAtIso && !Number.isNaN(new Date(document.departureAtIso).getTime())
      ? document.departureAtIso
      : new Date().toISOString();

  return {
    from: fromFallback,
    to: toFallback,
    fromPoint,
    toPoint,
    routePoints,
    departureAtIso,
    dateLabel: document.dateLabel ?? "",
    timeLabel: document.timeLabel ?? "",
    priceLkr: document.priceLkr ?? 0,
    seatsLeft: document.seatsLeft ?? 1,
    driverName: document.driverName ?? "Driver",
    driverRating: document.driverRating ?? 4.5,
    routeDistanceKm,
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

async function buildRideDocument(input: CreateRideInput): Promise<RideDocument> {
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

  const waypointCities = await Promise.all((input.waypoints ?? []).map((name) => resolveCityByName(name)));

  const waypointPoints = waypointCities
    .filter((city): city is NonNullable<typeof city> => city !== null)
    .map((city) => ({ lat: city.lat, lng: city.lng }));

  const pathPoints: LatLng[] = [
    { lat: resolvedFrom.lat, lng: resolvedFrom.lng },
    ...waypointPoints,
    { lat: resolvedTo.lat, lng: resolvedTo.lng },
  ];

  const polyline = await buildRoutePolyline(pathPoints);

  return {
    from: resolvedFrom.name,
    to: resolvedTo.name,
    fromPoint: { lat: resolvedFrom.lat, lng: resolvedFrom.lng },
    toPoint: { lat: resolvedTo.lat, lng: resolvedTo.lng },
    routePoints: polyline,
    departureAtIso: input.departureAtIso,
    priceLkr: input.priceLkr,
    seatsLeft: input.seatsLeft,
    driverName: input.driverName,
    driverRating: input.driverRating ?? 4.6,
    routeDistanceKm: routeDistance(polyline),
  };
}

async function ensureSeedRides(): Promise<void> {
  const database = await getDb();
  const ridesCollection = database.collection<RideDocument>("rides");

  const count = await ridesCollection.countDocuments();

  if (count > 0) {
    return;
  }

  const seedDocs: RideDocument[] = [];

  for (const ride of seedInput) {
    const doc = await buildRideDocument(ride);
    seedDocs.push(doc);
  }

  if (seedDocs.length > 0) {
    await ridesCollection.insertMany(seedDocs);
  }
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const database = await getDb();
  const ridesCollection = database.collection<RideDocument>("rides");

  const document = await buildRideDocument(input);
  const insertResult = await ridesCollection.insertOne(document);

  return toRide({
    ...document,
    _id: insertResult.insertedId,
  });
}

export async function listRides(limit = 12): Promise<Ride[]> {
  await ensureSeedRides();

  const database = await getDb();
  const ridesCollection = database.collection<RideDocument>("rides");

  const rides = await ridesCollection.find().sort({ departureAtIso: 1 }).limit(limit).toArray();

  const hydrated = await Promise.all(
    rides.map(async (ride) => {
      const normalized = normalizeRideDocument(ride);
      const needsPatch =
        !ride.fromPoint ||
        !ride.toPoint ||
        !ride.routePoints ||
        ride.routePoints.length < 2 ||
        typeof ride.routeDistanceKm !== "number" ||
        !ride.departureAtIso;

      if (needsPatch && ride._id) {
        await ridesCollection.updateOne(
          { _id: ride._id },
          {
            $set: normalized,
          }
        );
      }

      return {
        ...ride,
        ...normalized,
      };
    })
  );

  return hydrated.map((ride) => toRide(ride));
}

export async function findRidesByRoute(
  pickup: LatLng,
  drop: LatLng,
  corridorKm = 5,
  limit = 20
): Promise<Ride[]> {
  await ensureSeedRides();

  const database = await getDb();
  const ridesCollection = database.collection<RideDocument>("rides");

  const rides = await ridesCollection.find().sort({ departureAtIso: 1 }).limit(limit).toArray();

  const matches: Ride[] = [];

  for (const ride of rides) {
    const normalized = normalizeRideDocument(ride);

    if (!normalized.routePoints || normalized.routePoints.length < 2 || normalized.seatsLeft <= 0) {
      continue;
    }

    const pickupProjection = projectPointOnPolyline(pickup, normalized.routePoints);
    const dropProjection = projectPointOnPolyline(drop, normalized.routePoints);

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
