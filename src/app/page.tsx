import { ArrowRight, Calendar, CarFront, Clock3, MapPin, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFeaturedRides } from "@/lib/rides";

export default async function Home() {
  const rides = await getFeaturedRides();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#1e293b_40%,#f6efe5_40%,#f6efe5_100%)] px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-8 sm:max-w-xl">
        <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-900/40">
          <div className="mb-4 flex items-center justify-between">
            <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300">Sri Lanka Intercity</Badge>
            <div className="flex items-center gap-1 text-sm text-slate-300">
              <CarFront className="h-4 w-4" />
              Carpool LK
            </div>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold leading-tight">
            Share rides across Sri Lanka.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            First version to find seats or offer rides from Colombo to Kandy, Galle, Ella and more.
          </p>
        </section>

        <Card className="rounded-3xl border-none bg-white/95 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-[family-name:var(--font-space-grotesk)] text-xl">Start A Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="find" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="find">Find Ride</TabsTrigger>
                <TabsTrigger value="offer">Offer Ride</TabsTrigger>
              </TabsList>
              <TabsContent value="find" className="mt-4 space-y-3">
                <Input placeholder="From (e.g. Colombo)" />
                <Input placeholder="To (e.g. Kandy)" />
                <Input type="date" />
                <Button className="h-11 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                  Search Rides
                </Button>
              </TabsContent>
              <TabsContent value="offer" className="mt-4 space-y-3">
                <Input placeholder="Departure city" />
                <Input placeholder="Destination city" />
                <Input placeholder="Available seats" type="number" min={1} max={7} />
                <Button className="h-11 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500">
                  Publish Ride
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-900">
              Featured Rides
            </h2>
            <Button variant="ghost" className="h-auto p-0 text-sm text-slate-600">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {rides.map((ride) => (
            <Card key={ride.id} className="rounded-3xl border-slate-200/70 bg-white/95">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {ride.from}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    {ride.to}
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-700">
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
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {ride.driverRating} • {ride.driverName}
                  </div>
                </div>
                <Button className="h-10 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                  Book seat
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
