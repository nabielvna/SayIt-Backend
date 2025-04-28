import env from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";

import postgres from "postgres";

const connectionString = env.DATABASE_URL!;

export const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

export default db;
