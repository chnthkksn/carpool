import { NextResponse } from "next/server";

import { resolveCityByName } from "@/lib/geocoding";
import { createRide, findRidesByRoute, listRides } from "@/lib/rides";

function getNumberParam(url: URL, key: string): number | null {
  const value = url.searchParams.get(key);

  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pickup = url.searchParams.get("pickup");
  const drop = url.searchParams.get("drop");
  const pickupLat = getNumberParam(url, "pickupLat");
  const pickupLng = getNumberParam(url, "pickupLng");
  const dropLat = getNumberParam(url, "dropLat");
  const dropLng = getNumberParam(url, "dropLng");
  const corridorKmRaw = Number(url.searchParams.get("corridorKm") ?? "5");
  const corridorKm = Number.isFinite(corridorKmRaw) ? corridorKmRaw : 5;

  const hasCoordinateQuery = pickupLat !== null && pickupLng !== null && dropLat !== null && dropLng !== null;

  if (hasCoordinateQuery) {
    const rides = await findRidesByRoute(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropLat, lng: dropLng },
      corridorKm
    );

    return NextResponse.json({ rides });
  }

  if (pickup && drop) {
    const [pickupCity, dropCity] = await Promise.all([resolveCityByName(pickup), resolveCityByName(drop)]);

    if (!pickupCity || !dropCity) {
      return NextResponse.json(
        {
          error: "Could not resolve pickup or drop location in Sri Lanka.",
        },
        { status: 400 }
      );
    }

    const rides = await findRidesByRoute(
      { lat: pickupCity.lat, lng: pickupCity.lng },
      { lat: dropCity.lat, lng: dropCity.lng },
      corridorKm
    );

    return NextResponse.json({ rides });
  }

  const rides = await listRides(20);
  return NextResponse.json({ rides });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    from?: string;
    to?: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    departureAtIso?: string;
    priceLkr?: number;
    seatsLeft?: number;
    driverName?: string;
    driverRating?: number;
  };

  if (
    !body.from ||
    !body.to ||
    !body.departureAtIso ||
    !body.priceLkr ||
    !body.seatsLeft ||
    !body.driverName
  ) {
    return NextResponse.json(
      {
        error: "Missing required fields.",
      },
      { status: 400 }
    );
  }

  const ride = await createRide({
    from: body.from,
    to: body.to,
    fromLocation:
      Number.isFinite(body.fromLat) && Number.isFinite(body.fromLng)
        ? {
            name: body.from,
            lat: body.fromLat as number,
            lng: body.fromLng as number,
          }
        : undefined,
    toLocation:
      Number.isFinite(body.toLat) && Number.isFinite(body.toLng)
        ? {
            name: body.to,
            lat: body.toLat as number,
            lng: body.toLng as number,
          }
        : undefined,
    departureAtIso: body.departureAtIso,
    priceLkr: body.priceLkr,
    seatsLeft: body.seatsLeft,
    driverName: body.driverName,
    driverRating: body.driverRating,
  });

  return NextResponse.json({ ride }, { status: 201 });
}
