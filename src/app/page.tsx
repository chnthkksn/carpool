import { CarFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { HomeClient } from "@/components/home-client";
import { getFeaturedRides } from "@/lib/rides";

export default async function Home() {
  const rides = await getFeaturedRides(12);

  return (
    <main className="relative min-h-screen bg-[#f6efe5] px-4 py-5 text-slate-900 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#0f172a_0%,#1e293b_72%,#f6efe5_100%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4 pb-8 sm:max-w-xl">
        <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-900/40">
          <div className="mb-4 flex items-center justify-between">
            <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300">Sri Lanka Intercity</Badge>
            <div className="flex items-center gap-1 text-sm text-slate-300">
              <CarFront className="h-4 w-4" />
              Carpool LK
            </div>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold leading-tight">
            Route-based rides across Sri Lanka.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Search by pickup and drop cities. Matches are computed against the full ride route, not just origin and destination.
          </p>
        </section>

        <HomeClient initialRides={rides} />
      </div>
    </main>
  );
}
