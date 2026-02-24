"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Failed to sign in");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 w-full bg-amber-400 text-slate-950 hover:bg-amber-300"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-amber-400 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
