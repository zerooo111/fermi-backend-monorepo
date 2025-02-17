-- Create table with a unique constraint
CREATE TABLE IF NOT EXISTS trades (
  id UUID,
  time TIMESTAMPTZ NOT NULL,
  market TEXT NOT NULL,
  taker_side SMALLINT NOT NULL CHECK (taker_side BETWEEN 0 AND 1),
  maker TEXT NOT NULL,
  taker TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
);

-- Create the hypertable
SELECT create_hypertable(
  'trades',
  'time',
  chunk_time_interval => interval '1 day'  -- Optional chunk interval
);

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS trades_market_time_idx 
  ON trades (market, time DESC);

CREATE INDEX IF NOT EXISTS trades_maker_time_idx 
  ON trades (maker, time DESC);

CREATE INDEX IF NOT EXISTS trades_taker_time_idx 
  ON trades (taker, time DESC);