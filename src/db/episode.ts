import { supabase } from "../supabase/client";
import type { TvmazeEpisode } from "../tvmaze/client";

export type EpisodeRow = {
  drama_id: number;
  name: string;
  season: number;
  number: number;
  airdate: string | null;
  summary: string | null;
};

export function mapTvmazeEpisodeToEpisodeRow(
  dramaId: number,
  episode: TvmazeEpisode
): EpisodeRow | null {
  if (!episode.name || !episode.season || !episode.number) {
    return null;
  }

  if (episode.season <= 0 || episode.number <= 0) {
    return null;
  }

  return {
    drama_id: dramaId,
    name: episode.name,
    season: episode.season,
    number: episode.number,
    airdate: episode.airdate ?? null,
    summary: episode.summary ?? null,
  };
}

export async function upsertEpisodes(rows: EpisodeRow[]): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("episode")
    .upsert(rows, { onConflict: "drama_id,season,number" });

  if (error) throw error;
}
