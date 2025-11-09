import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Disable prefetch as it's not supported in "Transaction" mode
const client = postgres(connectionString, { prepare: false, ssl: false });

export const db = drizzle(client, { schema });

