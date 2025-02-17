import pg from "pg";
import { TSDB_CONFIG } from "./config.js";

/**
 * Create a tsdb client
 * @param {string} connectionString - The connection string for the tsdb
 * @returns {Promise<Client>} A promise that resolves to the tsdb client
 */
export async function createTsdbClient(connectionString) {
  const client = new pg.Client({
    connectionString: connectionString || TSDB_CONFIG.DB_URL,
  });

  return client;
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
