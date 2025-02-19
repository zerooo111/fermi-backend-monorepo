export const validIntervals = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "6h",
  "12h",
  "1d",
];

export const validateCandlesRequest = (req, res, next) => {
  const { market, interval, from, to } = req.query;

  if (!market || !interval || !from || !to) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  if (!validIntervals.includes(interval)) {
    return res.status(400).json({ error: "Invalid interval" });
  }

  // Check if from and to are valid unix timestamps
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  next();
};
