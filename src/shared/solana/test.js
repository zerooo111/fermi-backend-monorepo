import { Connection } from "@solana/web3.js";
import { SOLANA_CONFIG } from "./config.js";
import { getFermiProgram } from "./utils.js";

export async function testSolanaConnection() {
  try {
    const connection = new Connection(SOLANA_CONFIG.RPC_URL);
    const blockhash = await connection.getLatestBlockhash();
    console.log("✅ solana connection successful", blockhash);
    if (!blockhash) {
      throw new Error("Failed to get latest blockhash");
    }

    const program = await getFermiProgram();
    console.log("✅ fermi program initialized", program);

    if (!program) {
      throw new Error("Failed to get fermi program");
    }
  } catch (error) {
    console.error("❌ solana connection failed", error);
  }
}

testSolanaConnection().catch(console.error);
