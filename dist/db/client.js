"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testDbConnection = testDbConnection;
// src/db/client.ts
const pg_1 = require("pg");
const config_1 = require("../config");
exports.pool = new pg_1.Pool({
    connectionString: config_1.config.databaseUrl,
});
async function testDbConnection() {
    const res = await exports.pool.query("SELECT NOW()");
    return res.rows[0].now;
}
