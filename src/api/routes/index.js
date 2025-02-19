import { handleHealth } from "./health.js";
import { handleGetCandles } from "./candles.js";
import { validateCandlesRequest } from "../middleware/validators.js";

export const registerRoutes = (app) => {
  // Health check endpoint
  app.get("/health", handleHealth);

  // Register market data routes
  app.get("/api/v1/candles", validateCandlesRequest, handleGetCandles);
};
