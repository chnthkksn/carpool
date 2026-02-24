import { Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Settings - Carpool LK",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 pb-8 sm:max-w-xl">
      <section className="rounded-3xl bg-slate-950 px-6 sm:px-8 py-8 text-white shadow-lg shadow-slate-900/40">
        <div className="mb-6 flex items-center justify-between">
          <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300">
            Account Settings
          </Badge>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300 shrink-0">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">General</h2>
              <p className="text-sm text-slate-400">
                Manage your account preferences and settings.
              </p>
            </div>
          </div>

          <div className="text-slate-400 text-sm mt-4 italic bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            Settings functionality is not yet fully implemented.
            <br />
            <br />
            Check back soon for updates to password management, notification
            preferences, and more.
          </div>

          <div className="flex justify-end pt-4">
            <Button
              asChild
              className="bg-slate-800 text-white hover:bg-slate-700"
            >
              <Link href="/profile">Back to Profile</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
