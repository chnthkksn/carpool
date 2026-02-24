"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TwoFactorSettings({
  isTwoFactorEnabled,
}: {
  isTwoFactorEnabled: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your current password.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to enable 2FA");
        return;
      }

      if (data && data.totpURI) {
        setTotpURI(data.totpURI);
        toast.success("2FA Generated. Scan the QR code to finish setup.");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      toast.error("Please enter your current password to disable 2FA.");
      return;
    }

    setIsDisabling(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("2FA has been disabled.");
      setPassword("");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm pt-4">
      <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4 mb-2">
        {isTwoFactorEnabled ? (
          <ShieldCheck className="h-6 w-6 text-green-400" />
        ) : (
          <ShieldAlert className="h-6 w-6 text-amber-500" />
        )}
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">
            {isTwoFactorEnabled ? "2FA is Enabled" : "2FA is Disabled"}
          </span>
          <span className="text-sm text-slate-400">
            {isTwoFactorEnabled
              ? "Your account is secured with Two-Factor Authentication."
              : "Enhance your security by enabling 2FA."}
          </span>
        </div>
      </div>

      {!isTwoFactorEnabled && !totpURI && (
        <form onSubmit={handleEnable2FA} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-slate-300">
              Current Password
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password to authorize"
              className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enable 2FA
          </Button>
        </form>
      )}

      {totpURI && (
        <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
          <p className="text-sm text-slate-300 mt-2">
            Scan the QR code below using an authenticator app (like Google
            Authenticator or Authy).
          </p>
          <div className="bg-white p-4 rounded-xl self-start">
            <QRCode value={totpURI} size={150} />
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-700 bg-transparent text-white hover:bg-slate-800 mt-2"
            onClick={() => setTotpURI("")}
          >
            Done
          </Button>
        </div>
      )}

      {isTwoFactorEnabled && (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="disablePassword" className="text-slate-300">
              Current Password
            </Label>
            <Input
              id="disablePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to disable"
              className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={handleDisable2FA}
            variant="destructive"
            className="w-full disabled:opacity-50"
            disabled={isDisabling || !password}
          >
            {isDisabling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Disable 2FA
          </Button>
        </div>
      )}
    </div>
  );
}
