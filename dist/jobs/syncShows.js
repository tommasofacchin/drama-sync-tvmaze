"use strict";
// src/jobs/syncShows.ts
Object.defineProperty(exports, "__esModule", { value: true });
const drama_1 = require("../db/drama");
const syncState_1 = require("../db/syncState");
const client_1 = require("../tvmaze/client");
const actor_1 = require("../db/actor");
const genre_1 = require("../db/genre");
const SOURCE = "tvmaze_shows";
const BATCH_SIZE = 1000;
const MAX_REQ_PER_WINDOW = 50;
const WINDOW_MS = 10000;
const DELAY_MS = Math.ceil(WINDOW_MS / MAX_REQ_PER_WINDOW);
async function main() {
    console.log("Running drama-sync-tvmaze job...");
    const state = await (0, syncState_1.getOrCreateSyncState)(SOURCE);
    const since = state.last_since ?? Math.floor(Date.now() / 1000) - 24 * 3600;
    console.log("Fetching updates since", since);
    const updatesMap = await (0, client_1.fetchUpdatedShowIdsSince)(since);
    const entries = Object.entries(updatesMap);
    console.log("Updated shows count:", entries.length);
    if (entries.length === 0) {
        console.log("No updates, keeping last_since =", since);
        return;
    }
    entries.sort((a, b) => a[1] - b[1]);
    const ids = entries.map(([id]) => Number(id));
    const limitIds = ids.slice(0, BATCH_SIZE);
    let processed = 0;
    let processedKdrama = 0;
    let batchMaxSince = since;
    for (const [index, id] of limitIds.entries()) {
        console.log(`Processing show ${id} (${index + 1}/${limitIds.length})`);
        if (index > 0) {
            await sleep(DELAY_MS);
        }
        const show = await (0, client_1.fetchShowById)(id);
        const row = (0, drama_1.mapTvmazeShowToDramaRow)(show);
        const ts = updatesMap[id.toString()];
        if (ts && ts > batchMaxSince) {
            batchMaxSince = ts;
        }
        processed++;
        if (!(0, drama_1.isKDrama)(row)) {
            continue;
        }
        const dramaId = await (0, drama_1.upsertDrama)(row);
        // === generi ===
        const genres = show.genres ?? [];
        const dramaGenreRows = [];
        const seenGenres = new Set();
        for (const g of genres) {
            if (!g)
                continue;
            const name = g.trim();
            if (!name || seenGenres.has(name))
                continue;
            seenGenres.add(name);
            const genreId = await (0, genre_1.upsertGenre)({ name });
            dramaGenreRows.push({ drama_id: dramaId, genre_id: genreId });
        }
        await (0, genre_1.upsertDramaGenres)(dramaGenreRows);
        processedKdrama++;
        const castItems = await (0, client_1.fetchShowCast)(id);
        const dramaActorRows = [];
        const seen = new Set();
        for (let i = 0; i < castItems.length; i++) {
            const item = castItems[i];
            const actorRow = (0, actor_1.mapTvmazePersonToActorRow)(item.person);
            const actorId = await (0, actor_1.upsertActor)(actorRow);
            const key = `${dramaId}-${actorId}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            dramaActorRows.push((0, actor_1.mapTvmazeCastItemToDramaActorRow)(dramaId, actorId, item, i));
        }
        await (0, actor_1.upsertDramaActors)(dramaActorRows);
    }
    const newLastSince = batchMaxSince;
    await (0, syncState_1.updateSyncState)(SOURCE, newLastSince);
    console.log("Processed shows:", processed);
    console.log("Processed Kdramas:", processedKdrama);
    console.log("New last_since =", newLastSince);
}
main().catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
});
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
