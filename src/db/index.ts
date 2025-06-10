import env from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

import postgres from "postgres";

const connectionString = env.DATABASE_URL!;

export const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export default db;
