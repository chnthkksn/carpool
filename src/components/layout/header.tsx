import Link from "next/link";
import { CarFront } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex w-full max-w-md sm:max-w-xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-white hover:text-slate-200"
        >
          <CarFront className="h-5 w-5" />
          Carpool LK
        </Link>
        <UserNav />
      </div>
    </header>
  );
}
