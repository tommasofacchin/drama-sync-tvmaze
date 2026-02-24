// src/db/syncState.ts
import { supabase } from "../supabase/client";

export type SyncState = {
  source: string;
  last_since: number | null;
};

export async function getOrCreateSyncState(
  source: string
): Promise<SyncState> {
  const { data, error } = await supabase
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

  const { data: inserted, error: insertError } = await supabase
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

export async function updateSyncState(
  source: string,
  lastSince: number
): Promise<void> {
  const { error } = await supabase
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
