import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - Carpool LK",
};

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md sm:max-w-xl">
        <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-900/40 text-white">
          <div className="mb-6 flex items-center justify-between">
            <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300">
              Welcome Back
            </Badge>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold leading-tight">
            Sign In
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-300">
            Enter your email and password to access your account.
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
