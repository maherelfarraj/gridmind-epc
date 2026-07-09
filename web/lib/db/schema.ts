import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables (do not rename columns — Better Auth expects these names)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("Engineer"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// App tables — scoped per user via `userId` (no FK by design, for easy iteration)
// ---------------------------------------------------------------------------
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  projectType: text("projectType"),
  location: text("location"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  userId: text("userId").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const scadaLog = pgTable("scada_log", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  projectId: text("projectId").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  acPowerKw: doublePrecision("acPowerKw"),
  dcPowerKw: doublePrecision("dcPowerKw"),
  poaIrradiance: doublePrecision("poaIrradiance"),
  moduleTempC: doublePrecision("moduleTempC"),
  ambientTempC: doublePrecision("ambientTempC"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const designHistory = pgTable("design_history", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  projectId: text("projectId").notNull(),
  label: text("label").notNull(),
  authorName: text("authorName"),
  summary: jsonb("summary").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
