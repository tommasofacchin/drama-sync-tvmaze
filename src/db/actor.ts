// src/db/actor.ts
import { supabase } from "../supabase/client";

export type ActorRow = {
  id?: number;
  tvmaze_person_id: number;
  name: string;
  country: string | null;
  birthday: string | null;
  gender: string | null;
  photo_url: string | null;
};

export type DramaActorRow = {
  drama_id: number;
  actor_id: number;
  character_name: string | null;
  billing_order: number | null;
};

export function mapTvmazePersonToActorRow(person: any): ActorRow {
  return {
    tvmaze_person_id: person.id,
    name: person.name,
    country: person.country?.code ?? null,
    birthday: person.birthday ?? null,
    gender: person.gender ?? null,
    photo_url: person.image?.medium ?? person.image?.original ?? null,
  };
}

export function mapTvmazeCastItemToDramaActorRow(
  dramaId: number,
  actorDbId: number,
  item: any,
  index: number
): DramaActorRow {
  return {
    drama_id: dramaId,
    actor_id: actorDbId,
    character_name: item.character?.name ?? null,
    billing_order: index,
  };
}


export async function upsertActor(row: ActorRow): Promise<number> {
  const { data, error } = await supabase
    .from("actor")
    .upsert(row, { onConflict: "tvmaze_person_id" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as number; // PK interno BIGSERIAL
}

export async function upsertDramaActors(rows: DramaActorRow[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("drama_actor")
    .upsert(rows, { onConflict: "drama_id,actor_id" });

  if (error) throw error;
}
