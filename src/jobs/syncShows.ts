// src/jobs/syncShows.ts
import { testDbConnection, pool } from "../db/client";
import { fetchShowUpdates } from "../tvmaze/client";

async function main() {
  console.log("Running drama-sync-tvmaze job...");

  const nowDb = await testDbConnection();
  console.log("DB connected, now():", nowDb);

  const updates = await fetchShowUpdates();
  const sampleEntries = Object.entries(updates).slice(0, 5);
  console.log("Sample TVMaze show updates (first 5):", sampleEntries);
}

main()
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
