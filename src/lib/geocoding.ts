export type GeoLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type NominatimItem = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.GEOCODER_USER_AGENT ?? "carpool-lk/0.1 (contact: admin@carpool.lk)";

function parseCoordinate(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toGeoLocation(item: NominatimItem, fallbackName: string): GeoLocation | null {
  const lat = parseCoordinate(item.lat);
  const lng = parseCoordinate(item.lon);

  if (lat === null || lng === null) {
    return null;
  }

  const address = (item.display_name ?? fallbackName).trim();
  const label = (item.name ?? item.display_name?.split(",")[0] ?? fallbackName).trim();

  return {
    name: label || fallbackName,
    address,
    lat,
    lng,
  };
}

export async function resolveCityByName(name: string): Promise<GeoLocation | null> {
  const query = name.trim();

  if (!query) {
    return null;
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "lk");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimItem[];
    const first = results[0];

    if (!first) {
      return null;
    }

    return toGeoLocation(first, query);
  } catch {
    return null;
  }
}

export async function suggestCities(query: string, limit = 8): Promise<GeoLocation[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("countrycodes", "lk");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 10))));
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const results = (await response.json()) as NominatimItem[];

    return results
      .map((item) => toGeoLocation(item, trimmed))
      .filter((value): value is GeoLocation => value !== null);
  } catch {
    return [];
  }
}
