// src/db/client.ts
import { Pool } from "pg";
import { config } from "../config";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function testDbConnection() {
  const res = await pool.query("SELECT NOW()");
  return res.rows[0].now as string;
}
