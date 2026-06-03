import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";

const databasePath = process.env.DATABASE_URL ?? "./data/auth.db";
const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
