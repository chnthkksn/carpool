"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
        <Label htmlFor="currentPassword" className="text-slate-300">
          Current Password
        </Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-slate-300">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-300">
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
        />
      </div>

      <Button
        type="submit"
        className="mt-2 w-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        disabled={
          isLoading || !currentPassword || !newPassword || !confirmPassword
        }
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Update Password
      </Button>
    </form>
  );
}
