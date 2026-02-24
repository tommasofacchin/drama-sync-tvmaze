"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/jobs/syncShows.ts
const client_1 = require("../db/client");
const client_2 = require("../tvmaze/client");
async function main() {
    console.log("Running drama-sync-tvmaze job...");
    const nowDb = await (0, client_1.testDbConnection)();
    console.log("DB connected, now():", nowDb);
    const updates = await (0, client_2.fetchShowUpdates)();
    const sampleEntries = Object.entries(updates).slice(0, 5);
    console.log("Sample TVMaze show updates (first 5):", sampleEntries);
}
main()
    .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
})
    .finally(async () => {
    await client_1.pool.end();
});
