import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index.js";

export const createServer = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Register all routes
  registerRoutes(app);

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
