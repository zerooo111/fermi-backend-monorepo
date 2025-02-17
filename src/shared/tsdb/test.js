import { createTsdbClient } from "./client.js";

export async function testTsdbConnection() {
  const client = await createTsdbClient();
  console.log("✅ tsdb client initialized");

  await client.connect();

  try {
    const result = await client.query("SELECT NOW()");
    console.log("✅ TSDB connection successful", result.rows[0].now);
  } catch (error) {
    console.error("TSDB connection failed:", error);
  } finally {
    await client.end();
    console.log("✅ tsdb client disconnected");
  }
}

const main = async () => {
  await testTsdbConnection();
};

main();
