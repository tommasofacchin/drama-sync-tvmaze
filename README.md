# drama-sync-tvmaze

This is a Node.js/TypeScript job that keeps a Supabase/PostgreSQL database of Korean dramas in sync with TVMaze.

It daily pulls updated shows from the TVMaze API, filters for K‑dramas, and upserts shows, genres and cast information into the database. The script is designed to run both locally and on a schedule via GitHub Actions.

---

## Tech stack

- Node.js + TypeScript
- PostgreSQL (hosted on Supabase)
- TVMaze public API
- `@supabase/supabase-js` for database access
- GitHub Actions workflow for scheduled runs

---

## Project structure

```text
drama-sync-tvmaze/
├─ src/
│  ├─ tvmaze/
│  │  └─ client.ts        # TVMaze API client 
│  ├─ db/
│  │  ├─ drama.ts         # drama table mapping, upserts, K-drama check
│  │  ├─ actor.ts         # actor table + drama_actor join helpers
│  │  ├─ genre.ts         # genre + drama_genre helpers
│  │  └─ syncState.ts     # last_since tracking per source
│  ├─ jobs/
│  │  └─ syncShows.ts     # main sync job
│  └─ supabase/
│     └─ client.ts        # Supabase client setup
├─ .github/
│  └─ workflows/
│     └─ sync-tvmaze.yml  # scheduled GitHub Actions workflow
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ README.md
```

---

## How the sync works

1. Read the sync state for the `tvmaze_shows` source from the database.
2. Call the TVMaze updates endpoint with `since = last_since` to get all show IDs that changed after that timestamp.
3. Filter and sort the updates by timestamp.
4. Process the first `BATCH_SIZE` entries in ascending order of timestamp:
   - fetch full show details
   - map to the local `drama` schema
   - skip anything that is not a K‑drama
   - upsert the drama
   - upsert its genres and the `drama_genre` relations
   - fetch the cast, upsert actors and `drama_actor` relations
5. Track the maximum timestamp seen in the batch and persist it back to `sync_state` as the new `last_since`.

---

## Configuration

The job expects database and API configuration to be provided via environment variables. 

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BATCH_SIZE` (optional, defaults to `1000`)

The database schema includes:

- `drama`  
- `actor`  
- `drama_actor`  
- `genre`  
- `drama_genre`  
- `sync_state` 
