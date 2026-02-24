// src/tvmaze/client.ts

const TVMAZE_BASE_URL = "https://api.tvmaze.com";

export type ShowUpdatesMap = Record<string, number>;

export async function fetchShowUpdates(): Promise<ShowUpdatesMap> {
  const url = `${TVMAZE_BASE_URL}/updates/shows`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TVMaze error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
