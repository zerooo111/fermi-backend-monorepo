import { Kafka } from "kafkajs";
import {
  KAFKA_CONFIG,
  KAFKA_FERMI_TRADES_CONSUMER_GROUP,
  KAFKA_TOPICS,
} from "./config.js";

export function getKafkaClient() {
  if (!getKafkaClient._cached) {
    getKafkaClient._cached = new Kafka(KAFKA_CONFIG);
  }
  return getKafkaClient._cached;
}

export async function createKafkaProducer(kafka) {
  const producer = kafka.producer();
  try {
    await producer.connect();
    console.log("Producer connected successfully");
    return producer;
  } catch (error) {
    console.error("Failed to connect producer:", error);
    throw error;
  }
}

export async function createKafkaConsumer(kafka) {
  const consumer = kafka.consumer({
    groupId: KAFKA_FERMI_TRADES_CONSUMER_GROUP,
    retry: { retries: 3 },
  });
  try {
    await consumer.connect();
    console.log("Consumer connected successfully");
    return consumer;
  } catch (error) {
    console.error("Failed to connect consumer:", error);
    throw error;
  }
}


export async function sendMessageToKafka(producer, topic, message) {
  try {
    if (!message) {
      throw new Error("Message cannot be empty");
    }
    const result = await producer.send({
      topic,
      messages: [{ value: message }],
    });
    console.log(`Message sent successfully to topic ${topic}`);
    return result;
  } catch (error) {
    console.error(`Failed to send message to topic ${topic}:`, error);
    throw error;
  }
}

export async function sendFillLogMessageToKafka(producer, message) {
  return await sendMessageToKafka(producer, KAFKA_TOPICS.TRADES, message);
}

export async function subscribeToTopic(consumer, topic, callback) {
  try {
    await consumer.subscribe({ topic, fromBeginning: true });
    console.log(`Subscribed to topic ${topic}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await callback(message);
          console.log(
            `Processed message from topic ${topic}, partition ${partition}`
          );
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
          // Depending on your requirements, you might want to:
          // - Skip the message
          // - Retry processing
          // - Send to a dead letter queue
          throw error;
        }
      },
    });
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topic}:`, error);
    throw error;
  }
}
