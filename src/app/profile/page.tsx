import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { TwoFactorSettings } from "@/components/profile/two-factor-settings";
import { PasskeySettings } from "@/components/profile/passkey-settings";

export const metadata = {
  title: "Profile - Carpool LK",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const isTwoFactorEnabled = !!(user as Record<string, unknown>)
    .twoFactorEnabled;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 pb-8 sm:max-w-xl">
      <section className="rounded-3xl bg-slate-950 px-6 sm:px-8 py-8 text-white shadow-lg shadow-slate-900/40">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8 border-b border-slate-800 pb-8">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-slate-800 text-slate-300 shadow-inner shrink-0">
            <User className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>

          <div className="flex flex-col gap-1 sm:gap-2 flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-bold leading-tight">
                {user.name}
              </h1>
              {isTwoFactorEnabled && (
                <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20 w-fit">
                  2FA Enabled
                </Badge>
              )}
            </div>
            <p className="text-base sm:text-lg text-slate-400">{user.email}</p>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="flex flex-col sm:flex-row w-full bg-slate-900/50 sm:bg-slate-900 mb-8 p-1 gap-1 h-auto rounded-xl sm:space-y-0 space-y-1">
            <TabsTrigger
              value="general"
              className="w-full sm:flex-1 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-white text-slate-400 hover:text-slate-200 py-3 sm:py-2.5 text-sm bg-slate-900 sm:bg-transparent"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="w-full sm:flex-1 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-white text-slate-400 hover:text-slate-200 py-3 sm:py-2.5 text-sm bg-slate-900 sm:bg-transparent"
            >
              Password
            </TabsTrigger>
            <TabsTrigger
              value="two-factor"
              className="w-full sm:flex-1 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-white text-slate-400 hover:text-slate-200 py-3 sm:py-2.5 text-sm bg-slate-900 sm:bg-transparent"
            >
              Advanced Security
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="general"
            className="mt-0 animate-in fade-in duration-300"
          >
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white border-b border-slate-800 pb-2">
                Profile Information
              </h3>
              <EditProfileForm initialName={user.name} />
            </div>
          </TabsContent>

          <TabsContent
            value="security"
            className="mt-0 animate-in fade-in duration-300"
          >
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white border-b border-slate-800 pb-2">
                Change Password
              </h3>
              <p className="text-sm text-slate-400">
                Update your account password to ensure security.
              </p>
              <ChangePasswordForm />
            </div>
          </TabsContent>

          <TabsContent
            value="two-factor"
            className="mt-0 animate-in fade-in duration-300 flex flex-col gap-10"
          >
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white border-b border-slate-800 pb-2">
                Two-Factor Authentication
              </h3>
              <TwoFactorSettings isTwoFactorEnabled={isTwoFactorEnabled} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white border-b border-slate-800 pb-2">
                Passkeys
              </h3>
              <p className="text-sm text-slate-400">
                Sign in securely without a password using your device&apos;s
                biometrics or security key.
              </p>
              <PasskeySettings />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
