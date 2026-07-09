import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";

export const auth = betterAuth({
  database: pool,
  databaseHooks: {
    user: {
      create: {
        // Bootstrap ownership: the very first registered user becomes Admin so
        // a fresh deployment always has someone who can manage roles/settings.
        // Everyone after that defaults to Engineer.
        before: async (userData) => {
          let role = "Engineer";
          try {
            const existing = await pool.query('SELECT 1 FROM "user" LIMIT 1');
            if (existing.rowCount === 0) role = "Admin";
          } catch (err) {
            console.log(
              "[v0] first-user bootstrap check failed, defaulting role:",
              err instanceof Error ? err.message : String(err),
            );
          }
          return { data: { ...userData, role } };
        },
      },
    },
  },
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
