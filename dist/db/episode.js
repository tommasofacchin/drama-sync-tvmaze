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
    const dedupedRows = Array.from(rows
        .reduce((acc, row) => {
        const key = `${row.drama_id}:${row.season}:${row.number}`;
        acc.set(key, row);
        return acc;
    }, new Map())
        .values());
    const { error } = await client_1.supabase
        .from("episode")
        .upsert(dedupedRows, { onConflict: "drama_id,season,number" });
    if (error)
        throw error;
}
