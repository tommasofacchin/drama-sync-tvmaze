// src/config.ts
import "dotenv/config";

export const config = {
  databaseUrl: process.env.DATABASE_URL,
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
