// src/db/drama.ts
import { supabase } from "../supabase/client";
import type { TvmazeShow } from "../tvmaze/client";

export type DramaRow = {
  id?: number;
  tvmaze_id: number;
  title: string;
  language: string | null;
  country: string | null;
  premiered_date: string | null;
  status: string | null;
  summary_html: string | null;
  poster_url: string | null;
  official_site: string | null;
};

export async function upsertDrama(row: DramaRow): Promise<number> {
  const { data, error } = await supabase
    .from("drama")
    .upsert(row, { onConflict: "tvmaze_id" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as number;
}


export function mapTvmazeShowToDramaRow(show: TvmazeShow): DramaRow {
  const country =
    show.network?.country?.code ??
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

export function isKDrama(row: DramaRow): boolean {
  const isKoreanLang = row.language === "Korean";
  const isKoreanCountry = row.country === "KR";

  return isKoreanLang || isKoreanCountry;
}

