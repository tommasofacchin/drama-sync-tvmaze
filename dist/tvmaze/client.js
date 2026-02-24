"use strict";
// src/tvmaze/client.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchShowUpdates = fetchShowUpdates;
const TVMAZE_BASE_URL = "https://api.tvmaze.com";
async function fetchShowUpdates() {
    const url = `${TVMAZE_BASE_URL}/updates/shows`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`TVMaze error ${res.status}: ${await res.text()}`);
    }
    return res.json();
}
