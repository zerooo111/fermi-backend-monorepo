import { getTsdbClient } from "../shared/tsdb/client.js";
import { createServer, startServer } from "./server.js";

let server;
let tsdbClient;

const shutdown = async () => {
  console.log("Shutting down gracefully...");
  if (server) {
    server.close(() => console.log("Express server closed"));
  }
  if (tsdbClient) {
    await tsdbClient.end();
    console.log("Database connection closed");
  }
  process.exit(0);
};

// Handle process exits
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const main = async () => {
  try {
    // Initialize global tsdb client
    tsdbClient = await getTsdbClient();
    await tsdbClient.connect();
    console.log("Connected to TSDB");

    // Create and initialize the express app
    const app = createServer();
    app.locals.tsdbClient = tsdbClient;

    // Start the server
    server = await startServer(app);
  } catch (error) {
    console.error("Failed to start the server:", error);
    await shutdown();
    process.exit(1);
  }
};

main();
