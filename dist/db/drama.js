"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDrama = upsertDrama;
exports.mapTvmazeShowToDramaRow = mapTvmazeShowToDramaRow;
exports.isKDrama = isKDrama;
// src/db/drama.ts
const client_1 = require("../supabase/client");
async function upsertDrama(row) {
    const { data, error } = await client_1.supabase
        .from("drama")
        .upsert(row, { onConflict: "tvmaze_id" })
        .select("id")
        .single();
    if (error)
        throw error;
    return data.id;
}
function mapTvmazeShowToDramaRow(show) {
    const country = show.network?.country?.code ??
        show.webChannel?.country?.code ??
        null;
    return {
        tvmaze_id: show.id,
        title: show.name,
        language: show.language ?? null,
        country,
        premiered_date: show.premiered ?? null, // "YYYY-MM-DD"
        status: show.status ?? null,
        summary_html: show.summary ?? null,
        poster_url: show.image?.original ?? null,
        official_site: show.officialSite ?? null,
    };
}
function isKDrama(row) {
    const isKoreanLang = row.language === "Korean";
    const isKoreanCountry = row.country === "KR";
    return isKoreanLang || isKoreanCountry;
}
