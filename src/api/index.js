import { getTsdbClient } from "../shared/tsdb/client.js";
import { createServer, startServer } from "./server.js";

const main = async () => {
  try {
    // Initialize global tsdb client
    const tsdbClient = await getTsdbClient();
    await tsdbClient.connect();
    console.log("Connected to TSDB");

    // Create and initialize the express app
    const app = createServer();
    app.locals.tsdbClient = tsdbClient;

    // Start the server
    const server = await startServer(app);

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(() => console.log("Express server closed"));
      await tsdbClient.end();
      console.log("Database connection closed");
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

main();
