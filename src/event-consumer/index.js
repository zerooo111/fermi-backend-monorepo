/**
 * 1. Init
 *  - Kafka consumer
 *  - Timescale db instance
 * 2. Connect
 *  - connect the consumer
 *  - connect the timescale db
 * 3. Save to db when message received from kafka
 */

import {
  KAFKA_FERMI_TRADES_CONSUMER_GROUP,
  KAFKA_TOPICS,
} from "../shared/kafka/config";
import { getTsDbClient } from "../shared/tsdb/client";
import { getKafkaClient } from "../shared/kafka/client";

class TradeEventConsumer {
  constructor() {
    this.tsdbClient = null;
    this.consumer = null;
    this.isShuttingDown = false;
  }

  validateTrade(trade) {
    const requiredFields = [
      "signature",
      "timestamp",
      "market",
      "taker_side",
      "maker",
      "taker",
      "price",
      "quantity",
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (trade[field] === undefined || trade[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate taker_side
    if (![0, 1].includes(trade.taker_side)) {
      throw new Error(
        `Invalid taker_side: ${trade.taker_side}. Must be 0 or 1`
      );
    }

    // Validate numeric fields
    const numericFields = ["price", "quantity"];
    for (const field of numericFields) {
      const value = Number.parseFloat(trade[field]);
      if (Number.isNaN(value) || value <= 0) {
        throw new Error(`Invalid ${field}: ${trade[field]}`);
      }
    }

    // Validate timestamp
    const timestamp = new Date(trade.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp: ${trade.timestamp}`);
    }

    return true;
  }

  async insertTrade(trade) {
    try {
      this.validateTrade(trade);

      await this.tsdbClient.query(
        `INSERT INTO trades (signature, time, market, taker_side, maker, taker, price, quantity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          trade.signature,
          trade.timestamp,
          trade.market,
          trade.taker_side,
          trade.maker,
          trade.taker,
          Number.parseFloat(trade.price),
          Number.parseFloat(trade.quantity),
        ]
      );

      console.log("Successfully inserted trade:", {
        signature: trade.signature,
        market: trade.market,
        taker_side: trade.taker_side,
        price: trade.price,
        quantity: trade.quantity,
      });
    } catch (error) {
      console.error("Failed to insert trade:", error, {
        trade: JSON.stringify(trade),
      });
      throw error;
    }
  }

  async processMessage(message) {
    if (this.isShuttingDown) {
      console.log("Skipping message processing - shutdown in progress");
      return;
    }

    try {
      const trade = JSON.parse(message.value.toString());
      await this.insertTrade(trade);
    } catch (error) {
      console.error("Error processing message:", error);
      // Don't throw here - we want to continue processing messages
    }
  }

  async shutdown() {
    console.log("Shutting down gracefully...");
    this.isShuttingDown = true;

    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        console.log("Kafka consumer disconnected");
      }
      if (this.tsdbClient) {
        await this.tsdbClient.end();
        console.log("TSDB connection closed");
      }
    } catch (error) {
      console.error("Error during shutdown:", error);
    }

    process.exit(0);
  }

  async initialize() {
    try {
      // Initialize clients
      const kafka = getKafkaClient();
      this.consumer = kafka.consumer({
        groupId: KAFKA_FERMI_TRADES_CONSUMER_GROUP,
      });
      this.tsdbClient = getTsDbClient();

      // Connect clients
      await Promise.all([this.consumer.connect(), this.tsdbClient.connect()]);
      console.log("Connected to Kafka consumer and TSDB");

      // Subscribe to topic
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.FERMI_TRADES });
      console.log("Subscribed to topic:", KAFKA_TOPICS.FERMI_TRADES);

      // Bind the message processor to this instance
      const boundProcessor = this.processMessage.bind(this);

      // Start consuming messages
      await this.consumer.run({
        eachMessage: boundProcessor,
      });
      console.log("Started consuming messages");

      // Handle graceful shutdown
      process.on("SIGTERM", this.shutdown.bind(this));
      process.on("SIGINT", this.shutdown.bind(this));

      console.log("Trade Event Consumer initialized successfully");
    } catch (error) {
      console.error("Failed to initialize event consumer:", error);
      await this.shutdown();
      process.exit(1);
    }
  }
}

// Create and start the service
const service = new TradeEventConsumer();

service.initialize().catch((error) => {
  console.error("Failed to start service:", error);
  process.exit(1);
});
