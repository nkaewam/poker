import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/poker";

// Disable prefetch as it's not supported in "Transaction" mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

