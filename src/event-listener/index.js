import {
  getKafkaClient,
  sendFillLogMessageToKafka,
} from "../shared/kafka/client";
import { getFermiProgram } from "../shared/solana/utils";

class TradeEventListener {
  constructor() {
    this.kafkaProducer = null;
    this.isShuttingDown = false;
  }

  validateTradeEvent(event, signature) {
    if (!event || !signature) {
      throw new Error("Event and signature are required");
    }

    // Validate required fields
    const requiredFields = [
      "market",
      "taker_side",
      "maker",
      "taker",
      "price",
      "size",
      "time",
    ];

    for (const field of requiredFields) {
      if (!event[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate taker_side is 0 or 1
    if (![0, 1].includes(event.taker_side)) {
      throw new Error(
        `Invalid taker_side: ${event.taker_side}. Must be 0 or 1`
      );
    }

    // Validate numeric fields
    const numericFields = ["price", "size"];
    for (const field of numericFields) {
      const value = Number.parseFloat(event[field].toString());
      if (Number.isNaN(value) || value <= 0) {
        throw new Error(`Invalid ${field}: ${event[field]}`);
      }
    }
  }

  convertTradeEventToKafkaMessage(event, signature) {
    this.validateTradeEvent(event, signature);

    // Log raw event for debugging
    console.log("Raw Fill Log Event:", {
      signature,
      market: event.market?.toString(),
      taker_side: event.taker_side,
      price: event.price?.toString(),
      size: event.size?.toString(),
      time: event.time?.toISOString(),
    });

    return {
      signature,
      timestamp: event.time.toISOString(),
      market: event.market.toString(),
      taker_side: event.taker_side,
      maker: event.maker.toString(),
      taker: event.taker.toString(),
      price: event.price.toString(),
      quantity: event.size.toString(), // Rename to match DB schema
    };
  }

  async handleFillLogMessage(event, slot, signature) {
    if (this.isShuttingDown) {
      console.log("Skipping message processing - shutdown in progress");
      return;
    }

    if (!this.kafkaProducer) {
      throw new Error("Fatal:: Kafka Producer not found");
    }

    try {
      const message = this.convertTradeEventToKafkaMessage(event, signature);
      await sendFillLogMessageToKafka(this.kafkaProducer, message);

      console.log("Successfully sent trade message to Kafka:", {
        signature,
        market: message.market,
        taker_side: message.taker_side,
        price: message.price,
        quantity: message.quantity,
      });
    } catch (error) {
      console.error("Failed to send trade message to Kafka:", error, {
        signature,
        event: JSON.stringify(event),
      });
      throw error;
    }
  }

  async shutdown() {
    console.log("Shutting down gracefully...");
    this.isShuttingDown = true;

    try {
      if (this.kafkaProducer) {
        await this.kafkaProducer.disconnect();
        console.log("Kafka producer disconnected");
      }
    } catch (error) {
      console.error("Error during shutdown:", error);
    }

    process.exit(0);
  }

  async initialize() {
    try {
      // Get the kafka client and create producer
      const kafka = getKafkaClient();
      this.kafkaProducer = kafka.producer();

      // Connect the kafka producer
      await this.kafkaProducer.connect();
      console.log("Connected to Kafka producer");

      // Get the fermi program
      const fermiProgram = getFermiProgram();

      // Bind the event handler to this instance
      const boundHandler = this.handleFillLogMessage.bind(this);

      // Add the FillLog event listener
      fermiProgram.addEventListener("FillLog", boundHandler);
      console.log("Started listening for FillLog events");

      // Handle graceful shutdown
      process.on("SIGTERM", this.shutdown.bind(this));
      process.on("SIGINT", this.shutdown.bind(this));

      console.log("Trade Event Listener initialized successfully");
    } catch (error) {
      console.error("Failed to initialize event listener:", error);
      await this.shutdown();
      process.exit(1);
    }
  }
}

// Create and start the service
const service = new TradeEventListener();

service.initialize().catch((error) => {
  console.error("Failed to start service:", error);
  process.exit(1);
});
