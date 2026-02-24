"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertGenre = upsertGenre;
exports.upsertDramaGenres = upsertDramaGenres;
// src/db/genre.ts
const client_1 = require("../supabase/client");
async function upsertGenre(row) {
    const { data, error } = await client_1.supabase
        .from("genre")
        .upsert(row, { onConflict: "name" })
        .select("id")
        .single();
    if (error)
        throw error;
    return data.id;
}
async function upsertDramaGenres(rows) {
    if (rows.length === 0)
        return;
    const { error } = await client_1.supabase
        .from("drama_genre")
        .upsert(rows, { onConflict: "drama_id,genre_id" });
    if (error)
        throw error;
}
