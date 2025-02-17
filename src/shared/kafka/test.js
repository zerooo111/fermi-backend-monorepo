import {
  createKafkaClient,
  createKafkaProducer,
  createKafkaConsumer,
} from "./client.js";

async function testKafka() {
  let client = null;
  let producer = null;
  let consumer = null;

  try {
    // Create and test client
    console.log("Creating Kafka client...");
    client = createKafkaClient();
    console.log("✅ Kafka client created");

    // Create and test producer
    console.log("Creating producer...");
    producer = await createKafkaProducer(client);
    console.log("✅ Producer created and connected");

    // Create and test consumer
    console.log("Creating consumer...");
    consumer = await createKafkaConsumer(client);
    console.log("✅ Consumer created and connected");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.stack) console.error(error.stack);
    throw error;
  } finally {
    // Cleanup
    console.log("\nCleaning up connections...");
    try {
      if (producer) {
        await producer.disconnect();
        console.log("✅ Producer disconnected");
      }
      if (consumer) {
        await consumer.disconnect();
        console.log("✅ Consumer disconnected");
      }
    } catch (error) {
      console.error("❌ Error during cleanup:", error.message);
    }
  }
}

testKafka()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed");
    process.exit(1);
  });
