import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

import { db } from "@/lib/mongodb";

const appUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "development-secret-change-in-production-12345";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  secret: authSecret,
  baseURL: appUrl,
  trustedOrigins: [appUrl],
  plugins: [nextCookies(), twoFactor(), passkey()],
});
