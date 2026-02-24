// src/db/genre.ts
import { supabase } from "../supabase/client";

export type GenreRow = {
  id?: number;   
  name: string;  
};

export type DramaGenreRow = {
  drama_id: number;
  genre_id: number;
};

export async function upsertGenre(row: GenreRow): Promise<number> {
  const { data, error } = await supabase
    .from("genre")
    .upsert(row, { onConflict: "name" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as number;
}

export async function upsertDramaGenres(rows: DramaGenreRow[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("drama_genre")
    .upsert(rows, { onConflict: "drama_id,genre_id" });

  if (error) throw error;
}
