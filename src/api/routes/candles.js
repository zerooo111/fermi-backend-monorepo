import { query } from "../../shared/tsdb/client.js";
import { validateCandlesRequest } from "../middleware/validators.js";

export const handleGetCandles = async (req, res) => {
  const startTime = process.hrtime();

  try {
    const { market, interval, from, to } = req.query;

    console.log(
      `[Candles] Request params: market=${market}, interval=${interval}, from=${from}, to=${to}`
    );

    // Timescale db query to fetch candles for the given market, interval, from and to
    const queryStartTime = process.hrtime();
    const result = await query(
      req.app.locals.tsdbClient,
      `
      SELECT
        time_bucket('${interval}', time) AS time,
        FIRST(price, time) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, time) AS close,
        SUM(quantity) AS volume
      FROM trades
      WHERE market = $1
        AND time >= to_timestamp($2)
        AND time <= to_timestamp($3)
      GROUP BY 1, market
      ORDER BY time DESC
    `,
      [market, from, to]
    );
    const queryDuration = process.hrtime(queryStartTime);
    const queryTimeMs = (queryDuration[0] * 1e9 + queryDuration[1]) / 1e6;

    const response = {
      status: "success",
      data: result,
    };

    // Calculate total request time
    const totalDuration = process.hrtime(startTime);
    const totalTimeMs = (totalDuration[0] * 1e9 + totalDuration[1]) / 1e6;

    // Log performance metrics
    console.log({
      type: "PERFORMANCE_METRICS",
      endpoint: "/api/v1/candles",
      metrics: {
        totalTimeMs: Math.round(totalTimeMs),
        queryTimeMs: Math.round(queryTimeMs),
        resultCount: result.length,
        responseSize: JSON.stringify(response).length,
        params: {
          market,
          interval,
          fromTimestamp: from,
          toTimestamp: to,
          timeRangeSeconds: to - from,
        },
      },
    });

    res.status(200).json(response);
  } catch (error) {
    const totalDuration = process.hrtime(startTime);
    const totalTimeMs = (totalDuration[0] * 1e9 + totalDuration[1]) / 1e6;

    console.error({
      type: "ERROR_METRICS",
      endpoint: "/api/v1/candles",
      metrics: {
        totalTimeMs: Math.round(totalTimeMs),
        error: error.message,
        stack: error.stack,
      },
    });

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const registerCandlesRoutes = (app) => {
  app.get("/api/v1/candles", validateCandlesRequest, handleGetCandles);
};
