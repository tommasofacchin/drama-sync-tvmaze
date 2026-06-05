"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTvmazeEpisodeToEpisodeRow = mapTvmazeEpisodeToEpisodeRow;
exports.upsertEpisodes = upsertEpisodes;
const client_1 = require("../supabase/client");
function mapTvmazeEpisodeToEpisodeRow(dramaId, episode) {
    if (!episode.name || !episode.season || !episode.number) {
        return null;
    }
    if (episode.season <= 0 || episode.number <= 0) {
        return null;
    }
    const airdate = episode.airdate && episode.airdate.trim() !== ""
        ? episode.airdate
        : null;
    return {
        drama_id: dramaId,
        name: episode.name,
        season: episode.season,
        number: episode.number,
        airdate: airdate,
        summary: episode.summary ?? null,
    };
}
async function upsertEpisodes(rows) {
    if (rows.length === 0)
        return;
    rows.forEach((r) => {
        if (r.airdate === "") {
            console.error("BUG: empty string airdate", r);
        }
    });
    const uniqueRows = Array.from(rows
        .reduce((map, row) => {
        const key = `${row.drama_id}-${row.season}-${row.number}`;
        if (!map.has(key)) {
            map.set(key, row);
        }
        return map;
    }, new Map())
        .values());
    const { error } = await client_1.supabase
        .from("episode")
        .upsert(uniqueRows, { onConflict: "drama_id,season,number" });
    if (error)
        throw error;
}
