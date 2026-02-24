"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSyncState = getOrCreateSyncState;
exports.updateSyncState = updateSyncState;
// src/db/syncState.ts
const client_1 = require("../supabase/client");
async function getOrCreateSyncState(source) {
    const { data, error } = await client_1.supabase
        .from("external_sync_state")
        .select("source,last_since")
        .eq("source", source)
        .maybeSingle();
    if (error) {
        throw error;
    }
    if (data) {
        return {
            source: data.source,
            last_since: data.last_since,
        };
    }
    const nowUnix = Math.floor(Date.now() / 1000);
    const { data: inserted, error: insertError } = await client_1.supabase
        .from("external_sync_state")
        .insert({ source, last_since: nowUnix })
        .select("source,last_since")
        .single();
    if (insertError) {
        throw insertError;
    }
    return {
        source: inserted.source,
        last_since: inserted.last_since,
    };
}
async function updateSyncState(source, lastSince) {
    const { error } = await client_1.supabase
        .from("external_sync_state")
        .update({
        last_since: lastSince,
        updated_at: new Date().toISOString(),
    })
        .eq("source", source);
    if (error) {
        throw error;
    }
}
