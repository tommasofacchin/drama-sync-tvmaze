// src/tvmaze/client.ts

const TVMAZE_BASE_URL = "https://api.tvmaze.com";

export type TvmazeShow = {
  id: number;
  name: string;
  language: string | null;
  premiered: string | null;
  status: string | null;
  summary: string | null;
  image?: { original?: string | null };
  officialSite?: string | null;
  network?: { country?: { code?: string | null } };
  webChannel?: { country?: { code?: string | null } };
  genres?: string[];
};

export type TvmazeEpisode = {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate?: string | null;
  summary?: string | null;
};

export async function fetchUpdatedShowIdsSinceDay(): Promise<number[]> {
  const url = `${TVMAZE_BASE_URL}/updates/shows?since=day`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TVMaze updates error ${res.status}: ${await res.text()}`);
  }
  const data: Record<string, number> = await res.json();
  return Object.keys(data).map((id) => Number(id));
}

export async function fetchShowById(id: number): Promise<TvmazeShow> {
  const url = `${TVMAZE_BASE_URL}/shows/${id}`;
  const res = await fetch(url);
  
  if (res.status === 404) {
    console.warn(`TVMaze show ${id} not found (404), skipping`);
    return null;
  }
  
  if (!res.ok) {
    throw new Error(`TVMaze show ${id} error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}


export async function fetchUpdatedShowIdsSince(
  since: number
): Promise<Record<string, number>> {
  const url = `${TVMAZE_BASE_URL}/updates/shows?since=${since}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TVMaze updates error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchShowCast(showId: number) {
  const res = await fetch(`${TVMAZE_BASE_URL}/shows/${showId}/cast`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TVMaze cast for show ${showId} error ${res.status}: ${body}`);
  }
  return (await res.json()) as any[]; 
}

export async function fetchShowEpisodes(showId: number): Promise<TvmazeEpisode[]> {
  const url = `${TVMAZE_BASE_URL}/shows/${showId}/episodes`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TVMaze episodes for show ${showId} error ${res.status}: ${body}`);
  }
  return (await res.json()) as TvmazeEpisode[];
}

export async function fetchEpisodeGuestCast(episodeId: number) {
  const url = `${TVMAZE_BASE_URL}/episodes/${episodeId}/guestcast`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TVMaze guest cast for episode ${episodeId} error ${res.status}: ${body}`);
  }
  return (await res.json()) as any[];
}
