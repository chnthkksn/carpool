"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-800" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-300 hover:text-white"
        >
          <Link href="/login">Sign In</Link>
        </Button>
        <Button
          size="sm"
          asChild
          className="bg-amber-400 text-slate-950 hover:bg-amber-300"
        >
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <User className="h-4 w-4" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-slate-800 bg-slate-950 text-slate-300"
      >
        <DropdownMenuLabel className="font-normal text-white">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name}
            </p>
            <p className="text-xs leading-none text-slate-500">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-slate-900 focus:text-white"
          >
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-slate-900 focus:text-white"
          >
            <Link href="/settings">
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-400 focus:bg-slate-900 focus:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
