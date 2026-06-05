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

  const airdate =
    episode.airdate && episode.airdate.trim() !== ""
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

export async function upsertEpisodes(rows: EpisodeRow[]): Promise<void> {
  if (rows.length === 0) return;

  rows.forEach((r) => {
    if (r.airdate === "" as any) {
      console.error("BUG: empty string airdate", r);
    }
  });

  const uniqueRows = Array.from(
    rows
      .reduce((map, row) => {
        const key = `${row.drama_id}-${row.season}-${row.number}`;
        if (!map.has(key)) {
          map.set(key, row);
        }
        return map;
      }, new Map<string, EpisodeRow>())
      .values()
  );

  const { error } = await supabase
    .from("episode")
    .upsert(uniqueRows, { onConflict: "drama_id,season,number" });

  if (error) throw error;
}
