"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<
    Array<{ id: string; name?: string | null }>
  >([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPendeingList, setIsPendingList] = useState(true);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (!error && data) {
        setPasskeys(data);
      }
    } catch {
      toast.error("Failed to load passkeys");
    } finally {
      setIsPendingList(false);
    }
  };

  const handleAddPasskey = async () => {
    setIsRegistering(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: `Passkey ${new Date().toLocaleDateString()}`,
      });

      if (error) {
        toast.error(error.message || "Failed to add passkey");
        return;
      }
      toast.success("Passkey registered successfully.");
      await fetchPasskeys();
    } catch {
      toast.error("Unexpected error registering passkey.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        toast.error(error.message || "Failed to delete passkey");
        return;
      }
      toast.success("Passkey deleted successfully.");
      await fetchPasskeys();
    } catch {
      toast.error("Unexpected error deleting passkey.");
    }
  };

  if (isPendeingList) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm pt-4">
      <div className="space-y-4">
        {passkeys.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            No passkeys registered yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <div className="flex items-center gap-3 text-slate-300">
                  <KeyRound className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {pk.name || "Passkey"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-400"
                  onClick={() => handleDeletePasskey(pk.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleAddPasskey}
        className="mt-2 w-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        disabled={isRegistering}
      >
        {isRegistering ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Register New Passkey
      </Button>
    </div>
  );
}
