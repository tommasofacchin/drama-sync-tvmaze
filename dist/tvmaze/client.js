"use strict";
// src/tvmaze/client.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUpdatedShowIdsSinceDay = fetchUpdatedShowIdsSinceDay;
exports.fetchShowById = fetchShowById;
exports.fetchUpdatedShowIdsSince = fetchUpdatedShowIdsSince;
exports.fetchShowCast = fetchShowCast;
exports.fetchShowEpisodes = fetchShowEpisodes;
exports.fetchEpisodeGuestCast = fetchEpisodeGuestCast;
const TVMAZE_BASE_URL = "https://api.tvmaze.com";
async function fetchUpdatedShowIdsSinceDay() {
    const url = `${TVMAZE_BASE_URL}/updates/shows?since=day`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`TVMaze updates error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return Object.keys(data).map((id) => Number(id));
}
async function fetchShowById(id) {
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
async function fetchUpdatedShowIdsSince(since) {
    const url = `${TVMAZE_BASE_URL}/updates/shows?since=${since}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`TVMaze updates error ${res.status}: ${await res.text()}`);
    }
    return res.json();
}
async function fetchShowCast(showId) {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${showId}/cast`);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`TVMaze cast for show ${showId} error ${res.status}: ${body}`);
    }
    return (await res.json());
}
async function fetchShowEpisodes(showId) {
    const url = `${TVMAZE_BASE_URL}/shows/${showId}/episodes`;
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`TVMaze episodes for show ${showId} error ${res.status}: ${body}`);
    }
    return (await res.json());
}
async function fetchEpisodeGuestCast(episodeId) {
    const url = `${TVMAZE_BASE_URL}/episodes/${episodeId}/guestcast`;
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`TVMaze guest cast for episode ${episodeId} error ${res.status}: ${body}`);
    }
    return (await res.json());
}
