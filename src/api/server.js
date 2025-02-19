import express from "express";
import cors from "cors";
import { handleHealth } from "./routes/health.js";
import { registerCandlesRoutes } from "./routes/candles.js";

export const createServer = () => {
  const app = express();
  app.use(cors());

  // Register routes
  app.get("/health", handleHealth);
  registerCandlesRoutes(app);

  return app;
};

export const startServer = (app, port = 3001) => {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(server);
    });
  });
};
