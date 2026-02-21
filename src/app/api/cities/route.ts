import { NextResponse } from "next/server";

import { suggestCities } from "@/lib/geocoding";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  const locations = await suggestCities(query);

  return NextResponse.json({
    locations,
  });
}
