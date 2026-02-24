"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTvmazePersonToActorRow = mapTvmazePersonToActorRow;
exports.mapTvmazeCastItemToDramaActorRow = mapTvmazeCastItemToDramaActorRow;
exports.upsertActor = upsertActor;
exports.upsertDramaActors = upsertDramaActors;
// src/db/actor.ts
const client_1 = require("../supabase/client");
function mapTvmazePersonToActorRow(person) {
    return {
        tvmaze_person_id: person.id,
        name: person.name,
        country: person.country?.code ?? null,
        birthday: person.birthday ?? null,
        gender: person.gender ?? null,
        photo_url: person.image?.medium ?? person.image?.original ?? null,
    };
}
function mapTvmazeCastItemToDramaActorRow(dramaId, actorDbId, item, index) {
    return {
        drama_id: dramaId,
        actor_id: actorDbId,
        character_name: item.character?.name ?? null,
        billing_order: index,
    };
}
async function upsertActor(row) {
    const { data, error } = await client_1.supabase
        .from("actor")
        .upsert(row, { onConflict: "tvmaze_person_id" })
        .select("id")
        .single();
    if (error)
        throw error;
    return data.id; // PK interno BIGSERIAL
}
async function upsertDramaActors(rows) {
    if (rows.length === 0)
        return;
    const { error } = await client_1.supabase
        .from("drama_actor")
        .upsert(rows, { onConflict: "drama_id,actor_id" });
    if (error)
        throw error;
}
