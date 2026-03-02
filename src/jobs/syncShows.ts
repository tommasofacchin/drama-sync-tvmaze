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
  fetchShowEpisodes,        
  fetchEpisodeGuestCast,
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
import {
  mapTvmazeEpisodeToEpisodeRow,
  upsertEpisodes,
  EpisodeRow,
} from "../db/episode";



const SOURCE = "tvmaze_shows";
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 1000;
const MAX_REQ_PER_WINDOW = 50;
const WINDOW_MS = 10_000; 
const DELAY_MS = Math.ceil(WINDOW_MS / MAX_REQ_PER_WINDOW);
const EPISODE_DELAY_MS = 200;

async function main() {
  console.log("Running drama-sync-tvmaze job...");

  const state = await getOrCreateSyncState(SOURCE);
  const since =
    state.last_since ?? Math.floor(Date.now() / 1000) - 24 * 3600;

  console.log("Fetching updates since", since);
  
  const updatesMap = await fetchUpdatedShowIdsSince(since);
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
    const ts = Number(
      limitEntries.find(([entryId]) => Number(entryId) === id)![1]
    );
  
    if (ts < since) {
      console.warn(
        `FATAL: about to process show ${id} with ts ${ts} < since ${since}`
      );
      continue;
    }
  
    console.log(
      `Processing show ${id} (${index + 1}/${limitIds.length}) updated at timestamp: ${ts}`
    );
      
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

    
    console.log(
      `Processing show ${id} - "${row.title}"`
    );

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
    const episodes = await fetchShowEpisodes(id);
    const episodeRows: EpisodeRow[] = episodes
      .map((episode) => mapTvmazeEpisodeToEpisodeRow(dramaId, episode))
      .filter((row): row is EpisodeRow => row !== null);

    await upsertEpisodes(episodeRows);

    const guestCastItemsAll: typeof castItems = [];

    for (const ep of episodes) {
      await sleep(EPISODE_DELAY_MS);
      const episodeGuestCast = await fetchEpisodeGuestCast(ep.id); // /episodes/:id/guestcast
      guestCastItemsAll.push(...episodeGuestCast);
    }

    const allCastItems = [...castItems, ...guestCastItemsAll];
    const byPerson = new Map<number, { item: any; isGuest: boolean }>();

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

    const dramaActorRows: DramaActorRow[] = [];
    const seen = new Set<string>();

    console.log(`drama: ${row.title}`);

    let order = 0;
    for (const { item, isGuest } of byPerson.values()) {
      const actorRow = mapTvmazePersonToActorRow(item.person);
      const actorId = await upsertActor(actorRow);

      const key = `${dramaId}-${actorId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const dar = mapTvmazeCastItemToDramaActorRow(
        dramaId,
        actorId,
        item,
        order
      );
      dramaActorRows.push(dar);

      const label = isGuest ? "guest cast" : "cast";
      console.log(` - ${label}: ${actorRow.name}`);

      order++;
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
