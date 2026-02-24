import { Badge } from "@/components/ui/badge";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create Account - Carpool LK",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md sm:max-w-xl">
        <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-900/40 text-white">
          <div className="mb-6 flex items-center justify-between">
            <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300">
              Get Started
            </Badge>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold leading-tight">
            Create an Account
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-300">
            Sign up to post rides and connect with passengers.
          </p>

          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
