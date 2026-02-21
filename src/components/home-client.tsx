"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Clock3,
  MapPin,
  RefreshCw,
  Route,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LocationPicker,
  type LocationOption,
} from "@/components/location-picker";
import type { Ride } from "@/lib/rides";

type HomeClientProps = {
  initialRides: Ride[];
};

export function HomeClient({ initialRides }: HomeClientProps) {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date>(new Date());
  const [nowMs, setNowMs] = useState(Date.now());

  const [pickup, setPickup] = useState("Colombo");
  const [drop, setDrop] = useState("Kandy");
  const [pickupLocation, setPickupLocation] = useState<LocationOption | null>(
    null,
  );
  const [dropLocation, setDropLocation] = useState<LocationOption | null>(null);
  const [corridorKm, setCorridorKm] = useState(5);

  const [offerFrom, setOfferFrom] = useState("Colombo");
  const [offerTo, setOfferTo] = useState("Galle");
  const [offerFromLocation, setOfferFromLocation] =
    useState<LocationOption | null>(null);
  const [offerToLocation, setOfferToLocation] = useState<LocationOption | null>(
    null,
  );
  const [offerDeparture, setOfferDeparture] = useState("2026-03-01T07:00");
  const [offerSeats, setOfferSeats] = useState("2");
  const [offerPrice, setOfferPrice] = useState("1600");
  const [offerDriver, setOfferDriver] = useState("New Driver");

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  function formatLastFetched(value: Date): string {
    const elapsedMs = nowMs - value.getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);

    if (elapsedSec < 60) {
      return "Last fetched just now";
    }

    const elapsedMin = Math.floor(elapsedSec / 60);

    if (elapsedMin < 60) {
      return `Last fetched ${elapsedMin} min ago`;
    }

    const elapsedHours = Math.floor(elapsedMin / 60);
    return `Last fetched ${elapsedHours} hr ago`;
  }

  async function refreshAllRides() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rides", { cache: "no-store" });
      const data = (await response.json()) as { rides?: Ride[] };
      setRides(data.rides ?? []);
      setHasSearched(false);
      setLastFetchedAt(new Date());
    } catch {
      setError("Failed to refresh rides.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!pickupLocation || !dropLocation) {
      setLoading(false);
      setError("Pick both pickup and drop from API suggestions.");
      return;
    }

    try {
      const query = new URLSearchParams({
        pickup: pickupLocation.name,
        drop: dropLocation.name,
        pickupLat: String(pickupLocation.lat),
        pickupLng: String(pickupLocation.lng),
        dropLat: String(dropLocation.lat),
        dropLng: String(dropLocation.lng),
        corridorKm: String(corridorKm),
      });

      const response = await fetch(`/api/rides?${query.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        rides?: Ride[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Failed to search rides.");
        return;
      }

      setRides(data.rides ?? []);
      setHasSearched(true);
      setLastFetchedAt(new Date());
    } catch {
      setError("Failed to search rides.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!offerFromLocation || !offerToLocation) {
      setLoading(false);
      setError("Pick both departure and destination from API suggestions.");
      return;
    }

    const parsedSeats = Number(offerSeats);
    const parsedPrice = Number(offerPrice);

    if (!Number.isFinite(parsedSeats) || parsedSeats < 1) {
      setLoading(false);
      setError("Enter a valid passenger count.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 500) {
      setLoading(false);
      setError("Enter a valid price per passenger.");
      return;
    }

    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: offerFromLocation.name,
          to: offerToLocation.name,
          fromLat: offerFromLocation.lat,
          fromLng: offerFromLocation.lng,
          toLat: offerToLocation.lat,
          toLng: offerToLocation.lng,
          departureAtIso: new Date(offerDeparture).toISOString(),
          priceLkr: parsedPrice,
          seatsLeft: parsedSeats,
          driverName: offerDriver,
          driverRating: 4.7,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to publish ride.");
        return;
      }

      await refreshAllRides();
    } catch {
      setError("Failed to publish ride.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="rounded-3xl border-none bg-white/95 shadow-xl">
        <CardContent>
          <Tabs defaultValue="find" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="find">Find Ride</TabsTrigger>
              <TabsTrigger value="offer">Offer Ride</TabsTrigger>
            </TabsList>
            <TabsContent value="find" className="mt-4">
              <form className="space-y-3" onSubmit={handleSearch}>
                <LocationPicker
                  label="Pickup"
                  value={pickup}
                  onValueChange={setPickup}
                  onSelect={setPickupLocation}
                  placeholder="Type exact pickup (city, town, landmark)"
                />
                <LocationPicker
                  label="Drop"
                  value={drop}
                  onValueChange={setDrop}
                  onSelect={setDropLocation}
                  placeholder="Type exact drop (city, town, landmark)"
                />
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={corridorKm}
                  onChange={(e) => setCorridorKm(Number(e.target.value))}
                  placeholder="Route corridor in km"
                />
                <Button
                  className="h-11 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search Route Matches"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="offer" className="mt-4">
              <form className="space-y-3" onSubmit={handleOffer}>
                <LocationPicker
                  label="Departure"
                  value={offerFrom}
                  onValueChange={setOfferFrom}
                  onSelect={setOfferFromLocation}
                  placeholder="Type exact departure point"
                />
                <LocationPicker
                  label="Destination"
                  value={offerTo}
                  onValueChange={setOfferTo}
                  onSelect={setOfferToLocation}
                  placeholder="Type exact destination point"
                />
                <Input
                  type="datetime-local"
                  value={offerDeparture}
                  onChange={(e) => setOfferDeparture(e.target.value)}
                  placeholder="Departure date and time"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Passenger count"
                    type="number"
                    min={1}
                    max={7}
                    value={offerSeats}
                    onChange={(e) => setOfferSeats(e.target.value)}
                  />
                  <Input
                    placeholder="Price per passenger (LKR)"
                    type="number"
                    min={500}
                    step={100}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>
                <Input
                  value={offerDriver}
                  onChange={(e) => setOfferDriver(e.target.value)}
                  placeholder="Driver display name"
                />
                <Button
                  className="h-11 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500"
                  disabled={loading}
                >
                  {loading ? "Publishing..." : "Publish Ride"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <Card className="rounded-3xl border-slate-200/70 bg-white/95">
          <CardContent className="p-4 text-sm">
            {error && <p className="text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-[#f6efe5]/90 px-2 py-1">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-900">
            {hasSearched
              ? `Matched Rides (${rides.length})`
              : `Available Rides (${rides.length})`}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{formatLastFetched(lastFetchedAt)}</span>
            <Button
              variant="ghost"
              className="h-auto p-0 text-sm text-slate-600"
              onClick={refreshAllRides}
            >
              Refresh
              <RefreshCw className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        {rides.length === 0 && (
          <Card className="rounded-3xl border-slate-200/70 bg-white/95">
            <CardContent className="p-4 text-sm text-slate-600">
              No matches yet. Try different pickup/drop locations or a wider
              corridor.
            </CardContent>
          </Card>
        )}
        {rides.map((ride) => (
          <Card
            key={ride.id}
            className="rounded-3xl border-slate-200/70 bg-white/95"
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {ride.from}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  {ride.to}
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-amber-100 text-amber-700"
                >
                  LKR {ride.priceLkr}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {ride.dateLabel}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {ride.timeLabel}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {ride.seatsLeft} seats left
                </div>
                <div className="flex items-center gap-1.5">
                  <Route className="h-4 w-4" />
                  {ride.routeDistanceKm} km route
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {ride.driverRating} • {ride.driverName}
                </div>
                {ride.match && (
                  <div className="col-span-2 text-xs text-emerald-700">
                    Pickup {ride.match.pickupDistanceKm} km from route, drop{" "}
                    {ride.match.dropDistanceKm} km from route.
                  </div>
                )}
              </div>
              <Button className="h-10 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                Book seat
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
