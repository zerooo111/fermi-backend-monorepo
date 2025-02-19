import pg from "pg";
import { TSDB_CONFIG } from "./config.js";

/**
 * Create a tsdb client
 * @param {string} connectionString - The connection string for the tsdb
 * @returns {Promise<Client>} A promise that resolves to the tsdb client
 */
export function getTsdbClient(connectionString) {
  if (getTsdbClient._client) {
    console.log("Using existing tsdb client");
    return getTsdbClient._client;
  }

  getTsdbClient._client = new pg.Client({
    connectionString: connectionString || TSDB_CONFIG.DB_URL,
  });

  return getTsdbClient._client;
}

/**
 * Query the tsdb
 * @param {Client} client - The tsdb client
 * @param {string} query - The query to execute
 * @param {any[]} params - The parameters to pass to the query
 * @returns {Promise<any[]>} A promise that resolves to the result of the query
 */
export async function query(client, query, params) {
  const result = await client.query(query, params);
  return result.rows;
}
