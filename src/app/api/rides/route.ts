import { NextResponse } from "next/server";

import { getFeaturedRides } from "@/lib/rides";

export async function GET() {
  const rides = await getFeaturedRides(12);
  return NextResponse.json({ rides });
}
