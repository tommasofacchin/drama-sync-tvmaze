"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/config.ts
require("dotenv/config");
exports.config = {
    databaseUrl: process.env.DATABASE_URL,
};
if (!exports.config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
}
