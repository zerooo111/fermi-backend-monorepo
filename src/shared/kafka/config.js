import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

function loadKafkaCert() {
  const certPath = path.join(process.cwd(), 'certs', 'ca.pem');
  try {
    return fs.readFileSync(certPath, 'utf-8');
  } catch (error) {
    console.warn('Warning: Failed to load Kafka certificate:', error.message);
    return null;
  }
}

const cert = loadKafkaCert();

export const KAFKA_CONFIG = {
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKERS], // Wrap in array since brokers expects array
  ...(cert && {
    ssl: {
      ca: cert,
      rejectUnauthorized: false,
    },
  }),
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
  retry: {
    initialRetryTime: 100,
    retries: 5,
  },
};

// Consumer group IDs
export const KAFKA_FERMI_TRADES_CONSUMER_GROUP =
  process.env.KAFKA_FERMI_TRADES_CONSUMER_GROUP || 'fermi_trades_consumer';

// Topics
export const KAFKA_TOPICS = {
  TRADES: process.env.KAFKA_FERMI_TRADES_TOPIC || 'fermi_trades',
};
