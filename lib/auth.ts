import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

import * as schema from "@/db/schema";
import { db } from "@/lib/db";

const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  appUrl,
].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

export const auth = betterAuth({
  baseURL: appUrl,
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev_only_4J6xM2qP9vT8wL1nZ7rS3uK5cH0yD4fB",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
  plugins: [nextCookies()],
});

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
