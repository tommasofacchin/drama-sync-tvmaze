// src/jobs/syncShows.ts

import {
  mapTvmazeShowToDramaRow,
  upsertDrama,
  isKDrama,
} from "../db/drama";
import {
  getOrCreateSyncState,
  updateSyncState,
} from "../db/syncState";
import {
  fetchUpdatedShowIdsSince,
  fetchShowById,
  fetchShowCast,
} from "../tvmaze/client";
import {
  mapTvmazePersonToActorRow,
  mapTvmazeCastItemToDramaActorRow,
  upsertActor,
  upsertDramaActors,
  DramaActorRow,
} from "../db/actor";
import {
  upsertGenre,
  upsertDramaGenres,
  DramaGenreRow,
} from "../db/genre";



const SOURCE = "tvmaze_shows";
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 1000;
const MAX_REQ_PER_WINDOW = 50;
const WINDOW_MS = 10_000; 
const DELAY_MS = Math.ceil(WINDOW_MS / MAX_REQ_PER_WINDOW);

async function main() {
  console.log("Running drama-sync-tvmaze job...");

  const state = await getOrCreateSyncState(SOURCE);
  const since =
    state.last_since ?? Math.floor(Date.now() / 1000) - 24 * 3600;

  console.log("Fetching updates since", since);

  const updatesMap = await fetchUpdatedShowIdsSince(since);
  console.log("Fetched updates from TVMaze:", updatesMap);
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
    const ts = updatesMap[id.toString()];
    console.log(`Processing show ${id} (${index + 1}/${limitIds.length}) updated at timestamp: ${ts}`);

    if (index > 0) {
        await sleep(DELAY_MS);
    }

    const show = await fetchShowById(id);
    const row = mapTvmazeShowToDramaRow(show);

    if (ts && ts > batchMaxSince) {
        batchMaxSince = ts;
    }

    processed++;

    if (!isKDrama(row)) {
        continue;
    }

    const dramaId = await upsertDrama(row);

    const genres = show.genres ?? [];
    const dramaGenreRows: DramaGenreRow[] = [];
    const seenGenres = new Set<string>();

    for (const g of genres) {
    if (!g) continue;
    const name = g.trim();
    if (!name || seenGenres.has(name)) continue;
    seenGenres.add(name);

    const genreId = await upsertGenre({ name });
    dramaGenreRows.push({ drama_id: dramaId, genre_id: genreId });
    }

    await upsertDramaGenres(dramaGenreRows);


    processedKdrama++;

    const castItems = await fetchShowCast(id);

    const dramaActorRows: DramaActorRow[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < castItems.length; i++) {
    const item = castItems[i];
    const actorRow = mapTvmazePersonToActorRow(item.person);
    const actorId = await upsertActor(actorRow);

    const key = `${dramaId}-${actorId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    dramaActorRows.push(
        mapTvmazeCastItemToDramaActorRow(dramaId, actorId, item, i)
    );
    }


    await upsertDramaActors(dramaActorRows);
    }



  const newLastSince = batchMaxSince;
  await updateSyncState(SOURCE, newLastSince);

  console.log("Processed shows:", processed);
  console.log("Processed Kdramas:", processedKdrama);
  console.log("New last_since =", newLastSince);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
