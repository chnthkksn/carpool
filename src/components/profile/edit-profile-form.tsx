"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function EditProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name === initialName) return;

    setIsLoading(true);

    try {
      const { error } = await authClient.updateUser({
        name,
      });

      if (error) {
        toast.error(error.message || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm pt-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-300">
          Display Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
        />
      </div>

      <Button
        type="submit"
        className="mt-2 w-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        disabled={isLoading || name === initialName}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Changes
      </Button>
    </form>
  );
}
