"use strict";
// src/jobs/syncShows.ts
Object.defineProperty(exports, "__esModule", { value: true });
const drama_1 = require("../db/drama");
const syncState_1 = require("../db/syncState");
const client_1 = require("../tvmaze/client");
const actor_1 = require("../db/actor");
const genre_1 = require("../db/genre");
const episode_1 = require("../db/episode");
const SOURCE = "tvmaze_shows";
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 1000;
const MAX_REQ_PER_WINDOW = 50;
const WINDOW_MS = 10000;
const DELAY_MS = Math.ceil(WINDOW_MS / MAX_REQ_PER_WINDOW);
const EPISODE_DELAY_MS = 200;
async function main() {
    console.log("Running drama-sync-tvmaze job...");
    const state = await (0, syncState_1.getOrCreateSyncState)(SOURCE);
    const since = state.last_since ?? Math.floor(Date.now() / 1000) - 24 * 3600;
    console.log("Fetching updates since", since);
    const updatesMap = await (0, client_1.fetchUpdatedShowIdsSince)(since);
    console.log("Raw updates count:", Object.keys(updatesMap).length);
    const entries = Object.entries(updatesMap)
        .filter(([id, ts]) => {
        const numTs = Number(ts);
        const ok = numTs >= since;
        return ok;
    });
    if (entries.length === 0) {
        console.log("No updates, keeping last_since =", since);
        return;
    }
    console.log("Filtered updates count:", entries.length);
    entries.sort((a, b) => Number(a[1]) - Number(b[1]));
    const limitEntries = entries.slice(0, BATCH_SIZE);
    const limitIds = limitEntries.map(([id]) => Number(id));
    let processed = 0;
    let processedKdrama = 0;
    let batchMaxSince = since;
    for (const [index, id] of limitIds.entries()) {
        const ts = Number(limitEntries.find(([entryId]) => Number(entryId) === id)[1]);
        if (ts < since) {
            console.warn(`FATAL: about to process show ${id} with ts ${ts} < since ${since}`);
            continue;
        }
        console.log(`Processing show ${id} (${index + 1}/${limitIds.length}) updated at timestamp: ${ts}`);
        if (index > 0) {
            await sleep(DELAY_MS);
        }
        const show = await (0, client_1.fetchShowById)(id);
        if (!show) {
            if (ts && ts > batchMaxSince)
                batchMaxSince = ts;
            continue;
        }
        const row = (0, drama_1.mapTvmazeShowToDramaRow)(show);
        if (ts && ts > batchMaxSince) {
            batchMaxSince = ts;
        }
        processed++;
        if (!(0, drama_1.isKDrama)(row)) {
            continue;
        }
        console.log(`Processing show ${id} - "${row.title}"`);
        const dramaId = await (0, drama_1.upsertDrama)(row);
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
        const episodes = await (0, client_1.fetchShowEpisodes)(id);
        const episodeRows = episodes
            .map((episode) => (0, episode_1.mapTvmazeEpisodeToEpisodeRow)(dramaId, episode))
            .filter((row) => row !== null);
        await (0, episode_1.upsertEpisodes)(episodeRows);
        const guestCastItemsAll = [];
        for (const ep of episodes) {
            await sleep(EPISODE_DELAY_MS);
            const episodeGuestCast = await (0, client_1.fetchEpisodeGuestCast)(ep.id); // /episodes/:id/guestcast
            guestCastItemsAll.push(...episodeGuestCast);
        }
        const allCastItems = [...castItems, ...guestCastItemsAll];
        const byPerson = new Map();
        for (const item of castItems) {
            const pid = item.person.id;
            if (!byPerson.has(pid)) {
                byPerson.set(pid, { item, isGuest: false });
            }
        }
        for (const item of guestCastItemsAll) {
            const pid = item.person.id;
            if (!byPerson.has(pid)) {
                byPerson.set(pid, { item, isGuest: true });
            }
        }
        const dramaActorRows = [];
        const seen = new Set();
        console.log(`drama: ${row.title}`);
        let order = 0;
        for (const { item, isGuest } of byPerson.values()) {
            const actorRow = (0, actor_1.mapTvmazePersonToActorRow)(item.person);
            const actorId = await (0, actor_1.upsertActor)(actorRow);
            const key = `${dramaId}-${actorId}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const dar = (0, actor_1.mapTvmazeCastItemToDramaActorRow)(dramaId, actorId, item, order);
            dramaActorRows.push(dar);
            const label = isGuest ? "guest cast" : "cast";
            console.log(` - ${label}: ${actorRow.name}`);
            order++;
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
